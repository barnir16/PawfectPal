from unittest.mock import AsyncMock, patch

import pytest

from app.dependencies.auth import get_current_user
from app.main import app
from app.models import ChatMessageORM, ServiceRequestORM, UserORM


@pytest.fixture
def owner_user(db_session):
    user = UserORM(
        username="chat_owner",
        email="owner@test.com",
        hashed_password="StrongPass1",
        is_provider=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def assigned_provider(db_session):
    user = UserORM(
        username="assigned_provider",
        email="provider@test.com",
        hashed_password="StrongPass1",
        is_provider=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def outside_user(db_session):
    user = UserORM(
        username="outside_user",
        email="outside@test.com",
        hashed_password="StrongPass1",
        is_provider=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def provider_with_history(db_session):
    user = UserORM(
        username="provider_with_history",
        email="history@test.com",
        hashed_password="StrongPass1",
        is_provider=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def service_request(db_session, owner_user, assigned_provider):
    request = ServiceRequestORM(
        user_id=owner_user.id,
        assigned_provider_id=assigned_provider.id,
        service_type="walking",
        title="Need a dog walker",
        description="Looking for a reliable dog walker for 30 minutes.",
        pet_ids=[],
        responses_count=0,
    )
    db_session.add(request)
    db_session.commit()
    db_session.refresh(request)
    return request


@pytest.fixture
def existing_message(db_session, service_request, owner_user):
    message = ChatMessageORM(
        service_request_id=service_request.id,
        sender_id=owner_user.id,
        message="Hello from the owner",
        message_type="text",
        is_read=False,
    )
    db_session.add(message)
    db_session.commit()
    db_session.refresh(message)
    return message


@pytest.fixture
def override_current_user():
    def _override(user):
        app.dependency_overrides[get_current_user] = lambda: user

    yield _override
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_send_message_success(
    client, db_session, override_current_user, owner_user, service_request
):
    override_current_user(owner_user)

    with patch(
        "app.routers.chat.send_push_notification_for_message", new=AsyncMock()
    ) as mock_push:
        response = await client.post(
            "/chat/messages",
            json={
                "service_request_id": service_request.id,
                "message": "Test message",
                "message_type": "text",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["service_request_id"] == service_request.id
    assert data["sender_id"] == owner_user.id
    assert data["message"] == "Test message"

    saved_messages = db_session.query(ChatMessageORM).all()
    assert len(saved_messages) == 1
    mock_push.assert_awaited_once()


@pytest.mark.asyncio
async def test_send_message_access_denied_for_unrelated_user(
    client, override_current_user, outside_user, service_request
):
    override_current_user(outside_user)

    response = await client.post(
        "/chat/messages",
        json={
            "service_request_id": service_request.id,
            "message": "Test message",
            "message_type": "text",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied"


@pytest.mark.asyncio
async def test_get_conversation_for_assigned_provider_marks_messages_read(
    client,
    db_session,
    override_current_user,
    assigned_provider,
    existing_message,
    service_request,
):
    override_current_user(assigned_provider)

    response = await client.get(f"/chat/conversations/{service_request.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["service_request_id"] == service_request.id
    assert len(data["messages"]) == 1
    assert data["unread_count"] == 1

    db_session.refresh(existing_message)
    assert existing_message.is_read is True


@pytest.mark.asyncio
async def test_provider_with_message_history_can_access_conversation(
    client,
    db_session,
    override_current_user,
    provider_with_history,
    service_request,
):
    historic_message = ChatMessageORM(
        service_request_id=service_request.id,
        sender_id=provider_with_history.id,
        message="I already replied once",
        message_type="text",
    )
    db_session.add(historic_message)
    db_session.commit()

    override_current_user(provider_with_history)

    response = await client.get(f"/chat/conversations/{service_request.id}")

    assert response.status_code == 200
    assert response.json()["service_request_id"] == service_request.id


@pytest.mark.asyncio
async def test_get_my_conversations_for_owner_includes_owned_request(
    client, override_current_user, owner_user, service_request
):
    override_current_user(owner_user)

    response = await client.get("/chat/my-conversations")

    assert response.status_code == 200
    conversations = response.json()
    assert any(
        conversation["service_request_id"] == service_request.id
        for conversation in conversations
    )


@pytest.mark.asyncio
async def test_mark_message_read_updates_delivery_state(
    client,
    db_session,
    override_current_user,
    assigned_provider,
    existing_message,
):
    override_current_user(assigned_provider)

    response = await client.put(f"/chat/messages/{existing_message.id}/read")

    assert response.status_code == 200
    assert response.json()["message"] == "Message marked as read"

    db_session.refresh(existing_message)
    assert existing_message.is_read is True
    assert existing_message.delivery_status == "read"
    assert existing_message.read_at is not None
