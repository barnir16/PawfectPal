# tests/test_service_requests.py
import pytest
from datetime import datetime, timezone, timedelta

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.pet import PetORM
from app.models.service_request import ServiceRequestORM

# Auth deps (override both absolute, relative, and provider-guard)
from app.dependencies.auth import get_current_user, require_provider
from app.dependencies.auth import get_current_user as rel_get_current_user
from app.dependencies.auth import require_provider as rel_require_provider

BASE = "/service-requests"


@pytest.fixture
def user(db_session):
    u = UserORM(
        username="sr_user",
        email="sr_user@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def provider_user(db_session):
    u = UserORM(
        username="sr_provider",
        email="sr_provider@test.com",
        is_provider=True,
        hashed_password="StrongPass1",
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def other_user(db_session):
    u = UserORM(
        username="sr_other",
        email="sr_other@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def pet(db_session, user):
    p = PetORM(user_id=user.id, name="Fido", breed_type="Dog", breed="Beagle")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture(autouse=True)
def override_auth(user):
    # Default to normal user
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[rel_get_current_user] = lambda: user
    yield
    for key in (get_current_user, rel_get_current_user, require_provider):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


def make_request_payload(pet_id: int):
    return {
        "service_type": "walking",
        "title": "Need a dog walker now",
        "description": "Looking for a reliable dog walker for 30 minutes in the evening.",
        "pet_ids": [pet_id],
        "location": "Downtown",
        "preferred_dates": [
            (datetime.now(timezone.utc) + timedelta(days=1)).date().isoformat()
        ],
        "budget_min": 10,
        "budget_max": 25,
        "experience_years_min": 1,
        "languages": ["en"],
        "special_requirements": "Be gentle",
        "is_urgent": False,
    }


@pytest.mark.asyncio
async def test_create_service_request_success(client, pet):
    payload = make_request_payload(pet.id)
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["user_id"] > 0
    assert data["title"] == payload["title"]


@pytest.mark.asyncio
async def test_create_service_request_rejects_foreign_pet(
    client, db_session, pet, other_user
):
    # Switch auth to other_user who does not own the pet
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    payload = make_request_payload(pet.id)
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_get_my_service_requests_lists_created(client, db_session, user, pet):
    # Seed a request for the current user
    req = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Evening Walk Needed",
        description="Need a trustworthy person to walk my beagle for 30 minutes.",
        pet_ids=[pet.id],
        location="City",
    )
    db_session.add(req)
    db_session.commit()

    resp = await client.get(f"{BASE}/my-requests/")
    assert resp.status_code == status.HTTP_200_OK
    assert any(item["id"] == req.id for item in resp.json())


@pytest.mark.asyncio
async def test_browse_service_requests_provider_only(
    client, db_session, provider_user, pet, user
):
    # Seed some open requests from a user
    sr1 = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Need walker downtown",
        description="30 minute dog walk required in downtown area.",
        pet_ids=[pet.id],
        location="Downtown",
        budget_min=5,
        budget_max=20,
        is_urgent=True,
    )
    db_session.add(sr1)
    db_session.commit()

    # Require provider for listing
    app.dependency_overrides[require_provider] = lambda: provider_user
    app.dependency_overrides[rel_require_provider] = lambda: provider_user

    resp = await client.get(
        f"{BASE}/?service_type=walking&location=down&budget_min=1&budget_max=25&is_urgent=true"
    )
    assert resp.status_code == status.HTTP_200_OK
    items = resp.json()
    assert len(items) >= 1
    assert all(item["service_type"] == "walking" for item in items)


@pytest.mark.asyncio
async def test_get_service_request_increments_views(client, db_session, user, pet):
    req = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Evening Walk Needed",
        description="Need a trustworthy person to walk my beagle for 30 minutes.",
        pet_ids=[pet.id],
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)

    before = req.views_count
    resp = await client.get(f"{BASE}/{req.id}/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["views_count"] == before + 1


@pytest.mark.asyncio
async def test_update_service_request_owner_only(
    client, db_session, user, other_user, pet
):
    req = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Old Title Long Enough",
        description="This is a long enough description to satisfy schema.",
        pet_ids=[pet.id],
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)

    # Owner can update
    upd = {"title": "New Title", "is_urgent": True}
    r1 = await client.put(f"{BASE}/{req.id}/", json=upd)
    assert r1.status_code == status.HTTP_200_OK
    assert r1.json()["title"] == "New Title"

    # Non-owner cannot update
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user
    r2 = await client.put(f"{BASE}/{req.id}/", json=upd)
    assert r2.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_service_request_owner_only(
    client, db_session, user, other_user, pet
):
    req = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="To Delete Proper Title",
        description="This description is long enough for validation.",
        pet_ids=[pet.id],
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)

    # Owner can delete
    r1 = await client.delete(f"{BASE}/{req.id}/")
    assert r1.status_code == status.HTTP_200_OK
    assert r1.json()["message"] == "Service request deleted successfully"

    # Non-owner cannot delete
    req2 = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Another Proper Title",
        description="Another long enough description to satisfy schema.",
        pet_ids=[pet.id],
    )
    db_session.add(req2)
    db_session.commit()
    db_session.refresh(req2)

    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    r2 = await client.delete(f"{BASE}/{req2.id}/")
    assert r2.status_code == status.HTTP_404_NOT_FOUND
