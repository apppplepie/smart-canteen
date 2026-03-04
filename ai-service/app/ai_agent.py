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
from langchain_core.messages import HumanMessage
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


def process_message(
    user_message: str,
    client_type: str = CLIENT_MOBILE,
    role: str | None = None,
) -> str:
    """
    统一入口：根据 clientType 与（admin）role 选工具，执行 Agent 或仅 LLM 回复。
    - client_type: "admin" | "screen" | "mobile"
    - role: 仅当 client_type=admin 时使用，用于 RBAC 白名单；缺省视为 guest。
    """
    if not user_message or not user_message.strip():
        return "请说一句你想查的内容，例如：查一下用户 1 的信息、用户 2 的订单。"

    client_type = (client_type or CLIENT_MOBILE).strip().lower()
    if client_type not in CLIENT_TYPES:
        client_type = CLIENT_MOBILE

    tools = get_tools_for_request(client_type, role)
    agent = compile_agent(tools)

    if agent is None:
        # admin 且无权限工具时（如 guest）：仅文字回复，不查库
        if client_type == CLIENT_ADMIN:
            return "当前角色没有数据查询权限，请使用管理员账号登录后再试。"
        return "请说一句你想查的内容。"

    state = agent.invoke({"messages": [HumanMessage(content=user_message.strip())]})
    messages = state["messages"]
    if not messages:
        return "没有收到回复。"
    last = messages[-1]
    content = getattr(last, "content", None) or ""
    if isinstance(content, list):
        content = " ".join(
            (c.get("text", "") if isinstance(c, dict) else str(c) for c in content)
        )
    return (content or "（无文本回复）").strip()
