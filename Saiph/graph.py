from typing import Annotated, Sequence, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from .config import GROQ_API_KEY, GROQ_MODEL
from .tools import ALL_AGENT_TOOLS


class AgentState(TypedDict, total=False):
    """LangGraph State tracking message history, optional active article context, and memories."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    token: str
    article_id: Optional[str]
    branch_id: Optional[str]
    memories: Optional[list]


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
    messages = list(state.get("messages", []))

    if not messages or not isinstance(messages[0], SystemMessage):
        article_ctx = ""
        if state.get("article_id"):
            article_ctx = f"\nActive Article ID: {state['article_id']}"
        if state.get("branch_id"):
            article_ctx += f"\nActive Branch ID: {state['branch_id']}"
        memories = state.get("memories") or []
        mem_ctx = ("\nSaved Memories:\n" + "\n".join(f"- {m}" for m in memories)) if memories else ""

        system_prompt = (
            "You are Saiph, the autonomous newsroom and article AI agent for Corvus. "
            "You converse in clear, simple, everyday language and have tools to draft articles "
            "from brief summaries, generate mindmaps, curate editorial boards with suggestions "
            "and sources, run plagiarism and AI-writing checks, manage branches, and store long-term memories."
            f"{article_ctx}{mem_ctx}\n"
            "Explain improvements simply and practically so any writer can act on them right away."
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
