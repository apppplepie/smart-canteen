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
import uuid

import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
ARK_API_KEY = os.getenv("ARK_API_KEY", "").strip()
ARK_ENDPOINT_ID = os.getenv("ARK_ENDPOINT_ID", "").strip()
ARK_API_BASE = os.getenv("ARK_API_BASE", "https://ark.cn-beijing.volces.com/api/v3").rstrip("/")


# def _endpoint_model_id(raw: str) -> str:
#     """方舟 TTS 已禁用，保留备查。"""
#     raw = (raw or "").strip()
#     if not raw:
#         return ""
#     return raw if raw.startswith("ep-") else f"ep-{raw}"


def _llm_http_config() -> tuple[str, str, str]:
    """(api_key, chat_completions_url, model_name) — 仅 DeepSeek，供对话/摘要/标题/反馈分析。"""
    return (
        DEEPSEEK_API_KEY,
        os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1").rstrip("/") + "/chat/completions",
        os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
    )


LLM_CONFIGURED = bool(DEEPSEEK_API_KEY)


DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1").rstrip("/") + "/chat/completions"
TITLE_MAX_LEN = 8
SPRING_BOOT_BASE_URL = os.getenv("SPRING_BOOT_BASE_URL", "http://localhost:8081").rstrip("/")
COQUI_TTS_BASE_URL = os.getenv("COQUI_TTS_BASE_URL", "http://localhost:5004").rstrip("/")
# TTS 仅走火山 OpenSpeech；下列方舟相关变量不再参与 /tts/synthesize，可保留占位
DOUBAO_TTS_URL = os.getenv("DOUBAO_TTS_URL", "").strip()
DOUBAO_TTS_API_KEY = os.getenv("DOUBAO_TTS_API_KEY", "").strip()
ARK_TTS_ENDPOINT_ID = os.getenv("ARK_TTS_ENDPOINT_ID", "").strip()
DOUBAO_TTS_VOICE = os.getenv("DOUBAO_TTS_VOICE", "zh_female_shuangkuaisisi").strip()
DOUBAO_TTS_MODEL = os.getenv("DOUBAO_TTS_MODEL", "").strip()
WHISPER_LOCAL_URL = os.getenv("WHISPER_LOCAL_URL", "http://localhost:9000/v1/audio/transcriptions").strip()
DOUBAO_ASR_URL = os.getenv("DOUBAO_ASR_URL", "").strip()
DOUBAO_ASR_API_KEY = os.getenv("DOUBAO_ASR_API_KEY", "").strip()
DOUBAO_ASR_MODEL = os.getenv("DOUBAO_ASR_MODEL", "doubao-asr").strip()

# 豆包语音合成（火山 OpenSpeech）：与方舟对话接入点无关；TTS 2.0 用 HTTP V3 单向流式
_DOUBAO_TTS_V1_URL = "https://openspeech.bytedance.com/api/v1/tts"
_DOUBAO_TTS_V3_URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"
DOUBAO_TTS_APP_ID = os.getenv("DOUBAO_TTS_APP_ID", "").strip()
DOUBAO_TTS_ACCESS_TOKEN = os.getenv("DOUBAO_TTS_ACCESS_TOKEN", "").strip()
DOUBAO_TTS_RESOURCE_ID = os.getenv("DOUBAO_TTS_RESOURCE_ID", "").strip()
DOUBAO_TTS_CLUSTER = os.getenv("DOUBAO_TTS_CLUSTER", "volcano_tts").strip()
DOUBAO_TTS_UID = os.getenv("DOUBAO_TTS_UID", "scs-ai").strip()
DOUBAO_TTS_HTTP_TIMEOUT_SECONDS = float(os.getenv("DOUBAO_TTS_HTTP_TIMEOUT_SECONDS", "600") or "600")
_use_v3_raw = os.getenv("DOUBAO_TTS_USE_V3", "").strip().lower()
if _use_v3_raw in ("0", "false", "no"):
    DOUBAO_TTS_USE_OPENSPEECH_V3 = False
elif _use_v3_raw in ("1", "true", "yes"):
    DOUBAO_TTS_USE_OPENSPEECH_V3 = True
else:
    DOUBAO_TTS_USE_OPENSPEECH_V3 = bool(DOUBAO_TTS_RESOURCE_ID)


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
    format: str = "mp3"


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
    if not LLM_CONFIGURED:
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY（对话与工具调用）；TTS 请配置火山豆包 OpenSpeech（DOUBAO_TTS_APP_ID 等）")
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
    if not LLM_CONFIGURED:
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY（对话与工具调用）；TTS 请配置火山豆包 OpenSpeech（DOUBAO_TTS_APP_ID 等）")
    messages = body.messages or []
    if not messages:
        return SummarizeResponse(summary="")
    from app.ai_agent import summarize_messages
    summary = await asyncio.to_thread(summarize_messages, messages)
    return SummarizeResponse(summary=summary or "")


@api_router.post("/chat/suggest-title", response_model=SuggestTitleResponse)
async def suggest_title(body: SuggestTitleBody) -> SuggestTitleResponse:
    """将用户首条消息总结为 8 字以内的中文标题，供新会话存储用。"""
    if not LLM_CONFIGURED:
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY（对话与工具调用）；TTS 请配置火山豆包 OpenSpeech（DOUBAO_TTS_APP_ID 等）")
    msg = (body.message or "").strip()
    if not msg:
        return SuggestTitleResponse(title="新对话")
    prompt = f"将下面用户的第一条消息总结为{TITLE_MAX_LEN}个字以内的中文标题，只返回标题不要其他内容、不要引号：\n\n{msg}"
    key, chat_url, model_name = _llm_http_config()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                chat_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                },
                json={
                    "model": model_name,
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
    if not LLM_CONFIGURED:
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY（对话与工具调用）；TTS 请配置火山豆包 OpenSpeech（DOUBAO_TTS_APP_ID 等）")
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


# --- Coqui 本地 TTS 已禁用：仅允许火山豆包 OpenSpeech ---
# async def _coqui_tts(text: str, voice: str, speed: float) -> bytes:
#     payload = {
#         "text": text,
#         "speaker": voice,
#         "speed": speed,
#     }
#     async with httpx.AsyncClient(timeout=30.0) as client:
#         r = await client.post(
#             f"{COQUI_TTS_BASE_URL}/api/tts",
#             json=payload,
#         )
#     if r.status_code >= 400:
#         raise RuntimeError(f"coqui failed: {r.status_code} {r.text[:200]}")
#     return r.content


def _openspeech_ready() -> bool:
    """火山控制台语音应用 appid + token；V3 还须 resource_id（如 seed-tts-2.0）。"""
    if not DOUBAO_TTS_APP_ID or not DOUBAO_TTS_ACCESS_TOKEN:
        return False
    if DOUBAO_TTS_USE_OPENSPEECH_V3:
        return bool(DOUBAO_TTS_RESOURCE_ID)
    return True


def _doubao_httpx_timeout() -> httpx.Timeout:
    read_s = max(60.0, DOUBAO_TTS_HTTP_TIMEOUT_SECONDS)
    return httpx.Timeout(connect=30.0, read=read_s, write=120.0, pool=30.0)


def _resolve_tts_voice_type(voice_from_request: str) -> str:
    v = (voice_from_request or "").strip()
    if v and v != "zh-CN-XiaoxiaoNeural":
        return v
    return (DOUBAO_TTS_VOICE or "").strip() or "zh_male_m191_uranus_bigtts"


def _speed_ratio_to_v3_speech_rate(speed_ratio: float) -> int:
    """V3 speech_rate：-50~100，0 为原速。"""
    r = int(round(100.0 * (float(speed_ratio) - 1.0)))
    return max(-50, min(100, r))


def _http_quota_hint(detail: str) -> str:
    low = detail.lower()
    if "quota" in low or "text_words" in low:
        return (
            " 若为 quota/text_words，请在火山控制台核对语音应用额度与资源包；"
            "仅换接口版本通常不能绕过同一应用配额。"
        )
    return ""


async def _openspeech_synthesize_v1(text: str, voice_type: str, speed: float) -> bytes:
    """OpenSpeech HTTP V1 非流式（mp3 base64）。"""
    req_block: dict = {
        "reqid": str(uuid.uuid4()),
        "text": text,
        "operation": "query",
    }
    body = {
        "app": {
            "appid": DOUBAO_TTS_APP_ID,
            "token": DOUBAO_TTS_ACCESS_TOKEN,
            "cluster": DOUBAO_TTS_CLUSTER,
        },
        "user": {"uid": DOUBAO_TTS_UID},
        "audio": {
            "voice_type": voice_type,
            "encoding": "mp3",
            "speed_ratio": max(0.5, min(2.0, float(speed))),
        },
        "request": req_block,
    }
    headers = {
        "Authorization": f"Bearer;{DOUBAO_TTS_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=_doubao_httpx_timeout(), trust_env=False) as client:
        r = await client.post(_DOUBAO_TTS_V1_URL, json=body, headers=headers)
    if r.status_code >= 400:
        detail = (r.text or "").strip()
        if len(detail) > 500:
            detail = detail[:500] + "…"
        raise RuntimeError(
            f"豆包 OpenSpeech V1 HTTP {r.status_code}：{detail or r.reason_phrase}。"
            + _http_quota_hint(detail)
        )
    payload = r.json()
    code = payload.get("code")
    if code != 3000:
        msg = payload.get("message", "unknown")
        raise RuntimeError(f"豆包 OpenSpeech V1 失败: code={code}, message={msg}")
    data_b64 = payload.get("data")
    if not data_b64:
        raise RuntimeError("豆包 OpenSpeech V1 返回无音频数据")
    raw = base64.b64decode(data_b64)
    if not raw:
        raise RuntimeError("豆包 OpenSpeech V1 返回空音频")
    return raw


async def _openspeech_synthesize_v3(text: str, voice_type: str, speed: float) -> bytes:
    """
    OpenSpeech HTTP V3 单向流式（Chunked），豆包语音合成 2.0 用 seed-tts-2.0 + 2.0 音色。
    文档：https://www.volcengine.com/docs/6561/1598757
    """
    req_id = str(uuid.uuid4())
    audio_params: dict = {
        "format": "mp3",
        "sample_rate": 24000,
        "speech_rate": _speed_ratio_to_v3_speech_rate(speed),
    }
    body = {
        "user": {"uid": DOUBAO_TTS_UID},
        "req_params": {
            "text": text,
            "speaker": voice_type,
            "audio_params": audio_params,
        },
    }
    headers = {
        "X-Api-App-Id": DOUBAO_TTS_APP_ID,
        "X-Api-Access-Key": DOUBAO_TTS_ACCESS_TOKEN,
        "X-Api-Resource-Id": DOUBAO_TTS_RESOURCE_ID,
        "X-Api-Request-Id": req_id,
        "Content-Type": "application/json",
    }
    audio_buf = bytearray()
    decode = json.JSONDecoder()

    def _consume_v3_obj(obj: dict) -> None:
        c = obj.get("code")
        if c is not None and c not in (0, 20000000):
            msg = str(obj.get("message") or "unknown")
            hint = ""
            low = msg.lower()
            if c == 55000000 or "mismatch" in low or "resource" in low:
                hint = (
                    "（X-Api-Resource-Id 与 speaker 须匹配：seed-tts-2.0 仅配豆包语音合成 2.0 音色；"
                    "1.0 音色请设 DOUBAO_TTS_RESOURCE_ID=seed-tts-1.0 或改用 V1：DOUBAO_TTS_USE_V3=false。）"
                )
            raise RuntimeError(f"豆包 OpenSpeech V3 失败: code={c}, message={msg}{hint}")
        data = obj.get("data")
        if isinstance(data, str) and data:
            try:
                audio_buf.extend(base64.b64decode(data))
            except Exception as e:
                raise RuntimeError(f"豆包 OpenSpeech V3 音频 base64 解码失败: {e}") from e

    async with httpx.AsyncClient(timeout=_doubao_httpx_timeout(), trust_env=False) as client:
        async with client.stream(
            "POST",
            _DOUBAO_TTS_V3_URL,
            headers=headers,
            json=body,
        ) as r:
            if r.status_code >= 400:
                detail = (await r.aread()).decode("utf-8", errors="replace").strip()
                if len(detail) > 500:
                    detail = detail[:500] + "…"
                raise RuntimeError(
                    f"豆包 OpenSpeech V3 HTTP {r.status_code}：{detail or r.reason_phrase}。"
                    + _http_quota_hint(detail)
                )
            buf = ""
            async for chunk in r.aiter_text():
                buf += chunk
                while True:
                    s = buf.lstrip()
                    if not s:
                        buf = ""
                        break
                    if s.startswith("data:"):
                        s = s[5:].lstrip()
                    try:
                        obj, end = decode.raw_decode(s)
                    except json.JSONDecodeError:
                        buf = s
                        break
                    buf = s[end:].lstrip()
                    if isinstance(obj, dict):
                        _consume_v3_obj(obj)

    if not audio_buf:
        raise RuntimeError("豆包 OpenSpeech V3 未收到音频数据")
    raw = bytes(audio_buf)
    if not raw:
        raise RuntimeError("豆包 OpenSpeech V3 返回空音频内容")
    return raw


async def _openspeech_tts(text: str, voice: str, speed: float) -> bytes:
    voice_type = _resolve_tts_voice_type(voice)
    if DOUBAO_TTS_USE_OPENSPEECH_V3:
        return await _openspeech_synthesize_v3(text, voice_type, speed)
    return await _openspeech_synthesize_v1(text, voice_type, speed)


# --- 方舟 /audio/speech TTS 已禁用（原 _doubao_tts_ark_audio_speech 整段保留备查）---
# async def _doubao_tts_ark_audio_speech(text: str, voice: str, speed: float) -> bytes:
#     api_key = DOUBAO_TTS_API_KEY or ARK_API_KEY
#     tts_ep = ARK_TTS_ENDPOINT_ID or ARK_ENDPOINT_ID or DOUBAO_TTS_MODEL
#     model = _endpoint_model_id(tts_ep) if tts_ep else ""
#     url = DOUBAO_TTS_URL or (f"{ARK_API_BASE}/audio/speech" if ARK_API_BASE else "")
#     if not url or not api_key or not model:
#         raise RuntimeError("方舟 TTS 未配置")
#     payload = {"model": model, "input": text[:800], "voice": _resolve_tts_voice_type(voice), ...}
#     async with httpx.AsyncClient(timeout=60.0) as client:
#         r = await client.post(url, headers={"Authorization": f"Bearer {api_key}", ...}, json=payload)
#     ...


async def _doubao_tts(text: str, voice: str, speed: float) -> bytes:
    """仅火山豆包 OpenSpeech（HTTP V3 或 V1）；方舟与 Coqui 已禁用。"""
    if not _openspeech_ready():
        raise RuntimeError(
            "TTS 仅支持火山豆包 OpenSpeech：请配置 DOUBAO_TTS_APP_ID、DOUBAO_TTS_ACCESS_TOKEN；"
            "使用 V3（豆包语音合成 2.0）时还需 DOUBAO_TTS_RESOURCE_ID（如 seed-tts-2.0）。"
            "方舟 /audio/speech 与本地 Coqui 已关闭。"
        )
    return await _openspeech_tts(text, voice, speed)


@api_router.post("/tts/synthesize", response_model=TtsResponse)
async def tts_synthesize(body: TtsRequest) -> TtsResponse:
    """
    文本转语音：仅火山豆包 OpenSpeech（HTTP V3 / V1）。方舟与 Coqui 已禁用。
    """
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="text 不能为空")
    if len(text) > 800:
        raise HTTPException(status_code=422, detail="text 过长，建议 <= 800 字")

    try:
        audio_bytes = await _doubao_tts(text, body.voice, body.speed)
    except Exception as e:
        logging.warning("doubao openspeech tts failed: %s", e)
        raise HTTPException(status_code=502, detail=str(e)) from e

    return TtsResponse(
        provider="doubao",
        audioBase64=base64.b64encode(audio_bytes).decode("utf-8"),
        format="mp3",
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
