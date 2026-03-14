"""
三种 Agent：admin / screen / mobile。
- admin：RBAC（按用户角色）+ Tool 白名单，仅允许角色对应的工具。
- screen / mobile：固定工具集，无 RBAC。
"""
import os
import json
from typing import Annotated

import requests
from dotenv import load_dotenv
from langchain_core.tools import tool, StructuredTool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import TypedDict

load_dotenv()

SPRING_BOOT_BASE_URL = os.getenv("SPRING_BOOT_BASE_URL", "http://localhost:8081").rstrip("/")

# 客户端类型
CLIENT_ADMIN = "admin"
CLIENT_SCREEN = "screen"
CLIENT_MOBILE = "mobile"
CLIENT_TYPES = (CLIENT_ADMIN, CLIENT_SCREEN, CLIENT_MOBILE)


def _get(path: str) -> str:
    url = f"{SPRING_BOOT_BASE_URL}{path}"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return json.dumps(r.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "url": url}, ensure_ascii=False)


def _patch(path: str, body: dict) -> str:
    """PATCH 请求，供 update_post_ai_suggestion 等写回 Spring Boot。"""
    url = f"{SPRING_BOOT_BASE_URL}{path}"
    try:
        print(f"[ai_agent] PATCH {url} bodyKeys={list(body.keys()) if body else []}", flush=True)
        r = requests.patch(url, json=body, timeout=10)
        r.raise_for_status()
        out = json.dumps(r.json() if r.content else {"ok": True}, ensure_ascii=False, indent=2)
        print(f"[ai_agent] PATCH 成功 {path}", flush=True)
        return out
    except Exception as e:
        print(f"[ai_agent] PATCH 失败 {path}: {e}", flush=True)
        return json.dumps({"error": str(e), "url": url}, ensure_ascii=False)


# ========== 所有 Tool 定义（名称用于白名单） ==========

@tool
def get_user_info(user_id: str) -> str:
    """根据用户ID查询用户信息。user_id 为数字 ID。"""
    return _get(f"/api/users/{user_id}")


@tool
def list_users() -> str:
    """获取用户列表（未删除用户）。"""
    return _get("/api/users")


@tool
def get_order_info(order_id: str) -> str:
    """根据订单ID查询订单详情。order_id 为数字 ID。"""
    return _get(f"/api/orders/{order_id}")


@tool
def list_orders_by_user(user_id: str) -> str:
    """根据用户ID查询该用户的所有订单列表。user_id 为数字 ID。"""
    return _get(f"/api/orders/user/{user_id}")


@tool
def list_orders_by_vendor(vendor_id: str) -> str:
    """根据商家/供应商ID查询该商家的订单列表。vendor_id 为数字 ID。"""
    return _get(f"/api/orders/vendor/{vendor_id}")


@tool
def get_post_by_id(post_id: str) -> str:
    """根据帖子/反馈 ID 查询单条详情。post_id 为数字 ID。"""
    return _get(f"/api/posts/{post_id}")


@tool
def list_posts(user_id: str = "", vendor_id: str = "") -> str:
    """查询动态/帖子列表。可选：只查某用户的帖子传 user_id，只查某商家的传 vendor_id；都不传则返回全部。"""
    if user_id:
        return _get(f"/api/posts/user/{user_id}")
    if vendor_id:
        return _get(f"/api/posts/vendor/{vendor_id}")
    return _get("/api/posts")


@tool
def query_data_table(table: str, id_or_empty: str = "", page: int = 1, size: int = 10) -> str:
    """查询通用数据表。table 可选: users, orders, posts, vendors, menu_items, order_items 等。
    若传 id_or_empty 则查单条；否则查分页列表，page 从 1 开始，size 每页条数（最大 100）。"""
    if id_or_empty and id_or_empty.strip():
        return _get(f"/api/v1/data/{table.strip()}/{id_or_empty.strip()}")
    return _get(f"/api/v1/data/{table.strip()}?currentPage={page}&size={size}")


# ========== 批量生成「查表」工具：只维护配置表，无需每个表手写 @tool ==========
# 与后端 V1DataController 的表名一致；description 给 LLM 选工具用
TABLE_QUERY_CONFIG = [
    {"name": "users", "description": "查询用户表。传 id 查单条，不传则分页列表；page 从 1 开始，size 每页条数（最大 100）。"},
    {"name": "vendors", "description": "查询商家/供应商表。传 id 查单条，不传则分页列表。"},
    {"name": "posts", "description": "查询动态/帖子表。传 id 查单条，不传则分页列表。"},
    {"name": "orders", "description": "查询订单表。传 id 查单条，不传则分页列表。"},
    {"name": "order_items", "description": "查询订单明细表。传 id 查单条，不传则分页列表。"},
    {"name": "menu_items", "description": "查询菜单项表。传 id 查单条，不传则分页列表。"},
    {"name": "agent_requests", "description": "查询 Agent 请求记录表。传 id 查单条，不传则分页列表。"},
    {"name": "audit_logs", "description": "查询审计日志表。传 id 查单条，不传则分页列表。"},
    {"name": "call_events", "description": "查询呼叫事件表。传 id 查单条，不传则分页列表。"},
    {"name": "nutrition_logs", "description": "查询营养日志表。传 id 查单条，不传则分页列表。"},
    {"name": "queue_entries", "description": "查询排队记录表。传 id 查单条，不传则分页列表。"},
    {"name": "retained_samples", "description": "查询留样表。传 id 查单条，不传则分页列表。"},
    {"name": "sensor_logs", "description": "查询传感器日志表。传 id 查单条，不传则分页列表。"},
    {"name": "stock_movements", "description": "查询库存变动表。传 id 查单条，不传则分页列表。"},
    {"name": "test_reports", "description": "查询检测报告表。传 id 查单条，不传则分页列表。"},
    {"name": "materials", "description": "查询食材主数据表。传 id 查单条，不传则分页列表。"},
    {"name": "ai_conversations", "description": "查询 AI 会话表。传 id 查单条，不传则分页列表。"},
    {"name": "ai_messages", "description": "查询 AI 消息表。传 id 查单条，不传则分页列表。"},
]


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


# 一次性生成所有「按表查」工具
TABLE_QUERY_TOOLS = [_make_table_query_tool(c["name"], c["description"]) for c in TABLE_QUERY_CONFIG]
DATA_TABLE_TOOL_NAMES = [t.name for t in TABLE_QUERY_TOOLS]


def _query_menu_item_materials(menu_item_id: str = "", material_id: str = "", page: int = 1, size: int = 10) -> str:
    """查菜品-食材关联表。可选 menu_item_id 或 material_id 筛选；都不传则分页列表。"""
    params = [f"currentPage={page}", f"size={size}"]
    if menu_item_id and str(menu_item_id).strip():
        params.append(f"menuItemId={menu_item_id.strip()}")
    if material_id and str(material_id).strip():
        params.append(f"materialId={material_id.strip()}")
    return _get(f"/api/v1/data/menu_item_materials?{'&'.join(params)}")


query_menu_item_materials = StructuredTool.from_function(
    name="query_menu_item_materials",
    description="查询菜品-食材关联表。传 menu_item_id 按菜品查用了哪些食材，传 material_id 按食材查被哪些菜品使用；都不传则分页列表。",
    func=_query_menu_item_materials,
)


@tool
def update_post_ai_suggestion(post_id: str, ai_suggestion: str) -> str:
    """将 AI 分析建议写回指定反馈帖子的 ai_suggestion 字段，并把状态设为 ai_replied。post_id 为数字 ID，ai_suggestion 为要写入的文本。"""
    return _patch(
        f"/api/posts/{post_id}/ai-suggestion",
        {"aiSuggestion": ai_suggestion, "status": "ai_replied"},
    )


# 所有工具列表（顺序固定，用于按名取子集）
ALL_TOOLS = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_orders_by_vendor,
    list_posts,
    *TABLE_QUERY_TOOLS,
    query_data_table,
]
ALL_TOOL_NAMES = [t.name for t in ALL_TOOLS]
TOOLS_BY_NAME = {t.name: t for t in ALL_TOOLS}
TOOLS_BY_NAME["get_post_by_id"] = get_post_by_id
TOOLS_BY_NAME["query_menu_item_materials"] = query_menu_item_materials
TOOLS_BY_NAME["update_post_ai_suggestion"] = update_post_ai_suggestion


# ========== Admin RBAC：按角色的 Tool 白名单 ==========
# 仅当 clientType=admin 时生效；未配置的角色视为 guest（无工具或最小集）

TOOL_WHITELIST_BY_ROLE = {
    "admin": ALL_TOOL_NAMES,  # 管理员：全部工具
    "editor": ALL_TOOL_NAMES,  # 编辑：同 admin，可按需缩小
    "teacher": [
        "get_user_info", "list_users", "get_order_info", "list_orders_by_user",
        "list_orders_by_vendor", "list_posts", "query_data_table",
        *DATA_TABLE_TOOL_NAMES,
    ],
    "student": [
        "get_user_info", "list_users", "get_order_info", "list_orders_by_user",
        "list_posts",
        *DATA_TABLE_TOOL_NAMES,  # 可按需改为子集，如 ["query_users", "query_orders"]
    ],
    "guest": [],  # 未登录或未知角色：不允许任何查库工具
}


# ========== 反馈分析专用工具集（后台任务，非用户对话） ==========
# 读：当前反馈、posts、溯源与质检相关表。写：仅 update_post_ai_suggestion。

FEEDBACK_ANALYZER_TOOL_NAMES = [
    "get_post_by_id",
    "list_posts",
    "query_posts",
    "query_stock_movements",
    "query_test_reports",
    "query_vendors",
    "query_sensor_logs",
    "query_retained_samples",
    "query_menu_items",
    "query_materials",
    "query_menu_item_materials",
    "update_post_ai_suggestion",
]
TOOLS_FOR_FEEDBACK_ANALYZER = [TOOLS_BY_NAME[n] for n in FEEDBACK_ANALYZER_TOOL_NAMES if n in TOOLS_BY_NAME]


# ========== Screen / Mobile 固定工具集（无 RBAC） ==========
# screen 大屏允许查表 vendors，用于食堂/商家推荐

TOOLS_FOR_SCREEN = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_orders_by_vendor,
    list_posts,
    TOOLS_BY_NAME["query_vendors"],
]
TOOLS_FOR_MOBILE = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_posts,
]

# 大屏 AI 助手角色说明，会注入到 screen 请求的首条系统消息
SCREEN_SYSTEM_PROMPT = """你是食堂大屏的 AI 助手，负责给学生推荐食堂、商家并回答与食堂相关的问题。
你可以使用 query_vendors 工具查询商家/供应商表（食堂窗口、档口等），根据查询结果推荐今日可去的食堂与档口。
请保持热情、友好、简洁。若问题与食堂无关，可委婉引导回食堂话题。"""


def get_tools_for_request(client_type: str, role: str | None) -> list:
    """
    根据 clientType 与（仅 admin）role 决定本次请求可用的工具。
    - admin：按 role 白名单，无 role 或未知 role 视为 guest（无工具）。
    - screen：TOOLS_FOR_SCREEN
    - mobile 或其他：TOOLS_FOR_MOBILE
    """
    if client_type == CLIENT_ADMIN:
        role_key = (role or "").strip().lower() or "guest"
        allowed_names = TOOL_WHITELIST_BY_ROLE.get(role_key, TOOL_WHITELIST_BY_ROLE["guest"])
        return [TOOLS_BY_NAME[n] for n in allowed_names if n in TOOLS_BY_NAME]
    if client_type == CLIENT_SCREEN:
        return list(TOOLS_FOR_SCREEN)
    return list(TOOLS_FOR_MOBILE)


# ========== LangGraph：按工具集动态编译 Agent ==========

class State(TypedDict):
    messages: Annotated[list, add_messages]


def _make_should_continue(tools: list):
    def _should_continue(state: State) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "end"
    return _should_continue


def _make_agent_node(tools: list):
    def _agent_node(state: State) -> dict:
        llm = ChatOpenAI(
            model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            openai_api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
            openai_api_base=os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
            temperature=0.3,
        ).bind_tools(tools)
        response = llm.invoke(state["messages"])
        return {"messages": [response]}
    return _agent_node


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


SUMMARY_MAX_CHARS = 500


def _messages_to_langchain(messages: list[dict]) -> list:
    """将 [{"role":"user"/"assistant","content":"..."}] 转为 LangChain Message 列表。"""
    out = []
    for m in messages:
        role = (m.get("role") or "user").strip().lower()
        content = (m.get("content") or "").strip()
        if role == "user":
            out.append(HumanMessage(content=content))
        elif role == "assistant":
            out.append(AIMessage(content=content))
        # system 可在此扩展
    return out


def summarize_messages(messages: list[dict]) -> str:
    """
    将一段对话总结为 500 字以内的小结。LangChain 无内置「对话摘要」配置，此处自行调用 LLM。
    """
    if not messages:
        return ""
    lines = []
    for m in messages:
        role = m.get("role") or "user"
        content = (m.get("content") or "").strip()
        if content:
            lines.append(f"{role}: {content}")
    if not lines:
        return ""
    text = "\n".join(lines)
    prompt = f"""请将以下对话总结为一段{SUMMARY_MAX_CHARS}字以内的小结，只输出小结内容，不要「小结：」等前缀或其它说明：

{text}"""
    try:
        llm = ChatOpenAI(
            model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            openai_api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
            openai_api_base=os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
            temperature=0.2,
        )
        resp = llm.invoke([HumanMessage(content=prompt)])
        content = getattr(resp, "content", None) or ""
        if isinstance(content, list):
            content = " ".join(
                (c.get("text", "") if isinstance(c, dict) else str(c) for c in content)
            )
        summary = (content or "").strip()[:SUMMARY_MAX_CHARS]
        return summary
    except Exception as e:
        return f"（摘要生成失败: {e!s}）"[:SUMMARY_MAX_CHARS]


def _serialize_tool_calls(msg) -> list | None:
    """从 AIMessage 提取 tool_calls 为可 JSON 序列化的列表。"""
    if not hasattr(msg, "tool_calls") or not msg.tool_calls:
        return None
    out = []
    for tc in msg.tool_calls:
        if hasattr(tc, "id"):
            out.append({
                "id": getattr(tc, "id", "") or "",
                "name": getattr(tc, "name", "") or "",
                "args": getattr(tc, "args", None) or {},
            })
        elif isinstance(tc, dict):
            out.append({
                "id": tc.get("id", ""),
                "name": tc.get("name", ""),
                "args": tc.get("args", {}),
            })
    return out if out else None


def process_message(
    messages: list[dict],
    context_summary: str | None = None,
    client_type: str = CLIENT_MOBILE,
    role: str | None = None,
) -> dict:
    """
    统一入口：根据 clientType 与（admin）role 选工具，执行 Agent 或仅 LLM 回复。
    messages: 最近几轮对话 [{"role":"user"/"assistant","content":"..."}]，至少一条 user。
    context_summary: 可选，此前对话的 500 字内小结，会作为系统上下文注入。
    返回 {"content": str, "tool_calls": list | None, "suggestions": list[str] | None}。
    """
    empty = {"content": "", "tool_calls": None, "suggestions": None}
    if not messages:
        empty["content"] = "请说一句你想查的内容，例如：查一下用户 1 的信息、用户 2 的订单。"
        return empty

    last_user = next(
        (
            (m.get("content") or "").strip()
            for m in reversed(messages)
            if (m.get("role") or "").strip().lower() == "user"
        ),
        "",
    )
    if not last_user:
        empty["content"] = "请说一句你想查的内容。"
        return empty

    client_type = (client_type or CLIENT_MOBILE).strip().lower()
    if client_type not in CLIENT_TYPES:
        client_type = CLIENT_MOBILE

    tools = get_tools_for_request(client_type, role)
    agent = compile_agent(tools)

    if agent is None:
        if client_type == CLIENT_ADMIN:
            empty["content"] = "当前角色没有数据查询权限，请使用管理员账号登录后再试。"
        else:
            empty["content"] = "请说一句你想查的内容。"
        return empty

    # 构建发给 Agent 的消息：screen 时注入角色说明；可选小结；最近几轮
    lc_messages = []
    if client_type == CLIENT_SCREEN:
        lc_messages.append(SystemMessage(content=SCREEN_SYSTEM_PROMPT))
    if context_summary and context_summary.strip():
        lc_messages.append(
            SystemMessage(content=f"【此前对话摘要】\n{context_summary.strip()}\n\n【以下为最近对话】")
        )
    lc_messages.extend(_messages_to_langchain(messages))

    state = agent.invoke({"messages": lc_messages})
    messages = state["messages"]
    if not messages:
        empty["content"] = "没有收到回复。"
        return empty

    content = ""
    tool_calls = None
    for m in reversed(messages):
        if hasattr(m, "content") and m.content and not (getattr(m, "tool_calls", None)):
            content = m.content
            if isinstance(content, list):
                content = " ".join(
                    (c.get("text", "") if isinstance(c, dict) else str(c) for c in content)
                )
            content = (content or "").strip()
            break
    if not content:
        content = "（无文本回复）"
    for m in messages:
        tc = _serialize_tool_calls(m)
        if tc:
            tool_calls = tc if tool_calls is None else (tool_calls + tc)

    return {
        "content": content,
        "tool_calls": tool_calls,
        "suggestions": None,  # 可后续接入：根据回复生成 2～3 条追问建议
    }


# ========== 反馈分析（后台任务，方案 B：Agent 写库） ==========

FEEDBACK_ANALYZER_SYSTEM = """你是食堂/校园反馈分析助手。根据用户提交的反馈内容，你可以：
1. 使用 get_post_by_id 查看当前反馈详情；
2. 使用 query_stock_movements、query_vendors、query_materials、query_menu_items、query_menu_item_materials 等查表做溯源（例如：用户说米有问题，可查库存与供应商）；
3. 使用 query_test_reports、query_retained_samples、query_sensor_logs 等查看检测、留样、传感器数据以辅助判断。
分析完成后，你必须调用工具 update_post_ai_suggestion，传入当前反馈的 post_id 和你生成的一段「AI 建议」文本（给后勤/管理员的简短分析与建议），将结果写回数据库。post_id 由下方用户消息中给出。只输出分析结论并调用写回工具，不要重复冗长内容。"""


def run_feedback_analyzer(post_id: int, content: str, feedback_type: str = "other") -> str:
    """
    后台任务：对一条反馈做 AI 分析，Agent 可查表并必须调用 update_post_ai_suggestion 写回。
    返回最终生成的 ai_suggestion 文本（便于日志或兜底）。
    """
    print(f"[feedback_analyzer] 1/4 开始 post_id={post_id}, contentLen={len(content or '')}, feedback_type={feedback_type}", flush=True)
    tools = TOOLS_FOR_FEEDBACK_ANALYZER
    agent = compile_agent(tools)
    if not agent:
        print("[feedback_analyzer] 未配置工具，退出", flush=True)
        return "（反馈分析未配置工具）"
    print(f"[feedback_analyzer] 2/4 工具数={len(tools)}, 调用 Agent ...", flush=True)
    user_content = f"""【当前反馈 ID】{post_id}\n【类型】{feedback_type}\n【用户反馈内容】\n{content or ''}\n\n请根据上述内容进行分析，必要时查表溯源，然后调用 update_post_ai_suggestion(post_id="{post_id}", ai_suggestion="你的分析建议文本") 将建议写回数据库。"""
    lc_messages = [
        SystemMessage(content=FEEDBACK_ANALYZER_SYSTEM),
        HumanMessage(content=user_content),
    ]
    try:
        state = agent.invoke({"messages": lc_messages})
        messages = state.get("messages") or []
        print(f"[feedback_analyzer] 3/4 Agent 返回 message 数={len(messages)}", flush=True)
        content_out = ""
        for m in reversed(messages):
            if hasattr(m, "content") and m.content and not getattr(m, "tool_calls", None):
                c = m.content
                if isinstance(c, list):
                    c = " ".join((x.get("text", "") if isinstance(x, dict) else str(x) for x in c))
                content_out = (c or "").strip()
                break
        result = content_out or "（无文本回复）"
        print(f"[feedback_analyzer] 4/4 完成 suggestionLen={len(result)}", flush=True)
        return result
    except Exception as e:
        print(f"[feedback_analyzer] 4/4 异常: {e}", flush=True)
        return f"（分析异常: {e!s}）"
