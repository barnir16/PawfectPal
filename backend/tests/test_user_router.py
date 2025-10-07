# tests/test_user_router.py
import base64
import json
import pytest
from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.provider import ProviderORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def user(db_session):
    u = UserORM(
        username="user_router_u1",
        email="u1@example.com",
        hashed_password="StrongPass1",
        is_provider=False,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def override_auth(user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[rel_get_current_user] = lambda: user
    try:
        yield
    finally:
        for key in (get_current_user, rel_get_current_user):
            try:
                del app.dependency_overrides[key]
            except KeyError:
                pass


@pytest.mark.asyncio
async def test_get_current_user_me(client, user, override_auth):
    resp = await client.get("/users/me")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["id"] == user.id
    assert data["username"] == user.username


@pytest.mark.asyncio
async def test_update_current_user_me(client, db_session, user, override_auth):
    payload = {
        "full_name": "Updated Name",
        "phone": "+123456789",
        "address": "123 Main St",
        "city": "Town",
    }
    resp = await client.patch("/auth/me", json=payload)
    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["full_name"] == "Updated Name"
    assert body["phone"] == "+123456789"
    assert body["address"] == "123 Main St"
    assert body["city"] == "Town"


@pytest.mark.asyncio
async def test_toggle_provider_status(client, db_session, user, override_auth):
    # Initially false
    assert user.is_provider is False

    # Enable provider
    r1 = await client.patch("/auth/me/provider")
    assert r1.status_code == status.HTTP_200_OK
    data1 = r1.json()
    assert data1["is_provider"] is True
    # Provider profile should exist
    prov = db_session.query(ProviderORM).filter(ProviderORM.user_id == user.id).first()
    assert prov is not None

    # Disable provider
    r2 = await client.patch("/auth/me/provider")
    assert r2.status_code == status.HTTP_200_OK
    data2 = r2.json()
    assert data2["is_provider"] is False
    prov2 = db_session.query(ProviderORM).filter(ProviderORM.user_id == user.id).first()
    assert prov2 is None


@pytest.mark.asyncio
async def test_google_auth_base64_creates_user(client, db_session):
    # Create base64 JSON credential
    payload = {
        "sub": "google-sub-123",
        "email": "guser@example.com",
        "name": "Google User",
        "picture": "https://example.com/pic.jpg",
    }
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_200_OK, resp.text
    tok = resp.json()
    assert "access_token" in tok
    # User should be created
    u = db_session.query(UserORM).filter(UserORM.email == payload["email"]).first()
    assert u is not None
    assert u.google_id == payload["sub"]


@pytest.mark.asyncio
async def test_google_auth_existing_user_uses_same_account(client, db_session):
    # Pre-create user with same email
    existing = UserORM(
        username="guser",
        email="existing@example.com",
        hashed_password="StrongPass1",
        is_provider=False,
    )
    db_session.add(existing)
    db_session.commit()
    db_session.refresh(existing)

    payload = {
        "sub": "google-sub-999",
        "email": "existing@example.com",
        "name": "Existing User",
        "picture": "https://example.com/pic2.jpg",
    }
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_200_OK
    # Ensure the same user remains and now has google_id set
    u = db_session.query(UserORM).filter(UserORM.email == payload["email"]).first()
    assert u is not None
    assert u.id == existing.id
    assert u.google_id == payload["sub"]
