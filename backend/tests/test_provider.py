# tests/test_provider.py
import pytest
from fastapi import status

from app.models import UserORM
from app.models.provider import ProviderORM

BASE = "/providers"


@pytest.mark.asyncio
async def test_get_providers_empty_list_when_none(client):
    resp = await client.get(f"{BASE}/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.fixture
def provider_user(db_session):
    u = UserORM(
        username="prov1",
        email="prov1@test.com",
        is_provider=True,
        hashed_password="StrongPass1",
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)

    prof = ProviderORM(user_id=u.id, bio="Loves pets", hourly_rate=25.0, rating=4.7)
    db_session.add(prof)
    db_session.commit()
    db_session.refresh(prof)

    return u


@pytest.mark.asyncio
async def test_get_providers_list_success(client, provider_user):
    resp = await client.get(f"{BASE}/")
    assert resp.status_code == status.HTTP_200_OK
    items = resp.json()
    assert any(item["id"] == provider_user.id for item in items)
    assert all(item.get("is_active") is not None for item in items)


@pytest.mark.asyncio
async def test_get_provider_by_id_success(client, provider_user):
    resp = await client.get(f"{BASE}/{provider_user.id}")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["id"] == provider_user.id
    assert data["username"] == provider_user.username


@pytest.mark.asyncio
async def test_get_provider_by_id_not_found(client):
    resp = await client.get(f"{BASE}/999999")
    assert resp.status_code == status.HTTP_404_NOT_FOUND
