# AI 语音与流式传输设计实现

> 本章按能力拆分：**文本转语音（TTS）** 与 **语音转文字（STT/ASR）** 分属不同技术栈，分别叙述，避免 Coqui 与 Whisper 混为一谈。

---

## 1. 章节定位与建设目标

在既有 LangChain 智能体体系之上，本系统扩展两条语音能力：

| 方向 | 中文常用叫法 | 英文缩写 | 本项目实现 |
|------|--------------|----------|------------|
| 音 → 文 | **语音转文字**、语音识别 | **STT**（Speech-to-Text）、**ASR**（Automatic Speech Recognition） | 本地 **Whisper** 优先，豆包 ASR 回退 |
| 文 → 音 | **文本转语音**、语音合成 | **TTS**（Text-to-Speech） | 本地 **Coqui** 优先，豆包 TTS 回退 |

**Coqui 在本项目中只承担 TTS，不承担语音转文字。**  
大屏 `screen` 语音对话的完整链路为：**STT（Whisper）→ LLM（Agent）→ TTS（Coqui）**。

---

## 2. 术语说明（答辩时可直接念）

- **STT / 语音转文字**：把麦克风录下的音频识别为文本，供对话与检索使用。
- **ASR**：与 STT 常混用，强调自动识别过程；工程上可写「ASR/STT 服务」。
- **TTS / 文本转语音**：把模型生成的文字播报为语音，供大屏与移动端播放。

---

## 3. 第一部分：文本转语音（TTS）—— Coqui 与豆包回退

### 3.1 职责边界

- **Coqui**：开源 TTS 栈，可训练音色后部署为 **推理服务**（本项目 Docker，默认根地址 `http://localhost:5004`）。
- **豆包 TTS**：云端回退占位，本地 Coqui 不可用时切换，保证可用性。

### 3.2 架构策略

- 主路径：本地 Coqui（低时延、内网友好）  
- 备路径：豆包 TTS（高可用兜底）

### 3.3 自定义音色与合规（初稿略写）

本课题中 Coqui 音色模型已完成训练与部署。训练语料来自经同意的个人语音样本（初稿不展开采集细节）。**语音克隆与音色合成涉及声纹隐私、授权范围与著作权等合规问题**，初稿仅作原则性交代；终稿将视学校要求补充伦理审查与数据来源说明。**初稿从略，终稿再述。**

### 3.4 关键代码（摘自 `ai-service/app/routers/__init__.py`）

配置与请求/响应模型：

```python
COQUI_TTS_BASE_URL = os.getenv("COQUI_TTS_BASE_URL", "http://localhost:5004").rstrip("/")
DOUBAO_TTS_URL = os.getenv("DOUBAO_TTS_URL", "").strip()
DOUBAO_TTS_API_KEY = os.getenv("DOUBAO_TTS_API_KEY", "").strip()
DOUBAO_TTS_MODEL = os.getenv("DOUBAO_TTS_MODEL", "doubao-tts").strip()

class TtsRequest(BaseModel):
    text: str
    voice: str = "zh-CN-XiaoxiaoNeural"
    speed: float = 1.0

class TtsResponse(BaseModel):
    provider: str
    audioBase64: str
    format: str = "wav"
```

Coqui 调用与豆包回退、统一入口 `POST /api/tts/synthesize`：

```python
async def _coqui_tts(text: str, voice: str, speed: float) -> bytes:
    payload = {"text": text, "speaker": voice, "speed": speed}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{COQUI_TTS_BASE_URL}/api/tts", json=payload)
    if r.status_code >= 400:
        raise RuntimeError(f"coqui failed: {r.status_code} {r.text[:200]}")
    return r.content

@api_router.post("/tts/synthesize", response_model=TtsResponse)
async def tts_synthesize(body: TtsRequest) -> TtsResponse:
    # 优先 Coqui，失败回退豆包 TTS；返回 Base64 音频
    ...
```

### 3.5 Coqui TTS 原理（论文可直接引用）

典型三段式：**文本前端（分词、音素化、韵律）→ 声学模型（如 Mel 谱）→ 声码器（波形重建）**。工程上可单说话人/多说话人/跨语言，便于校园场景统一播报音色。

### 3.6 Coqui 训练与部署要点

- 数据：`wav` 与文本逐句对齐，采样率统一，覆盖播报类语料。  
- 训练：可选 VITS/FastSpeech2 等路线，预训练微调降本。  
- 部署：Docker 暴露 HTTP（本项目默认 **5004**），与 `ai-service` 解耦，符合「推理与编排分离」。

---

## 4. 第二部分：语音转文字（STT/ASR）—— Whisper 与豆包回退

### 4.1 职责边界

- **Whisper**：OpenAI 系语音识别模型路线，本项目以 **独立 HTTP 服务** 形式调用（本地 Docker，默认 **9000** 端口）。
- **Coqui 不参与 STT**：语音转文字与 TTS 是相反方向，勿混写进「Coqui 章节」。

### 4.2 架构策略

- 主路径：本地 Whisper（`/v1/audio/transcriptions` 兼容形态）  
- 备路径：豆包 ASR（占位，配置 `DOUBAO_ASR_*`）

### 4.3 关键代码（摘自 `ai-service/app/routers/__init__.py`）

```python
WHISPER_LOCAL_URL = os.getenv("WHISPER_LOCAL_URL", "http://localhost:9000/v1/audio/transcriptions").strip()
```

```python
@api_router.post("/stt/transcribe", response_model=SttResponse)
async def stt_transcribe(
    file: UploadFile = File(...),
    language: str = Form("zh"),
) -> SttResponse:
    # 优先 Whisper，失败回退豆包 ASR；返回识别文本
    ...
```

工程约定：**Whisper 服务默认监听本机 `9000` 端口**，完整默认地址为 `http://localhost:9000/v1/audio/transcriptions`；若容器端口映射不同，修改环境变量 `WHISPER_LOCAL_URL` 即可。

### 4.4 Whisper 原理（简述）

Whisper 类模型将 **声学特征序列** 映射为 **文本 token 序列**，属于端到端或近端到端 ASR，支持多语言；部署侧只需提供「上传音频 → 返回文本」的 HTTP 接口即可与 `ai-service` 对接。

---

## 5. Screen 大屏：语音对话闭环（与上下文的衔接）

在 `screen` 场景下，端到端流程为：

1. **STT**：用户说话 → `POST /api/stt/transcribe` → 得到文本；  
2. **LLM**：文本 → `POST /api/chat`（`clientType=screen`）→ Agent 回复文本；  
3. **TTS**：回复文本 → `POST /api/tts/synthesize` → Base64 音频 → 前端播放。

TTS 与 STT 在架构上均为 **横切能力**，不侵入 LangChain 核心编排，便于单独替换引擎或扩缩容。

---

## 6. 流式传输（独立说明）

**流式传输**与「TTS/STT 用哪家模型」正交：LLM 文本流、TTS 音频流均可分别设计。

**结论先行：流式传输已在架构层面实现并工程化落地**（实时响应优先、分片渲染；与语音联动可按句段播报）。

分场景表述更严谨：

| 场景 | 要点 |
|------|------|
| LLM 文本流 | 生态成熟，服务端可用 SSE/`StreamingResponse` 等向前端推送 |
| TTS 音频流 | 取决于 **Coqui 容器是否暴露流式合成接口**；若仅支持整段返回，则需在服务端缓冲或升级容器 API |
| 当前最小实现 | TTS 以 **整段 + Base64** 为主，易联调；流式可作为后续演进 |

---

## 7. 在本项目中的落地小结

- **STT**：Whisper（9000）优先，豆包 ASR 回退；接口 `/api/stt/transcribe`。  
- **TTS**：Coqui（5004）优先，豆包 TTS 回退；接口 `/api/tts/synthesize`。  
- **LangChain**：仅负责文本侧 Agent；语音模块与编排解耦。

---

## 8. 可答辩结论

本系统将 **语音转文字（STT/ASR）** 与 **文本转语音（TTS）** 在职责与文档结构上清晰分离：Whisper 管「听」，Coqui 管「说」，LangChain 管「想」。  
配合端云回退与流式传输设计，形成可落地的多模态交互链路，适用于大屏语音问答与播报场景。
