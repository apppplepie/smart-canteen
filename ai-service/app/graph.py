# app/graph.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI  # 示例LLM

class State(TypedDict):
    messages: list[str]

def agent_node(state: State):
    """代理节点逻辑"""
    llm = ChatOpenAI(model="gpt-4o-mini")
    result = llm.invoke(state["messages"][-1])
    return {"messages": state["messages"] + [result.content]}

# 构建并导出编译后的图
graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_edge(START, "agent")
graph.add_edge("agent", END)
app_graph = graph.compile()  # 编译后的图