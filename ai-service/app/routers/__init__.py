"""
API 路由汇总：挂到 FastAPI 时使用 prefix="/api"，即 /api/chat 等。
POST /api/chat 走带工具的 Agent，可根据用户指令查库并回复。
POST /api/chat/suggest-title 用 AI 将用户首条消息总结为 8 字以内标题。
"""
import asyncio
import json
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1").rstrip("/") + "/chat/completions"
TITLE_MAX_LEN = 8


class ChatResponse(BaseModel):
    content: str


class SuggestTitleBody(BaseModel):
    message: str = ""


class SuggestTitleResponse(BaseModel):
    title: str


api_router = APIRouter()


def _normalize_messages(raw: list) -> list[dict]:
    """接受 Spring Boot / 前端发来的 messages，统一为 [{"role": str, "content": str}]"""
    out = []
    for item in raw:
        if isinstance(item, dict):
            role = item.get("role") or "user"
            content = item.get("content") or ""
            out.append({"role": str(role), "content": str(content)})
        else:
            out.append({"role": "user", "content": str(item)})
    return out


def _last_user_content(messages: list[dict]) -> str:
    """取最后一条用户消息内容，供 Agent 使用。"""
    for m in reversed(messages):
        if m.get("role") == "user":
            return (m.get("content") or "").strip()
    return ""


@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: Request) -> ChatResponse:
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY not configured")
    raw_bytes = await request.body()
    if len(raw_bytes) == 0:
        logging.warning("chat body 为空, body_len=0")
        raise HTTPException(status_code=422, detail="请求体为空")
    try:
        req = json.loads(raw_bytes.decode("utf-8"))
    except Exception as e:
        logging.warning("chat body parse failed: len=%d, err=%s, head=%s", len(raw_bytes), e, raw_bytes[:100])
        raise HTTPException(status_code=422, detail="请求体须为 JSON 对象") from e
    if not isinstance(req, dict):
        raise HTTPException(status_code=422, detail="请求体须为 JSON 对象")
    raw_messages = req.get("messages")
    if not isinstance(raw_messages, list) or len(raw_messages) == 0:
        logging.warning("chat invalid messages: req keys=%s", list(req.keys()) if isinstance(req, dict) else req)
        raise HTTPException(status_code=422, detail="messages 必填且为非空数组")
    messages = _normalize_messages(raw_messages)
    last_user = _last_user_content(messages)
    if not last_user:
        raise HTTPException(status_code=422, detail="messages 中需至少有一条 user 消息")

    # clientType: admin | screen | mobile（缺省 mobile）；admin 时 role 由后端传入，用于 RBAC + Tool 白名单
    client_type = (req.get("clientType") or "mobile").strip().lower()
    if client_type not in ("admin", "screen", "mobile"):
        client_type = "mobile"
    role = req.get("role")  # 仅 admin 使用，Spring Boot 根据 userId 解析后传入

    from app.ai_agent import process_message
    content = await asyncio.to_thread(process_message, last_user, client_type, role)

    print("[Agent 回复]", content[:300] + ("..." if len(content) > 300 else ""), flush=True)
    logging.info("[Agent 回复] %s", content if len(content) <= 500 else content[:500] + "...")
    return ChatResponse(content=content)


@api_router.post("/chat/suggest-title", response_model=SuggestTitleResponse)
async def suggest_title(body: SuggestTitleBody) -> SuggestTitleResponse:
    """将用户首条消息总结为 8 字以内的中文标题，供新会话存储用。"""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY not configured")
    msg = (body.message or "").strip()
    if not msg:
        return SuggestTitleResponse(title="新对话")
    prompt = f"将下面用户的第一条消息总结为{TITLE_MAX_LEN}个字以内的中文标题，只返回标题不要其他内容、不要引号：\n\n{msg}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                DEEPSEEK_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                },
                json={
                    "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 32,
                },
            )
        if r.status_code != 200:
            return SuggestTitleResponse(title=msg[:TITLE_MAX_LEN] if msg else "新对话")
        data = r.json()
        raw = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
            .strip('"\'')
        )
        title = raw[:TITLE_MAX_LEN] if raw else (msg[:TITLE_MAX_LEN] if msg else "新对话")
        return SuggestTitleResponse(title=title or "新对话")
    except Exception as e:
        logging.warning("suggest-title failed: %s", e)
        return SuggestTitleResponse(title=msg[:TITLE_MAX_LEN] if msg else "新对话")
