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
from langchain_core.tools import tool
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


# 所有工具列表（顺序固定，用于按名取子集）
ALL_TOOLS = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_orders_by_vendor,
    list_posts,
    query_data_table,
]
ALL_TOOL_NAMES = [t.name for t in ALL_TOOLS]
TOOLS_BY_NAME = {t.name: t for t in ALL_TOOLS}


# ========== Admin RBAC：按角色的 Tool 白名单 ==========
# 仅当 clientType=admin 时生效；未配置的角色视为 guest（无工具或最小集）

TOOL_WHITELIST_BY_ROLE = {
    "admin": ALL_TOOL_NAMES,  # 管理员：全部工具
    "editor": ALL_TOOL_NAMES,  # 编辑：同 admin，可按需缩小
    "teacher": [
        "get_user_info", "list_users", "get_order_info", "list_orders_by_user",
        "list_orders_by_vendor", "list_posts", "query_data_table",
    ],
    "student": [
        "get_user_info", "list_users", "get_order_info", "list_orders_by_user",
        "list_posts",
    ],
    "guest": [],  # 未登录或未知角色：不允许任何查库工具
}


# ========== Screen / Mobile 固定工具集（无 RBAC） ==========

TOOLS_FOR_SCREEN = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_orders_by_vendor,
    list_posts,
]
TOOLS_FOR_MOBILE = [
    get_user_info,
    list_users,
    get_order_info,
    list_orders_by_user,
    list_posts,
]


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

    # 构建发给 Agent 的消息：可选小结 + 最近几轮
    lc_messages = []
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
