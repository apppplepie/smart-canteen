"""
AI 服务入口：挂载 /api 路由，保留根路径 /health。供 Spring Boot 转调，后续可接入 LangChain/LangGraph。
"""
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from app.ai_agent import process_message
from dotenv import load_dotenv

from app.routers import api_router

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DEEPSEEK_API_KEY:
        print("Warning: DEEPSEEK_API_KEY not set, /api/chat will return 503.")
    yield


app = FastAPI(title="SCS AI Service", lifespan=lifespan)

# 现有 API 统一在 /api 下，如 POST /api/chat
app.include_router(api_router, prefix="/api")


@app.post("/forward-springboot")
async def forward_to_ai(data: dict):
    user_msg = data.get("message", "")
    ai_reply = process_message(user_msg)
    return {
        "original": user_msg,
        "ai_decision": ai_reply,
        "from_springboot": data
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
