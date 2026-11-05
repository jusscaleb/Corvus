import os
import logging
from django.conf import settings
from .groq_service import get_groq_client

logger = logging.getLogger(__name__)

# Standard language mapping for translation prompts
LANGUAGE_MAP = {
    'sn': 'Standard Zimbabwean Shona (chiShona)',
    'shona': 'Standard Zimbabwean Shona (chiShona)',
    'chishona': 'Standard Zimbabwean Shona (chiShona)',
    'nd': 'Standard Zimbabwean Northern Ndebele (isiNdebele)',
    'ndebele': 'Standard Zimbabwean Northern Ndebele (isiNdebele)',
    'isindebele': 'Standard Zimbabwean Northern Ndebele (isiNdebele)',
    'en': 'Standard English',
    'english': 'Standard English',
}

FALLBACK_TRANSLATION_MODELS = (
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "openai/gpt-oss-120b",
)


def translate_text(text: str, target_language: str, source_language: str = "auto") -> str:
    """
    Translates text between English, Shona, and Ndebele using Saiph AI via Groq.
    Preserves journalistic formatting, proper nouns, and dialect integrity.
    
    Args:
        text (str): Content or title to translate.
        target_language (str): Target language ('sn', 'nd', 'en' or full name).
        source_language (str): Optional source language if known.
        
    Returns:
        str: Clean translated text.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return ""

    target_key = target_language.lower().strip()
    source_key = source_language.lower().strip() if source_language else "auto"

    # Short-circuit if source and target are the same
    if source_key != "auto" and source_key == target_key:
        return cleaned

    target_desc = LANGUAGE_MAP.get(target_key, target_language.capitalize())
    source_desc = (
        LANGUAGE_MAP.get(source_key, "the source language")
        if source_key != "auto"
        else "the source language"
    )

    system_instruction = (
        f"You are Saiph, an expert bilingual news translator and linguist specializing in Zimbabwean languages.\n"
        f"Your task is to translate the provided text from {source_desc} into {target_desc}.\n\n"
        "Strict Translation Guidelines:\n"
        "1. Maintain authentic, dignified journalistic register and tone.\n"
        "2. If translating to Ndebele, strictly use Standard Zimbabwean Northern Ndebele (isiNdebele). Do not borrow South African Zulu slang or vocabulary.\n"
        "3. Preserve all proper nouns, names of people, towns, and institutions (e.g. Harare, Bulawayo, ZESA) accurately.\n"
        "4. Preserve formatting, line breaks, and paragraph structures.\n"
        "5. Output ONLY the raw translated text. Do NOT include preambles, notes, or explanations like 'Here is the translation:'."
    )

    client = get_groq_client()
    primary_model = getattr(settings, 'GROQ_TRANSLATION_MODEL', 'llama-3.3-70b-versatile')

    candidate_models = [primary_model]
    for m in FALLBACK_TRANSLATION_MODELS:
        if m not in candidate_models:
            candidate_models.append(m)

    last_err = None
    for model_name in candidate_models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": cleaned},
                ],
                temperature=0.2,
                top_p=0.9,
            )
            translated = (response.choices[0].message.content or "").strip()
            if translated:
                return translated
        except Exception as err:
            last_err = err
            err_str = str(err).lower()
            logger.warning(f"Translation with {model_name} failed: {err}. Attempting fallback...")
            if "model_not_found" in err_str or "404" in err_str or "decommissioned" in err_str:
                continue
            # For rate limits or temporary errors, try next model
            continue

    if last_err:
        logger.error(f"All translation models failed. Last error: {last_err}")
        # Graceful degradation: return original text if translation service fails
        return cleaned

    return cleaned

