import os
from django.conf import settings
from groq import Groq

_groq_client = None


def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = getattr(settings, 'GROQ_API_KEY', None) or os.getenv('GROQ_API_KEY')
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not configured in settings or .env.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def is_prompt_safe(text: str) -> bool:
    """
    Evaluates the prompt using the meta-llama/llama-prompt-guard-2-22m model.
    Returns True if the prompt is safe, False if flagged as an injection or jailbreak attack.
    """
    client = get_groq_client()
    guard_model = getattr(settings, 'GROQ_GUARD_MODEL', 'meta-llama/llama-prompt-guard-2-22m')

    try:
        response = client.chat.completions.create(
            model=guard_model,
            messages=[{"role": "user", "content": text}],
            temperature=0.0,
        )
        content = (response.choices[0].message.content or "").lower()
        # Flags if injection/jailbreak is present, or if violation is confirmed (not 'no violation' or '0')
        if "injection" in content or "jailbreak" in content:
            return False
        if "violation" in content and "no violation" not in content and "violation: 0" not in content:
            return False
        return True
    except Exception as exc:
        print(f"[Warning] Groq Prompt Guard check exception: {exc}")
        return True


def chat_with_groq(prompt: str, user_language: str = "english", system_instruction: str = "") -> str:
    """
    Standard conversational chatbot response using Groq.
    """
    client = get_groq_client()
    chat_model = getattr(settings, 'GROQ_CHAT_MODEL', 'llama-3.3-70b-versatile')

    system_prompt = system_instruction or (
        f"You are a friendly, helpful, and concise AI assistant. "
        f"Respond in {user_language}. "
        "Answer questions clearly and assist the user with whatever they need."
    )

    response = client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        top_p=0.9,
    )
    return response.choices[0].message.content
