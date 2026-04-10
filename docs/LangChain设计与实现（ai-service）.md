# LangChain 设计与实现（基于 ai-service）

## 1. LangChain 是什么：从“单次问答”到“可执行智能体”

LangChain 不是一个单纯的“大模型调用 SDK”，而是一套面向 **LLM 应用编排** 的工程框架。其核心价值在于把原本不可控的自然语言推理，变成可观测、可约束、可扩展的系统流程。  
在本项目中，LangChain 与 LangGraph 共同承担了以下职责：

- 将 LLM 从“只会回答”升级为“会调用后端能力（Tool）”；
- 通过图编排（StateGraph）实现 Agent -> Tool -> Agent 的闭环执行；
- 将权限控制前置到“工具选择层”，把安全策略工程化；
- 与 FastAPI、Spring Boot 形成清晰分层，支撑移动端/大屏/后台分析等多场景。

换言之，本项目里的 LangChain 不是“聊天功能”，而是 AI 业务中台的执行内核。

---

## 2. 总体设计：分层、分端、分权

本系统在 `ai-service` 中采用四层设计：

1. **接口层（FastAPI Router）**：接收前端或 Spring Boot 转调请求，做参数校验与路由分发；
2. **智能体编排层（LangGraph）**：根据请求上下文动态编译 Agent 图；
3. **能力层（Tools）**：将后端 HTTP 接口封装为可调用工具；
4. **安全层（RBAC + 数据域约束）**：按 `clientType / role / userId` 动态裁剪工具能力。

对应入口代码如下（`ai-service/app/main.py`）：

```python
app = FastAPI(title="SCS AI Service", lifespan=lifespan)

# 现有 API 统一在 /api 下，如 POST /api/chat
app.include_router(api_router, prefix="/api")
```

这意味着 AI 服务被定义为一个独立后端子系统，通过 `/api/chat`、`/api/feedback/analyze`、`/api/embeddings` 等接口向上游提供智能能力。

### 2.1 与「帖子向量检索」的边界（避免章节打架）

- **`POST /api/embeddings`**：主要**上游消费者是 Spring Boot**（`PostVectorSearchService` 建索引与查询时向量化）。实现上当前为 **FastAPI 内 `_hash_embedding`（256 维、演示用稳定向量）**，不属于 LangGraph Tool，也**不**在 `process_message` 里被模型直接调用。
- **`GET /api/vector/posts/search`**：由 **Spring Boot** 提供；**未**在 `ai_agent.py` 中注册为 Tool。Agent 访问帖内容时走 `list_posts`、`get_post_by_id`、`query_posts` 等 **HTTP 列表/查表**路径。
- **移动端「本周 AI 小结」的检索增强区块**：由 **mobile 直连 Spring Boot** 调用 `search`，不经 FastAPI Agent。写论文时建议把该能力归在 **RAG/检索设计说明** 或 **前后端协作**，本章强调 **LangChain 编排的对话与反馈分析**即可。

### 2.2 LangChain 在本课题中的准确定位（核心回答）

围绕“Agent 协作”这一课题核心，LangChain/LangGraph 在本系统中的定位应明确为：

1. **核心编排层（协作中枢）**：负责状态流转、工具调度、上下文拼接与结果汇聚；
2. **不是全部 AI 能力本体**：语音（Whisper/Coqui）、向量检索、数据库、权限策略分别属于独立能力层；
3. **是主干，不是唯一章节**：LangChain 应作为论文中一大块“核心方法”，但治理、安全、语音、多模态应独立成章。

可用一句话概括：**LangChain 是 Agent 协作的大脑与流程引擎，不是所有 AI 模块的总和。**

---

## 3. 核心实现一：Tool 化，把业务 API 变成 Agent 的“可调用动作”

在本项目中，LangChain Tool 并非玩具示例，而是和业务 API 一一映射。  
例如，用户、订单、帖子、通用数据表查询，都被定义为标准工具函数，便于模型在推理过程中按需调用：

```python
@tool
def get_user_info(user_id: str) -> str:
    """根据用户ID查询用户信息。user_id 为数字 ID。"""
    return _get(f"/api/users/{user_id}")

@tool
def list_orders_by_user(user_id: str) -> str:
    """根据用户ID查询该用户的所有订单列表。user_id 为数字 ID。"""
    return _get(f"/api/orders/user/{user_id}")
```

同时，为避免“每张表手写一个工具”的维护爆炸，项目采用了 **配置驱动的批量工具生成**：

```python
def _make_table_query_tool(table_key: str, description: str) -> StructuredTool:
    """根据表名和描述生成一个 LangChain 可调用的查表工具（避免为每个表手写 @tool）。"""

    def _query(id_or_empty: str = "", page: int = 1, size: int = 10) -> str:
        if id_or_empty and id_or_empty.strip():
            return _get(f"/api/v1/data/{table_key}/{id_or_empty.strip()}")
        return _get(f"/api/v1/data/{table_key}?currentPage={page}&size={size}")

    return StructuredTool.from_function(
        name=f"query_{table_key}",
        description=description,
        func=_query,
    )
```

这类设计体现了研究生层面的工程取向：**把 Prompt 工程升级为软件工程**，通过抽象减少重复、提高一致性和可扩展性。

---

## 4. 核心实现二：LangGraph 编排，实现“可控推理循环”

项目没有采用“LLM 一次调用返回最终文本”的简单范式，而是使用 LangGraph 构建可循环的 Agent 流程：

```python
def compile_agent(tools: list):
    """根据当前请求允许的工具列表编译一个 Agent 图。无工具时返回 None（仅对话，不查库）。"""
    if not tools:
        return None
    tool_node = ToolNode(tools)
    graph_builder = StateGraph(State)
    graph_builder.add_node("agent", _make_agent_node(tools))
    graph_builder.add_node("tools", tool_node)
    graph_builder.add_edge(START, "agent")
    graph_builder.add_conditional_edges("agent", _make_should_continue(tools), {"tools": "tools", "end": END})
    graph_builder.add_edge("tools", "agent")
    return graph_builder.compile()
```

该图结构本质是：

- Agent 先思考并决定是否调用工具；
- 若有 `tool_calls`，进入 Tool 节点执行；
- Tool 执行结果再回流给 Agent，继续推理；
- 无工具需求时结束并返回自然语言结果。

这种机制解决了纯聊天模型无法可靠访问企业数据的问题，使模型具备“查-算-答”一体化能力。

---

## 5. 项目中的实际用途：多场景 AI 服务中枢

在本课题系统中，LangChain/LangGraph 被用于三类核心业务场景：

### 5.1 对话问答（`/api/chat`）

请求经 `chat` 路由进入后，最终调用 `process_message(...)`，并携带客户端类型、角色、用户 ID 等上下文：

```python
result = await asyncio.to_thread(process_message, messages, context_summary, client_type, role, user_id)
```

### 5.2 会话摘要（`/api/chat/summarize`）

针对长对话进行摘要压缩，减少上下文冗余，提高后续推理稳定性与经济性。

```python
summary = await asyncio.to_thread(summarize_messages, messages)
```

### 5.3 反馈自动分析与写回（`/api/feedback/analyze`）

这是项目中的高价值自动化场景：Agent 不只“分析”，还会通过工具将建议写回业务数据库对应记录：

```python
@tool
def update_post_ai_suggestion(post_id: str, ai_suggestion: str) -> str:
    """将 AI 分析建议写回指定反馈帖子的 ai_suggestion 字段，并把状态设为 ai_replied。"""
    return _patch(
        f"/api/posts/{post_id}/ai-suggestion",
        {"aiSuggestion": ai_suggestion, "status": "ai_replied"},
    )
```

这使 AI 从“建议系统”演进为“可执行运营助手”。

---

## 6. Guardrails（质量护栏）：把约束写进执行链路

在本系统中，Guardrails 不是额外插件，而是 Agent 执行前就生效的硬约束机制。其目标是回答一个问题：**模型是否有资格调用某个工具、访问某类数据。**

### 6.1 工具访问护栏：按客户端与角色裁剪能力面

系统定义 `admin / screen / mobile` 三类客户端，并对 `admin` 侧引入角色白名单，避免同一模型在不同入口暴露一致权限面。

```python
CLIENT_ADMIN = "admin"
CLIENT_SCREEN = "screen"
CLIENT_MOBILE = "mobile"
```

```python
TOOL_WHITELIST_BY_ROLE = {
    "admin": ALL_TOOL_NAMES,
    "editor": ALL_TOOL_NAMES,
    "teacher": [...],
    "student": [...],
    "guest": [],
}
```

该设计体现最小权限原则：未知角色按 `guest` 处理，默认不给工具能力。

### 6.2 数据域护栏：Mobile 行级约束（核心实现）

移动端登录后，系统通过闭包工具把 `uid` 固化到查询参数里，确保只能查“自己的订单/明细”，而不是让模型自由拼接任意 `userId`。

```python
def _make_mobile_scoped_tools(user_id: int | None) -> list:
    uid = user_id if user_id is not None else 0
    if uid <= 0:
        return []

    def _query_my_orders(page: int = 1, size: int = 10) -> str:
        return _get(f"/api/v1/data/orders?currentPage={page}&size={size}&userId={uid}")

    def _query_my_order_items(page: int = 1, size: int = 10) -> str:
        return _get(f"/api/v1/data/order_items?currentPage={page}&size={size}&userId={uid}")
```

这就是 Guardrails 的关键证据：权限不是“提示词约束”，而是“执行路径约束”。

### 6.3 运行时护栏：请求级权限快照

每次请求先算 `allowed tools`，再编译 Agent 图；无权限时直接降级响应，不进入查库链路。

```python
tools = get_tools_for_request(client_type, role, uid)
agent = compile_agent(tools)
if agent is None:
    if client_type == CLIENT_ADMIN:
        empty["content"] = "当前角色没有数据查询权限，请使用管理员账号登录后再试。"
```

因此，本系统 Guardrails 的实现边界可表述为：**已完成权限型护栏；内容型护栏（注入检测、敏感回复拦截）作为后续增强。**

---

## 7. 审计与可解释：数据库可追溯闭环

Guardrails 解决“能不能做”，审计与可解释解决“做了什么、为何这么做”。本项目已实现最小闭环，且已落到数据库。

### 7.1 现有基础

- 数据层：`audit_logs` 表已存在；
- 接口层：`POST /api/v1/data/audit_logs` 可写入；
- AI 层：`/api/chat` 结束时自动写审计（best-effort，不阻塞主流程）。

### 7.2 审计记录字段语义

- `actorId`：操作者（来源 `userId`，可空）；
- `action`：动作类型（当前固定为 `ai_chat`）；
- `objectType/objectId`：对象语义与来源客户端；
- `details`：JSON 字符串，含输入摘要、输出摘要、`tool_calls` 与调用次数。

### 7.3 可解释能力边界

当前可解释能力已经覆盖：

- 模型是否触发工具调用；
- 调用了哪些工具、参数大致是什么；
- 结果与来源客户端之间的追溯关系。

这满足毕业设计“轻量可解释”的要求；若终稿增强，可继续补充耗时、失败原因、风险标签等治理指标。

---

## 8. 模块边界与章节归属（重构结论）

围绕“LangChain 到底负责什么”，本项目建议清晰分层：

1. **LangChain/LangGraph（本章主干）**：Agent 协作、状态流转、工具编排；
2. **Guardrails（第 6 节）**：权限约束与数据域控制；
3. **审计与可解释（第 7 节）**：调用留痕与追溯；
4. **语音与流式（独立文档）**：横切能力，不混入主编排章节；
5. **帖子向量索引与 `GET /api/vector/posts/search`（Spring Boot + 可选 mobile 消费）**：见 **`docs/AI板块与RAG技术设计说明.md`** 与 **`docs/后端设计（Spring Boot）.md` §2**；`POST /api/embeddings` 为 Spring 建索引服务，**不是** LangChain Tool。

一句话总结：**LangChain 是协作引擎；Guardrails 是约束层；审计是可解释层；向量检索是并列的数据检索子系统。**

---

## 9. 学术化总结：本项目中 LangChain 的方法论价值

从研究视角看，本项目的 LangChain 实践可概括为四点：

1. **能力外化**：将业务能力封装为可验证 Tool，替代模型“幻觉式知识”；
2. **流程显式化**：通过 LangGraph 将推理路径转为可追踪状态机；
3. **约束前置化**：在 Guardrails 中实现角色、客户端、数据域三级约束；
4. **治理闭环化**：通过审计落库形成可追溯、可解释能力。

因此，LangChain 在本系统中的定位不是“聊天增强插件”，而是连接大模型与业务系统的 **智能执行中间件**。它与 Guardrails、审计模块共同构成“可执行 + 可约束 + 可追溯”的 AI 工程体系。

