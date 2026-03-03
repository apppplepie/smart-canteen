"""
API 路由汇总：挂到 FastAPI 时使用 prefix="/api"，即 /api/chat 等。
"""
import json
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()


class ChatResponse(BaseModel):
    content: str


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
    payload = {
        "model": req.get("model") or "deepseek-chat",
        "messages": messages,
        "temperature": float(req.get("temperature", 0.6)),
        "max_tokens": int(req.get("max_tokens", 1024)),
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            DEEPSEEK_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            },
            json=payload,
        )
    if r.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"DeepSeek API error {r.status_code}: {r.text[:500]}",
        )
    data = r.json()
    content = (
        (data.get("choices") or [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        # 方便在终端直接看到：DeepSeek 原始结构可能和预期不同
        print("[DeepSeek] 返回空 content，原始 data.keys():", list(data.keys()), "choices[0]:", (data.get("choices") or [{}])[0], flush=True)
        logging.warning("DeepSeek 返回空 content, response keys=%s, choices[0]=%s", list(data.keys()), (data.get("choices") or [{}])[0])
        content = "连上了fastapi，但deepseek返回空content"
    # 终端可见：最终返回给前端的回复（来自 DeepSeek 或上面的 fallback）
    print("[DeepSeek 回复]", content[:300] + ("..." if len(content) > 300 else ""), flush=True)
    logging.info("[DeepSeek 回复] %s", content if len(content) <= 500 else content[:500] + "...")
    return ChatResponse(content=content)
