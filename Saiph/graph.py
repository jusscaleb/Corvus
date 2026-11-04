from typing import Annotated, Sequence
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from .config import GROQ_API_KEY, GROQ_MODEL
from .tools import ALL_AGENT_TOOLS


class AgentState(TypedDict):
    """LangGraph State tracking message history and user token."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    token: str


def _get_llm():
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured in environment.")
    return ChatGroq(
        model=GROQ_MODEL,
        api_key=GROQ_API_KEY,
        temperature=0.3,
    ).bind_tools(ALL_AGENT_TOOLS)


def call_model(state: AgentState):
    """The reasoning brain of the agent."""
    messages = list(state["messages"])
    
    # Prepend system instruction if not already present
    if not messages or not isinstance(messages[0], SystemMessage):
        system_prompt = (
            "You are Saiph, the autonomous newsroom and workspace AI agent for Corvus. "
            "You can converse naturally as a friendly, intelligent assistant about any general topic, "
            "AND you have tools to inspect newsroom groups, read article drafts, fork branches, "
            "and update editorial content by making requests to the Corvus Backend.\n\n"
            f"Whenever calling any tool, ALWAYS pass token='{state.get('token', '')}'.\n"
            "If the user is just saying hello or asking conversational questions, respond conversationally.\n"
            "If the user asks you to check, create, or update newsroom content, use the appropriate tools."
        )
        messages.insert(0, SystemMessage(content=system_prompt))

    llm = _get_llm()
    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    """Determines whether the agent needs to call a tool or finish."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


def build_corvus_agent():
    """Builds the compiled LangGraph StateGraph agent."""
    workflow = StateGraph(AgentState)

    tool_node = ToolNode(ALL_AGENT_TOOLS)

    workflow.add_node("agent", call_model)
    workflow.add_node("tools", tool_node)

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", END])
    workflow.add_edge("tools", "agent")

    return workflow.compile()
