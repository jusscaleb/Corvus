from langchain_core.messages import HumanMessage, AIMessage
from .graph import build_corvus_agent

_compiled_agent = None


def get_agent():
    global _compiled_agent
    if _compiled_agent is None:
        _compiled_agent = build_corvus_agent()
    return _compiled_agent


def run_agent(user_message: str, token: str = "", chat_history: list = None) -> str:
    """
    Executes the Saiph agent:
    - user_message: String prompt from the user
    - token: JWT access token from the Django backend (for authorizing tool calls)
    - chat_history: Optional list of previous {'role': 'user'|'assistant', 'content': '...'}
    """
    agent = get_agent()

    messages = []
    if chat_history:
        for m in chat_history:
            if m.get("role") == "user":
                messages.append(HumanMessage(content=m.get("content", "")))
            elif m.get("role") in ("assistant", "ai"):
                messages.append(AIMessage(content=m.get("content", "")))

    messages.append(HumanMessage(content=user_message))

    initial_state = {
        "messages": messages,
        "token": token,
    }

    final_state = agent.invoke(initial_state)
    last_message = final_state["messages"][-1]
    return last_message.content


if __name__ == "__main__":
    import sys
    print("Saiph AI Agent CLI (Type 'exit' to quit)")
    print("-" * 50)
    history = []
    while True:
        try:
            prompt = input("You: ")
            if prompt.strip().lower() in ("exit", "quit"):
                break
            reply = run_agent(user_message=prompt, chat_history=history)
            print(f"Agent: {reply}\n")
            history.append({"role": "user", "content": prompt})
            history.append({"role": "assistant", "content": reply})
        except (KeyboardInterrupt, EOFError):
            break
