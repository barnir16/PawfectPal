import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    user_data = {
        "username": "testuser_unique1",  # make unique per run
        "password": "Secret123",
        "email": "test@example.com",
        "full_name": "Test User",
        "is_active": True,
    }

    response = await client.post("/auth/register", json=user_data)
    print("REGISTER RESPONSE:", response.text)
    assert response.status_code == status.HTTP_201_CREATED  # ✅ updated
    data = response.json()
    assert data["username"] == user_data["username"]
    assert "id" in data


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    user_data = {
        "username": "loginuser_unique1",  # unique
        "password": "StrongPass1",
        "email": "login@example.com",
        "full_name": "Login User",
        "is_active": True,
    }

    # Register
    reg_response = await client.post("/auth/register", json=user_data)
    assert reg_response.status_code == status.HTTP_201_CREATED, reg_response.text

    # Login
    response = await client.post(
        "/auth/token",
        data={"username": user_data["username"], "password": user_data["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    print("LOGIN RESPONSE:", response.text)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
