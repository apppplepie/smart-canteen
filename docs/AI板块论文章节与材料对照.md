# AI 板块：论文章节与材料对照

本文档用于写毕业论文时**快速对应**：每一节写什么、抄哪份设计说明、需要指到哪些代码路径。按常见工科论文结构编排，你可按学院模板微调标题编号。

---

## 一、绪论 / 研究背景中的「智能化」一句带过

| 写作要点 | 材料来源 |
|----------|----------|
| 校园食堂场景下对话、检索、语音、治理需求 | 自拟 + 各专章首段摘要 |
| 本文采用「编排层 + 业务工具 + 治理」思路 | `LangChain设计与实现（ai-service）.md` §1～§2 |

---

## 二、总体架构（建议单独一节图 + 一段文字）

| 小节建议标题 | 写什么 | 文档 | 代码/配置（指到即可） |
|--------------|--------|------|----------------------|
| 2.1 分层架构 | FastAPI 接入、Spring Boot 业务 API、ai-service 独立子系统 | `LangChain设计与实现（ai-service）.md` §2 | `ai-service/app/main.py`（`include_router`）、`ai-service/app/routers/__init__.py` |
| 2.2 调用关系 | 前端/大屏 → ai-service；工具层 HTTP 调 Spring Boot | 同上 §2 | `ai-service/app/ai_agent.py` 中 `SPRING_BOOT_BASE_URL`、`_get`/`_patch` |
| 2.3 模块划分 | 编排 / 工具 / 护栏 / 审计 / 语音 / 检索 | 本节文件 + 下表 | — |

---

## 三、智能体与 LangChain 编排（核心方法章）

| 小节建议标题 | 写什么 | 文档 | 代码 |
|--------------|--------|------|------|
| 3.1 LangChain 与 LangGraph 定位 | 非单纯 SDK，而是编排与状态流 | `LangChain设计与实现（ai-service）.md` §1、§2.1 | — |
| 3.2 Tool 与业务 API 映射 | `@tool`、批量 `StructuredTool`、查表配置 | 同上 §3 | `ai-service/app/ai_agent.py`（Tool 定义、`TABLE_QUERY_*`） |
| 3.3 状态图与推理循环 | `StateGraph`、`agent`↔`tools` | 同上 §4 | `ai-service/app/ai_agent.py` 中 `compile_agent`、`process_message` |
| 3.4 分端场景 | admin / screen / mobile、系统提示词 | 同上 §5、`ai_agent.py` 中 `SCREEN_SYSTEM_PROMPT`、`MOBILE_SYSTEM_PROMPT` | `ai_agent.py` |
| 3.5 后台任务型 Agent | 反馈分析、写回业务库 | 同上 §5.3 | `ai_agent.py` 中 `run_feedback_analyzer`、`update_post_ai_suggestion`；路由 `routers/__init__.py` 中 `/feedback/analyze` |

---

## 四、质量护栏 Guardrails（安全与权限）

| 小节建议标题 | 写什么 | 文档 | 代码 |
|--------------|--------|------|------|
| 4.1 工具级权限 | RBAC、客户端类型、guest 零工具 | `LangChain设计与实现（ai-service）.md` §6.1 | `ai_agent.py` 中 `TOOL_WHITELIST_BY_ROLE`、`get_tools_for_request` |
| 4.2 数据域约束（Mobile） | 闭包固化 `userId`、行级思想 | 同上 §6.2 | `ai_agent.py` 中 `_make_mobile_scoped_tools` |
| 4.3 运行时降级 | 无工具则拒绝或提示 | 同上 §6.3 | `ai_agent.py` 中 `process_message` 内 `agent is None` 分支 |
| 4.4 与「内容安全护栏」边界 | 本文实现权限型；内容检测可展望 | 同上 §6 末段 | 可写「未单独模块，终稿可扩展」 |

---

## 五、审计与可解释

| 小节建议标题 | 写什么 | 文档 | 代码 |
|--------------|--------|------|------|
| 5.1 设计目标 | 可追溯、可解释（工具链） | `LangChain设计与实现（ai-service）.md` §7 | — |
| 5.2 数据模型 | `audit_logs` 表语义 | 同上 §7.1～§7.2 | `backend/src/main/resources/scs.sql` 中 `audit_logs`；`backend/.../entity/AuditLog.java` |
| 5.3 写入路径 | V1 统一数据接口 | 同上 | `backend/.../controller/v1/V1DataController.java` 中 `POST /api/v1/data/{table}` |
| 5.4 AI 服务落库 | chat 完成后异步写审计 | 同上 §7 | `ai-service/app/routers/__init__.py` 中 `_write_audit_log`、`_chat_handler` 内调用 |
| 5.5 响应侧可解释 | 返回 `tool_calls` | — | `routers/__init__.py` 中 `ChatResponse`、`_chat_handler` 返回字段 |

---

## 六、检索增强与向量（RAG）

| 小节建议标题 | 写什么 | 文档 | 代码 |
|--------------|--------|------|------|
| 6.1 需求与流程 | 查询扩展、向量、召回 | `AI板块与RAG技术设计说明.md`（全文结构按需截取） | `backend/.../service/PostVectorSearchService.java` |
| 6.2 向量生成接口 | 与 Spring Boot 约定 | RAG 文档 + `LangChain` 若提到 embedding 可交叉引用 | `ai-service/app/routers/__init__.py` 中 `/embeddings` |
| 6.3 索引与存储 | 表结构、迁移脚本 | RAG 文档 | `backend/src/main/resources/db/add_post_vector_index.sql`、`scs.sql` 中 `post_vector_index` |

---

## 七、语音：STT 与 TTS（分写，勿混）

| 小节建议标题 | 写什么 | 文档 | 代码 |
|--------------|--------|------|------|
| 7.1 术语 | STT/ASR 与 TTS 分工；Coqui 仅 TTS | `AI语音与流式传输设计实现（Coqui）.md` §1～§2 | — |
| 7.2 TTS | Coqui 优先、豆包回退、5004 | 同上 §3 | `routers/__init__.py` 中 `_coqui_tts`、`tts_synthesize`、`/api/tts/synthesize` |
| 7.3 STT | Whisper 优先、豆包 ASR 回退、9000 | 同上 §4 | `routers/__init__.py` 中 `_whisper_stt`、`stt_transcribe`、`/api/stt/transcribe` |
| 7.4 大屏闭环 | STT → chat → TTS | 同上 §5 | 串联上述三个接口 |
| 7.5 流式与演进 | 文本流/音频流、当前最小实现边界 | 同上 §6 | 与实现一致表述，避免夸大 |

---

## 八、实验 / 测试 / 展望（建议至少一小节）

| 写作要点 | 材料来源 |
|----------|----------|
| 功能验证：对话、工具调用、大屏语音链路、审计库是否有记录 | 自拟测试步骤 + 数据库查 `audit_logs` |
| 指标（可选）：响应时延、首包（若未测则写「后续工作」） | 自拟 |
| 多智能体、内容型 Guardrails、重排 RAG | 各专章「展望」句 |

---

## 九、快速索引：核心文件一览

| 类型 | 路径 |
|------|------|
| AI 服务入口 | `ai-service/app/main.py` |
| 路由与 chat/嵌入/语音/审计 | `ai-service/app/routers/__init__.py` |
| Agent、Tool、LangGraph | `ai-service/app/ai_agent.py` |
| LangChain 论文向说明 | `docs/LangChain设计与实现（ai-service）.md` |
| 语音 STT/TTS 论文向说明 | `docs/AI语音与流式传输设计实现（Coqui）.md` |
| RAG 论文向说明 | `docs/AI板块与RAG技术设计说明.md` |
| 本章对照（本页） | `docs/AI板块论文章节与材料对照.md` |

---

## 使用说明

- **写正文**：按「二～七」顺序从对应 md 摘段落，代码处用「见 `ai_agent.py` 中某某函数」即可。  
- **避免重复**：语音细节以 `AI语音与流式传输设计实现（Coqui）.md` 为准；编排与治理以 `LangChain设计与实现（ai-service）.md` 为准；检索以 `AI板块与RAG技术设计说明.md` 为准。  
- **边界诚实**：多智能体、纯内容安全护栏、全文流式若未完全实现，放在「展望」或「局限」。
