import os
from django.conf import settings
from groq import Groq

_groq_client = None

FALLBACK_CHAT_MODELS = (
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
)


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
    Standard conversational chatbot response using Groq with automatic model fallback
    if the primary model is unavailable or deprecated.
    """
    client = get_groq_client()
    configured_model = getattr(settings, 'GROQ_CHAT_MODEL', 'openai/gpt-oss-120b') or 'openai/gpt-oss-120b'

    candidate_models = [configured_model]
    for m in FALLBACK_CHAT_MODELS:
        if m not in candidate_models:
            candidate_models.append(m)

    system_prompt = system_instruction or (
        f"You are a friendly, helpful, and concise AI assistant. "
        f"Respond in {user_language}. "
        "Answer questions clearly and assist the user with whatever they need."
    )

    last_err = None
    for model_name in candidate_models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.6,
                top_p=0.9,
            )
            return response.choices[0].message.content
        except Exception as err:
            last_err = err
            err_str = str(err).lower()
            if "model_not_found" in err_str or "404" in err_str or "decommissioned" in err_str:
                continue
            raise

    if last_err:
        raise last_err
    return ""
