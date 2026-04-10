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
        print("Warning: 未设置 DEEPSEEK_API_KEY，/api/chat（含工具）将返回 503。TTS 需火山豆包 OpenSpeech（DOUBAO_TTS_*）。")
    # 启动时打印关键路由，便于确认 8000 上跑的是本服务（避免 404 时误以为是别进程）
    key = [f"{list(r.methods)} {r.path}" for r in app.routes if getattr(r, "path", None) and getattr(r, "methods", None) and ("chat" in r.path or "feedback" in r.path)]
    print("SCS AI Service 已加载:", key, flush=True)
    yield


app = FastAPI(title="SCS AI Service", lifespan=lifespan)

# 现有 API 统一在 /api 下，如 POST /api/chat
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    """访问根路径时返回服务信息，便于确认是 SCS AI Service 且 8000 没被占错。"""
    return {"service": "SCS AI Service", "docs": "/docs", "health": "/health", "chat": "POST /api/chat"}


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
