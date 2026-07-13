"""
Edge-case tests for authentication: registration validation, login failures,
JWT/token failures, and Google credential verification failure paths.

These complement the happy-path tests in test_users.py and test_user_router.py
by asserting on the *exact* status codes and detail messages the routers
return, so regressions in error-handling are caught (not just "it works").
"""
import base64
import json

import pytest
from fastapi import status

from app.main import app
from app.models import UserORM
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user
from tests.conftest import TEST_PASSWORD, TEST_WRONG_PASSWORD


# ---------------------------------------------------------------------------
# Registration edge cases
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_duplicate_username_returns_400(client, db_session):
    user_data = {
        "username": "dupe_user",
        "password": TEST_PASSWORD,
        "email": "dupe1@example.com",
        "full_name": "Dupe One",
        "is_active": True,
    }
    first = await client.post("/auth/register", json=user_data)
    assert first.status_code == status.HTTP_201_CREATED, first.text

    # Same username, different email - should still be rejected on username
    user_data2 = {**user_data, "email": "dupe2@example.com"}
    second = await client.post("/auth/register", json=user_data2)
    assert second.status_code == status.HTTP_400_BAD_REQUEST
    assert second.json()["detail"] == "Username already registered"


@pytest.mark.parametrize(
    "password,expected_fragment",
    [
        ("short1A", "at least 8 characters"),
        ("nodigitsHERE", "contain a digit"),
        ("nouppercase1", "contain an uppercase letter"),
    ],
)
@pytest.mark.asyncio
async def test_register_weak_password_returns_422(client, password, expected_fragment):
    user_data = {
        "username": f"weakpass_{expected_fragment[:4]}",
        "password": password,
        "email": f"weak_{expected_fragment[:4]}@example.com",
        "full_name": "Weak Pass",
        "is_active": True,
    }
    resp = await client.post("/auth/register", json=user_data)
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    body = resp.json()
    messages = " ".join(err["msg"] for err in body["detail"])
    assert expected_fragment in messages


@pytest.mark.asyncio
async def test_register_invalid_email_returns_422(client):
    user_data = {
        "username": "bademailuser",
        "password": TEST_PASSWORD,
        "email": "not-an-email",
        "full_name": "Bad Email",
        "is_active": True,
    }
    resp = await client.post("/auth/register", json=user_data)
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_register_missing_required_fields_returns_422(client):
    # Missing username and password entirely
    resp = await client.post("/auth/register", json={"email": "nofields@example.com"})
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ---------------------------------------------------------------------------
# Login edge cases
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_nonexistent_username_returns_401(client):
    resp = await client.post(
        "/auth/token",
        data={"username": "ghost_user_does_not_exist", "password": TEST_WRONG_PASSWORD},
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp.json()["detail"] == "Incorrect username or password"


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    user_data = {
        "username": "wrongpass_user",
        "password": TEST_PASSWORD,
        "email": "wrongpass@example.com",
        "full_name": "Wrong Pass",
        "is_active": True,
    }
    reg = await client.post("/auth/register", json=user_data)
    assert reg.status_code == status.HTTP_201_CREATED

    resp = await client.post(
        "/auth/token",
        data={"username": user_data["username"], "password": TEST_WRONG_PASSWORD},
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp.json()["detail"] == "Incorrect username or password"


@pytest.mark.asyncio
async def test_login_empty_credentials_returns_401_not_500(client):
    """Empty strings are still 'present' form fields, so this reaches the
    auth check rather than failing validation - confirm it degrades to a
    normal 401 instead of crashing."""
    resp = await client.post("/auth/token", data={"username": "", "password": ""})
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# /users/me (or /auth/me) without/with bad token
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_me_without_token_returns_401(client):
    resp = await client.get("/users/me")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_me_with_garbage_token_returns_401_with_clear_message(client):
    resp = await client.get(
        "/users/me", headers={"Authorization": "Bearer not-a-real-jwt"}
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp.json()["detail"] == "Could not validate credentials"


@pytest.mark.asyncio
async def test_me_with_token_for_deleted_user_returns_401(client, db_session):
    """A token can outlive the user it was issued for (e.g. account removed)."""
    user_data = {
        "username": "soon_deleted",
        "password": TEST_PASSWORD,
        "email": "deleted@example.com",
        "full_name": "Soon Deleted",
        "is_active": True,
    }
    reg = await client.post("/auth/register", json=user_data)
    assert reg.status_code == status.HTTP_201_CREATED

    login = await client.post(
        "/auth/token",
        data={"username": user_data["username"], "password": user_data["password"]},
    )
    token = login.json()["access_token"]

    db_session.query(UserORM).filter(UserORM.username == user_data["username"]).delete()
    db_session.commit()

    resp = await client.get(
        "/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp.json()["detail"] == "Could not validate credentials"


# ---------------------------------------------------------------------------
# Google auth edge cases
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_google_auth_garbage_credential_returns_400(client):
    resp = await client.post(
        "/auth/google", json={"credential": "definitely-not-valid-base64-or-jwt!!"}
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.json()["detail"] == "Invalid credential format"


@pytest.mark.asyncio
async def test_google_auth_missing_email_returns_400(client):
    payload = {"sub": "google-sub-no-email", "name": "No Email User"}
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.json()["detail"] == "Invalid Google token: missing required fields"


@pytest.mark.asyncio
async def test_google_auth_missing_sub_returns_400(client):
    payload = {"email": "nosub@example.com", "name": "No Sub User"}
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.json()["detail"] == "Invalid Google token: missing required fields"


@pytest.mark.asyncio
async def test_google_auth_missing_credential_field_returns_422(client):
    resp = await client.post("/auth/google", json={})
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_google_auth_username_collision_appends_counter(client, db_session):
    """If 'newuser' already exists, a Google sign-in with email newuser@x.com
    should not crash or collide - it should suffix the username."""
    existing = UserORM(
        username="collideuser",
        email="someone-else@example.com",
        hashed_password=TEST_PASSWORD,
        is_provider=False,
    )
    db_session.add(existing)
    db_session.commit()

    payload = {
        "sub": "google-sub-collide",
        "email": "collideuser@example.com",
        "name": "Collide User",
    }
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_200_OK, resp.text

    new_user = (
        db_session.query(UserORM)
        .filter(UserORM.email == "collideuser@example.com")
        .first()
    )
    assert new_user is not None
    assert new_user.username != "collideuser"
    assert new_user.username.startswith("collideuser")


@pytest.mark.asyncio
async def test_google_auth_does_not_overwrite_existing_full_name(client, db_session):
    """If the local account already has a real full_name set, Google sign-in
    should not silently clobber it."""
    existing = UserORM(
        username="namedalready",
        email="named@example.com",
        full_name="My Custom Name",
        hashed_password=TEST_PASSWORD,
        is_provider=False,
    )
    db_session.add(existing)
    db_session.commit()

    payload = {
        "sub": "google-sub-named",
        "email": "named@example.com",
        "name": "Google Provided Name",
    }
    credential = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    resp = await client.post("/auth/google", json={"credential": credential})
    assert resp.status_code == status.HTTP_200_OK

    refreshed = (
        db_session.query(UserORM).filter(UserORM.email == "named@example.com").first()
    )
    assert refreshed.full_name == "My Custom Name"
