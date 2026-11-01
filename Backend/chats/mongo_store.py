from datetime import datetime, timezone
from functools import lru_cache
import uuid
from django.conf import settings
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import PyMongoError


class MongoChatStoreUnavailable(RuntimeError):
    """Raised when MongoDB is not configured or reachable."""


@lru_cache(maxsize=1)
def _get_mongo_db():
    if not getattr(settings, 'MONGODB_URI', None):
        raise MongoChatStoreUnavailable("MongoDB is not configured. Set MONGODB_URI.")

    try:
        client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        )
        db = client[settings.MONGODB_DATABASE]

        db["conversations"].create_index([("type", ASCENDING), ("participants", ASCENDING)])
        db["conversations"].create_index([("type", ASCENDING), ("newsroom_group_id", ASCENDING)])
        db["messages"].create_index([("conversation_id", ASCENDING), ("created_at", ASCENDING)])

        return db
    except PyMongoError as exc:
        raise MongoChatStoreUnavailable(f"Could not connect to MongoDB: {exc}") from exc


def get_conversations_collection():
    return _get_mongo_db()["conversations"]


def get_messages_collection():
    return _get_mongo_db()["messages"]


# 1. Create Conversation (Direct, Group, or AI)
def create_conversation(conv_type, participants=None, newsroom_group_id=None, title=""):
    conv_id = f"conv_{uuid.uuid4()}"
    now = datetime.now(timezone.utc)
    doc = {
        "_id": conv_id,
        "conversation_id": conv_id,
        "type": conv_type,
        "title": title,
        "participants": [str(p) for p in (participants or [])],
        "newsroom_group_id": str(newsroom_group_id) if newsroom_group_id else None,
        "last_message": None,
        "created_at": now,
        "updated_at": now,
    }
    get_conversations_collection().insert_one(doc)
    return doc


# 2. Get User Conversations
def get_user_conversations(user_id, group_ids=None):
    group_ids = [str(g) for g in (group_ids or [])]
    query = {
        "$or": [
            {"type": {"$in": ["direct", "ai"]}, "participants": str(user_id)},
            {"type": "group", "newsroom_group_id": {"$in": group_ids}},
        ]
    }
    return list(get_conversations_collection().find(query).sort("updated_at", DESCENDING))


# 3. Save Message
def save_chat_message(conversation_id, sender_id, sender_type, content, metadata=None):
    msg_id = f"msg_{uuid.uuid4()}"
    now = datetime.now(timezone.utc)
    message_doc = {
        "_id": msg_id,
        "message_id": msg_id,
        "conversation_id": conversation_id,
        "sender_id": str(sender_id) if sender_id else None,
        "sender_type": sender_type,  # 'user', 'ai', 'system'
        "content": content,
        "metadata": metadata or {},
        "created_at": now,
    }
    get_messages_collection().insert_one(message_doc)

    # Update conversation's last message and timestamp
    get_conversations_collection().update_one(
        {"_id": conversation_id},
        {
            "$set": {
                "last_message": {
                    "content": content[:100],
                    "sender_id": str(sender_id) if sender_id else None,
                    "sender_type": sender_type,
                    "created_at": now,
                },
                "updated_at": now,
            }
        },
    )
    return message_doc


# 4. Get Messages Page with Cursor Pagination (Agricola pattern)
def get_conversation_messages_page(conversation_id, limit=20, before_id=None):
    collection = get_messages_collection()
    query = {"conversation_id": conversation_id}

    if before_id:
        try:
            anchor = collection.find_one(
                {"_id": ObjectId(before_id), "conversation_id": conversation_id},
                {"created_at": 1},
            )
        except InvalidId:
            anchor = collection.find_one(
                {"_id": before_id, "conversation_id": conversation_id},
                {"created_at": 1},
            )

        if not anchor:
            return [], False

        query["$or"] = [
            {"created_at": {"$lt": anchor["created_at"]}},
            {"created_at": anchor["created_at"], "_id": {"$lt": anchor["_id"]}},
        ]

    page = list(
        collection.find(query)
        .sort([("created_at", DESCENDING), ("_id", DESCENDING)])
        .limit(limit + 1)
    )

    has_more = len(page) > limit
    page = page[:limit]
    page.reverse()

    for msg in page:
        msg["_id"] = str(msg["_id"])
        if isinstance(msg.get("created_at"), datetime):
            msg["created_at"] = msg["created_at"].isoformat()

    return page, has_more
