"""
API 路由汇总：挂到 FastAPI 时使用 prefix="/api"，即 /api/chat 等。
"""
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()


class ChatMessage(BaseModel):
    role: str = Field(..., description="system | user | assistant")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "deepseek-chat"
    temperature: float = 0.6
    max_tokens: int = 1024


class ChatResponse(BaseModel):
    content: str


api_router = APIRouter()


@api_router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY not configured")
    payload = {
        "model": req.model,
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
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
        content = "抱歉，我刚才走神了，能再说一遍吗？"
    return ChatResponse(content=content)
