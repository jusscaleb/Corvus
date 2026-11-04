import logging
import re
import threading
import requests
from django.conf import settings
from Newsroom.models import Member
from AI.groq_service import chat_with_groq

logger = logging.getLogger(__name__)

MAX_SMS_LENGTH = 160


def _strip_markdown(text: str) -> str:
    """Strips markdown/HTML formatting so SMS messages contain clean plain text."""
    if not text:
        return ""
    cleaned = str(text)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"^\s*#{1,6}\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*(?:---|___|\*\*\*)\s*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*>\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*(?:•|-|\*)\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def get_newsroom_sms_recipients(group, exclude_user=None) -> list[str]:
    """
    Fetches all distinct, non-empty phone numbers for members of `group`
    (excluding `exclude_user`) in a single SQL query (O(1) query count).
    """
    if not group:
        return []

    qs = (
        Member.objects.filter(group=group)
        .exclude(member__phone_number="")
        .exclude(member__phone_number__isnull=True)
    )
    if exclude_user is not None and getattr(exclude_user, "pk", None):
        qs = qs.exclude(member_id=exclude_user.pk)

    raw_numbers = qs.values_list("member__phone_number", flat=True)
    seen = set()
    recipients = []
    for num in raw_numbers:
        clean = str(num or "").strip()
        if clean and clean not in seen:
            seen.add(clean)
            recipients.append(clean)
    return recipients


def summarize_branch_for_sms(branch, pushed_by=None) -> str:
    """
    Uses Saiph AI (Groq) once per branch push to generate a concise <=160-character
    plain-text SMS summary for offline newsroom members, with an instant deterministic fallback.
    """
    article = branch.article
    group_name = article.group.group_name if article.group else "Newsroom"
    author_name = (
        getattr(pushed_by, "full_name", "")
        or getattr(pushed_by, "username", "")
        or getattr(branch.created_by, "full_name", "")
        or getattr(branch.created_by, "username", "")
        or "Reporter"
    )
    prefix = f"[Corvus•{group_name[:14]}] {author_name[:12]} pushed '{branch.branch_name[:16]}' ({article.title[:22]}): "
    available_chars = max(32, MAX_SMS_LENGTH - len(prefix))

    plain_content = _strip_markdown(branch.content or "")
    plain_desc = _strip_markdown(branch.branch_description or "")
    source_text = plain_content or plain_desc or article.title

    ai_gist = ""
    if source_text:
        try:
            prompt = (
                f"Article: {article.title}\n"
                f"Branch: {branch.branch_name}\n"
                f"Summary/Description: {plain_desc[:200]}\n"
                f"Draft Content:\n{plain_content[:1800]}\n\n"
                f"Write a single plain-text sentence under {available_chars} characters summarizing "
                f"the key update or finding in this branch for colleagues reading via offline SMS. "
                f"Do not use quotes, markdown, or hashtags."
            )
            raw_reply = chat_with_groq(
                user_message=prompt,
                system_prompt=(
                    "You are Saiph, an investigative newsroom wire editor. "
                    "Respond ONLY with a ultra-concise plain-text summary sentence."
                ),
            )
            ai_gist = _strip_markdown(raw_reply)
        except Exception as exc:
            logger.debug("Groq SMS summary fallback triggered: %s", exc)

    if not ai_gist:
        ai_gist = plain_desc or plain_content or "New branch update published to the desk."

    if len(ai_gist) > available_chars:
        ai_gist = ai_gist[: available_chars - 1].rstrip() + "…"

    full_sms = f"{prefix}{ai_gist}"
    return full_sms[:MAX_SMS_LENGTH]


def send_twilio_sms(to_numbers: list[str], body: str) -> dict:
    """
    Dispatches `body` to `to_numbers` via Twilio's REST API using a pooled HTTP session.
    """
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or ""
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or ""
    from_number = getattr(settings, "TWILIO_PHONE_NUMBER", "") or ""

    if not to_numbers:
        return {"sent_count": 0, "failed_count": 0, "summary": body, "recipients": []}

    if not (account_sid and auth_token and from_number):
        logger.info(
            "Twilio credentials not configured; skipped live SMS dispatch to %d recipient(s).",
            len(to_numbers),
        )
        return {
            "sent_count": 0,
            "failed_count": 0,
            "configured": False,
            "summary": body,
            "recipients": list(to_numbers),
        }

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    sent_count = 0
    failed_count = 0

    with requests.Session() as session:
        session.auth = (account_sid, auth_token)
        for phone in to_numbers:
            try:
                resp = session.post(
                    url,
                    data={
                        "From": from_number,
                        "To": phone,
                        "Body": body,
                    },
                    timeout=8,
                )
                if 200 <= resp.status_code < 300:
                    sent_count += 1
                else:
                    failed_count += 1
                    logger.warning(
                        "Twilio SMS to %s returned status %s: %s",
                        phone,
                        resp.status_code,
                        resp.text[:200],
                    )
            except Exception as exc:
                failed_count += 1
                logger.warning("Twilio SMS dispatch error for %s: %s", phone, exc)

    return {
        "sent_count": sent_count,
        "failed_count": failed_count,
        "configured": True,
        "summary": body,
        "recipients": list(to_numbers),
    }


def _summarize_and_send_worker(branch, pushed_by, recipients: list[str]) -> dict:
    """ Generates the 160-char AI summary once and sends it to all `recipients`."""
    summary_text = summarize_branch_for_sms(branch, pushed_by=pushed_by)
    return send_twilio_sms(recipients, summary_text)


def notify_newsroom_branch_published(branch, pushed_by=None, async_dispatch: bool = True) -> dict:
    """
    Entry point triggered when a user publishes (pushes) a branch in a newsroom:
    1. Queries recipient phone numbers in a single SQL query.
    2. Short-circuits immediately if there are no recipients (0 AI calls, 0 Twilio calls).
    3. Summarizes the branch once with Saiph AI and sends via Twilio (in a background thread
       when `async_dispatch=True` so the HTTP response returns immediately).
    """
    group = getattr(branch.article, "group", None)
    if not group:
        return {
            "queued": False,
            "recipient_count": 0,
            "reason": "personal_draft",
        }

    recipients = get_newsroom_sms_recipients(group, exclude_user=pushed_by)
    if not recipients:
        return {
            "queued": False,
            "recipient_count": 0,
            "reason": "no_recipient_phone_numbers",
        }

    if not async_dispatch:
        result = _summarize_and_send_worker(branch, pushed_by, recipients)
        return {
            "queued": True,
            "recipient_count": len(recipients),
            **result,
        }

    thread = threading.Thread(
        target=_summarize_and_send_worker,
        args=(branch, pushed_by, recipients),
        daemon=True,
    )
    thread.start()

    return {
        "queued": True,
        "recipient_count": len(recipients),
        "recipients": recipients,
    }

