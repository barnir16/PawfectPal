# tests/test_chat_router.py
import pytest
from datetime import datetime, timezone
from fastapi import status
from app.models import UserORM, ServiceRequestORM, ChatMessageORM
from app.routers import chat
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user
from app.main import app  # Your FastAPI app instance


# ----------------------------
# Fixtures: Users
# ----------------------------
@pytest.fixture
def test_user(db_session, client):
    user = UserORM(
        username="user1",
        email="user1@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Override get_current_user (both absolute and relative imports)
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[rel_get_current_user] = lambda: user
    yield user
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


@pytest.fixture
def test_provider(db_session, client):
    provider = UserORM(
        username="provider1",
        email="provider1@test.com",
        is_provider=True,
        hashed_password="StrongPass1",
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)
    yield provider


# ----------------------------
# Fixture: Service Request
# ----------------------------
@pytest.fixture
def test_service_request(db_session, test_user):
    # Provide required non-null fields to satisfy schema constraints
    request = ServiceRequestORM(
        user_id=test_user.id,
        service_type="walking",
        title="Need a dog walker",
        description="Looking for a reliable dog walker for 30 minutes.",
        pet_ids=[],  # empty list is valid JSON and satisfies non-null
        responses_count=0,
    )
    db_session.add(request)
    db_session.commit()
    db_session.refresh(request)
    yield request


# ----------------------------
# Fixture: Chat Message
# ----------------------------
@pytest.fixture
def test_message(db_session, test_user, test_service_request):
    message = ChatMessageORM(
        service_request_id=test_service_request.id,
        sender_id=test_user.id,
        message="Hello",
        message_type="text",
        is_read=False,
        created_at=datetime.now(timezone.utc),
        is_edited=False,
    )
    db_session.add(message)
    db_session.commit()
    db_session.refresh(message)
    yield message


# ----------------------------
# Tests
# ----------------------------
@pytest.mark.asyncio
async def test_send_message_success(client, test_user, test_service_request):
    payload = {
        "service_request_id": test_service_request.id,
        "message": "Test message",
        "message_type": "text",
        "attachments": [],
    }
    response = await client.post("/chat/messages", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["service_request_id"] == test_service_request.id
    assert data["message"] == "Test message"


@pytest.mark.asyncio
async def test_send_message_access_denied(
    client, db_session, test_service_request, test_provider
):
    other_user = UserORM(
        username="other",
        email="other@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    # Override current user to "other" (both absolute and relative)
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    payload = {
        "service_request_id": test_service_request.id,
        "message": "Test message",
        "message_type": "text",
        "attachments": [],
    }
    response = await client.post("/chat/messages", json=payload)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_conversation_success(client, test_service_request):
    response = await client.get(f"/chat/conversations/{test_service_request.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["service_request_id"] == test_service_request.id


@pytest.mark.asyncio
async def test_get_my_conversations_user(client, test_service_request):
    response = await client.get("/chat/my-conversations")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert any(conv["service_request_id"] == test_service_request.id for conv in data)


@pytest.mark.asyncio
async def test_mark_message_read_success(client, test_message):
    response = await client.put(f"/chat/messages/{test_message.id}/read")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Message marked as read"


@pytest.mark.asyncio
async def test_mark_message_read_access_denied(client, db_session, test_message):
    other_user = UserORM(
        username="other2",
        email="other2@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    response = await client.put(f"/chat/messages/{test_message.id}/read")
    assert response.status_code == status.HTTP_403_FORBIDDEN
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass
