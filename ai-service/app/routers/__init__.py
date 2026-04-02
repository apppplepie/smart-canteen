"""
API 路由汇总：挂到 FastAPI 时使用 prefix="/api"，即 /api/chat 等。
POST /api/chat 走带工具的 Agent，可根据用户指令查库并回复。
POST /api/chat/suggest-title 用 AI 将用户首条消息总结为 8 字以内标题。
"""
import asyncio
import json
import logging
import os
import hashlib
import re
import time
import base64

import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1").rstrip("/") + "/chat/completions"
TITLE_MAX_LEN = 8
SPRING_BOOT_BASE_URL = os.getenv("SPRING_BOOT_BASE_URL", "http://localhost:8081").rstrip("/")
COQUI_TTS_BASE_URL = os.getenv("COQUI_TTS_BASE_URL", "http://localhost:5004").rstrip("/")
DOUBAO_TTS_URL = os.getenv("DOUBAO_TTS_URL", "").strip()  # 预留：如 https://ark.cn-beijing.volces.com/api/v3/audio/speech
DOUBAO_TTS_API_KEY = os.getenv("DOUBAO_TTS_API_KEY", "").strip()
DOUBAO_TTS_MODEL = os.getenv("DOUBAO_TTS_MODEL", "doubao-tts").strip()
WHISPER_LOCAL_URL = os.getenv("WHISPER_LOCAL_URL", "http://localhost:9000/v1/audio/transcriptions").strip()
DOUBAO_ASR_URL = os.getenv("DOUBAO_ASR_URL", "").strip()
DOUBAO_ASR_API_KEY = os.getenv("DOUBAO_ASR_API_KEY", "").strip()
DOUBAO_ASR_MODEL = os.getenv("DOUBAO_ASR_MODEL", "doubao-asr").strip()


class ChatResponse(BaseModel):
    content: str
    tool_calls: list | None = None  # assistant 发起的 tool 调用列表
    suggestions: list[str] | None = None  # 前端快捷建议


class SuggestTitleBody(BaseModel):
    message: str = ""


class SuggestTitleResponse(BaseModel):
    title: str


class SummarizeBody(BaseModel):
    messages: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


class SummarizeResponse(BaseModel):
    summary: str


class FeedbackAnalyzeBody(BaseModel):
    postId: int
    content: str = ""
    feedbackType: str = "other"


class FeedbackAnalyzeResponse(BaseModel):
    ai_suggestion: str


class EmbeddingRequest(BaseModel):
    input: str
    model: str = "text-embedding-3-large"


class TtsRequest(BaseModel):
    text: str
    voice: str = "zh-CN-XiaoxiaoNeural"
    speed: float = 1.0


class TtsResponse(BaseModel):
    provider: str
    audioBase64: str
    format: str = "wav"


class SttResponse(BaseModel):
    provider: str
    text: str
    language: str = "zh"


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


async def _write_audit_log(
    user_id: int | None,
    client_type: str,
    last_user: str,
    content: str,
    tool_calls: list | None,
) -> None:
    """
    最小审计落库（best effort）：
    - 写入 backend 的 audit_logs 表；
    - 失败不影响主流程，仅打印 warning。
    """
    details_obj = {
        "clientType": client_type,
        "userInputPreview": (last_user or "")[:200],
        "replyPreview": (content or "")[:200],
        "toolCallsCount": len(tool_calls or []),
        "toolCalls": tool_calls or [],
    }
    payload = {
        "actorId": user_id,
        "action": "ai_chat",
        "objectType": "chat",
        "objectId": client_type,
        "details": json.dumps(details_obj, ensure_ascii=False),
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            await client.post(f"{SPRING_BOOT_BASE_URL}/api/v1/data/audit_logs", json=payload)
    except Exception as e:
        logging.warning("audit log write failed: %s", e)


def _hash_embedding(text: str, dim: int = 256) -> list[float]:
    """
    轻量本地 embedding（演示用）：
    - 可重复、稳定
    - 输出归一化向量
    """
    normalized = (text or "").strip().lower()
    if not normalized:
        return [0.0] * dim

    tokens = [t for t in re.split(r"[^\w\u4e00-\u9fff]+", normalized) if t]
    if not tokens:
        tokens = [normalized]

    vec = [0.0] * dim
    for token in tokens:
        for i in range(dim):
            raw = hashlib.sha256(f"{token}:{i}".encode("utf-8")).digest()
            # 映射到 [-1, 1]
            val = (int.from_bytes(raw[:4], "big", signed=False) / 0xFFFFFFFF) * 2 - 1
            vec[i] += float(val)

    norm = sum(v * v for v in vec) ** 0.5
    if norm <= 1e-12:
        return [0.0] * dim
    return [v / norm for v in vec]


async def _chat_handler(request: Request) -> ChatResponse:
    logging.info("[chat] 1/3 收到 POST /api/chat")
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

    context_summary = req.get("context_summary") or req.get("contextSummary")
    if isinstance(context_summary, str) and not context_summary.strip():
        context_summary = None

    client_type = (req.get("clientType") or "mobile").strip().lower()
    if client_type not in ("admin", "screen", "mobile"):
        client_type = "mobile"
    role = req.get("role")
    user_id = req.get("userId")
    logging.info("[chat] 2/3 调用 process_message clientType=%s messagesLen=%s userId=%s", client_type, len(messages), user_id)

    from app.ai_agent import process_message
    result = await asyncio.to_thread(process_message, messages, context_summary, client_type, role, user_id)
    if isinstance(result, str):
        result = {"content": result, "tool_calls": None, "suggestions": None}
    content = (result.get("content") or "").strip() or "（无文本回复）"
    tool_calls = result.get("tool_calls")
    suggestions = result.get("suggestions")

    try:
        actor_id = int(user_id) if user_id is not None else None
    except (TypeError, ValueError):
        actor_id = None
    await _write_audit_log(actor_id, client_type, last_user, content, tool_calls)

    print("[Agent 回复]", content[:300] + ("..." if len(content) > 300 else ""), flush=True)
    logging.info("[chat] 3/3 返回 contentLen=%s", len(content))
    return ChatResponse(content=content, tool_calls=tool_calls, suggestions=suggestions)


# 同时注册 /chat 和 /chat/，避免因尾斜杠导致 404
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: Request) -> ChatResponse:
    return await _chat_handler(request)


@api_router.post("/chat/", response_model=ChatResponse)
async def chat_trailing_slash(request: Request) -> ChatResponse:
    return await _chat_handler(request)


@api_router.post("/chat/summarize", response_model=SummarizeResponse)
async def summarize_conversation(body: SummarizeBody) -> SummarizeResponse:
    """将一段对话总结为 500 字以内的小结，供超过 5 轮时带上下文回复。"""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY not configured")
    messages = body.messages or []
    if not messages:
        return SummarizeResponse(summary="")
    from app.ai_agent import summarize_messages
    summary = await asyncio.to_thread(summarize_messages, messages)
    return SummarizeResponse(summary=summary or "")


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


@api_router.post("/feedback/analyze", response_model=FeedbackAnalyzeResponse)
async def feedback_analyze(body: FeedbackAnalyzeBody) -> FeedbackAnalyzeResponse:
    """后台任务：对一条反馈做 AI 分析并写回 posts 表 ai_suggestion（方案 B，由 Agent 调 Spring Boot PATCH）。"""
    logging.info("[feedback/analyze] 1/3 收到请求 postId=%s, contentLen=%s, feedbackType=%s", body.postId, len(body.content or ""), body.feedbackType)
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY not configured")
    from app.ai_agent import run_feedback_analyzer
    logging.info("[feedback/analyze] 2/3 开始 run_feedback_analyzer ...")
    suggestion = await asyncio.to_thread(
        run_feedback_analyzer,
        body.postId,
        body.content or "",
        body.feedbackType or "other",
    )
    logging.info("[feedback/analyze] 3/3 完成 suggestionLen=%s", len(suggestion or ""))
    return FeedbackAnalyzeResponse(ai_suggestion=suggestion or "")


@api_router.post("/embeddings")
async def embeddings(body: EmbeddingRequest):
    """
    向量接口（给 Spring Boot 语义检索调用）：
    - 请求: {"input":"...", "model":"..."}
    - 返回兼容 OpenAI 样式，同时提供简版 embedding 字段
    """
    text = (body.input or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="input 不能为空")
    vector = await asyncio.to_thread(_hash_embedding, text, 256)
    model_name = (body.model or "local-ai-embedding").strip() or "local-ai-embedding"
    prompt_tokens = max(1, len(text))
    created = int(time.time())
    logging.info("[embeddings] provider=local-hash model=%s inputLen=%s dim=%s", model_name, len(text), len(vector))
    return {
        "id": f"embd-{hashlib.md5(text.encode('utf-8')).hexdigest()[:12]}",
        "object": "list",
        "created": created,
        "model": model_name,
        "data": [
            {
                "object": "embedding",
                "index": 0,
                "embedding": vector
            }
        ],
        "embedding": vector,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "total_tokens": prompt_tokens
        }
    }


async def _coqui_tts(text: str, voice: str, speed: float) -> bytes:
    """
    Coqui 本地 TTS（最小实现）：
    - 默认请求 /api/tts
    - 若容器镜像接口不同，可调整这里的 path/payload。
    """
    payload = {
        "text": text,
        "speaker": voice,
        "speed": speed,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{COQUI_TTS_BASE_URL}/api/tts",
            json=payload,
        )
    if r.status_code >= 400:
        raise RuntimeError(f"coqui failed: {r.status_code} {r.text[:200]}")
    return r.content


async def _doubao_tts(text: str, voice: str, speed: float) -> bytes:
    """
    豆包 TTS 回退（占位实现）：
    - 未配置 DOUBAO_TTS_URL / DOUBAO_TTS_API_KEY 时直接报错；
    - 走统一 HTTP 调用，后续按真实接口字段替换。
    """
    if not DOUBAO_TTS_URL or not DOUBAO_TTS_API_KEY:
        raise RuntimeError("doubao tts not configured")
    payload = {
        "model": DOUBAO_TTS_MODEL,
        "text": text,
        "voice": voice,
        "speed": speed,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            DOUBAO_TTS_URL,
            headers={
                "Authorization": f"Bearer {DOUBAO_TTS_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    if r.status_code >= 400:
        raise RuntimeError(f"doubao failed: {r.status_code} {r.text[:200]}")
    return r.content


@api_router.post("/tts/synthesize", response_model=TtsResponse)
async def tts_synthesize(body: TtsRequest) -> TtsResponse:
    """
    文本转语音：
    1) 优先 Coqui（本地 docker 5004）
    2) 失败后回退豆包 TTS（占位）
    """
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="text 不能为空")
    if len(text) > 800:
        raise HTTPException(status_code=422, detail="text 过长，建议 <= 800 字")

    try:
        audio_bytes = await _coqui_tts(text, body.voice, body.speed)
        provider = "coqui"
    except Exception as coqui_err:
        logging.warning("coqui tts failed, fallback doubao: %s", coqui_err)
        try:
            audio_bytes = await _doubao_tts(text, body.voice, body.speed)
            provider = "doubao"
        except Exception as doubao_err:
            raise HTTPException(
                status_code=502,
                detail=f"TTS 服务不可用: coqui={coqui_err}; doubao={doubao_err}",
            ) from doubao_err

    return TtsResponse(
        provider=provider,
        audioBase64=base64.b64encode(audio_bytes).decode("utf-8"),
        format="wav",
    )


async def _whisper_stt(audio_bytes: bytes, filename: str, language: str) -> str:
    files = {"file": (filename or "audio.wav", audio_bytes, "application/octet-stream")}
    data = {"model": "whisper-1", "language": language}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(WHISPER_LOCAL_URL, data=data, files=files)
    if r.status_code >= 400:
        raise RuntimeError(f"whisper failed: {r.status_code} {r.text[:200]}")
    try:
        payload = r.json()
        text = (payload.get("text") or "").strip()
        if text:
            return text
    except Exception:
        pass
    raw = (r.text or "").strip()
    if raw:
        return raw
    raise RuntimeError("whisper empty text")


async def _doubao_asr(audio_bytes: bytes, filename: str, language: str) -> str:
    if not DOUBAO_ASR_URL or not DOUBAO_ASR_API_KEY:
        raise RuntimeError("doubao asr not configured")
    files = {"file": (filename or "audio.wav", audio_bytes, "application/octet-stream")}
    data = {"model": DOUBAO_ASR_MODEL, "language": language}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            DOUBAO_ASR_URL,
            headers={"Authorization": f"Bearer {DOUBAO_ASR_API_KEY}"},
            data=data,
            files=files,
        )
    if r.status_code >= 400:
        raise RuntimeError(f"doubao asr failed: {r.status_code} {r.text[:200]}")
    try:
        payload = r.json()
        text = (
            payload.get("text")
            or payload.get("result")
            or payload.get("transcript")
            or ""
        )
        text = (str(text) if text is not None else "").strip()
        if text:
            return text
    except Exception:
        pass
    raw = (r.text or "").strip()
    if raw:
        return raw
    raise RuntimeError("doubao asr empty text")


@api_router.post("/stt/transcribe", response_model=SttResponse)
async def stt_transcribe(
    file: UploadFile = File(...),
    language: str = Form("zh"),
) -> SttResponse:
    """
    语音转文字（给 screen 大屏语音对话）：
    1) 优先本地 Whisper
    2) 失败后回退豆包 ASR（占位）
    """
    if not file:
        raise HTTPException(status_code=422, detail="file 不能为空")
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=422, detail="音频文件为空")
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="音频文件过大，建议 <= 15MB")

    filename = file.filename or "audio.wav"
    lang = (language or "zh").strip() or "zh"
    try:
        text = await _whisper_stt(audio_bytes, filename, lang)
        provider = "whisper"
    except Exception as whisper_err:
        logging.warning("whisper stt failed, fallback doubao: %s", whisper_err)
        try:
            text = await _doubao_asr(audio_bytes, filename, lang)
            provider = "doubao"
        except Exception as doubao_err:
            raise HTTPException(
                status_code=502,
                detail=f"STT 服务不可用: whisper={whisper_err}; doubao={doubao_err}",
            ) from doubao_err

    return SttResponse(provider=provider, text=text, language=lang)
