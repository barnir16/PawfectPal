"""Tests for the /marketplace-posts router after repointing it from the
defunct MarketplacePostORM/marketplace_posts table onto ServiceRequestORM/
service_requests, and wiring /respond to create real
ServiceRequestResponseORM rows instead of just bumping a counter.
"""
import pytest

from fastapi import status

from app.main import app
from app.models import UserORM, ServiceTypeORM
from app.models.pet import PetORM
from app.models.service_request import ServiceRequestORM
from app.models.service_request_response import ServiceRequestResponseORM
from app.models.provider_profile import ProviderProfileORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user
from tests.conftest import TEST_PASSWORD

BASE = "/marketplace-posts"


@pytest.fixture
def user(db_session):
    u = UserORM(
        username="mp_user",
        email="mp_user@test.com",
        is_provider=False,
        hashed_password=TEST_PASSWORD,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def provider_user(db_session):
    u = UserORM(
        username="mp_provider",
        email="mp_provider@test.com",
        is_provider=True,
        hashed_password=TEST_PASSWORD,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def other_provider(db_session):
    u = UserORM(
        username="mp_other_provider",
        email="mp_other_provider@test.com",
        is_provider=True,
        hashed_password=TEST_PASSWORD,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def pet(db_session, user):
    p = PetORM(user_id=user.id, name="Bob", breed_type="Dog", breed="French Bulldog")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def service_type(db_session, provider_user):
    """A walking service type with an available provider offering it —
    create_marketplace_post rejects posts for service types nobody offers."""
    st = ServiceTypeORM(name="walking", description="Dog walking")
    db_session.add(st)
    db_session.commit()
    db_session.refresh(st)

    profile = ProviderProfileORM(user_id=provider_user.id, is_available=True)
    profile.services.append(st)
    db_session.add(profile)
    db_session.commit()
    return st


@pytest.fixture
def open_post(db_session, user, pet, service_type):
    del service_type  # ensures the service type row exists in the test DB
    req = ServiceRequestORM(
        user_id=user.id,
        service_type="walking",
        title="Need a walker for Bob",
        description="Bob needs daily walks in the afternoon, 30 minutes each.",
        pet_ids=[pet.id],
        status="open",
        request_type="marketplace",
        is_public=True,
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)
    return req


@pytest.fixture(autouse=True)
def override_auth(user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[rel_get_current_user] = lambda: user
    yield
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


@pytest.mark.asyncio
async def test_create_marketplace_post_lands_in_service_requests(
    client, db_session, pet, service_type
):
    del service_type
    payload = {
        "title": "Walk my dog Bob",
        "description": "Bob needs walks 5 days a week, morning and noon.",
        "service_type": "walking",
        "pet_ids": [pet.id],
        "is_urgent": False,
    }
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    data = resp.json()
    assert data["title"] == payload["title"]

    # Confirm it's a real ServiceRequestORM row, not written to a dead table
    stored = db_session.query(ServiceRequestORM).filter(ServiceRequestORM.id == data["id"]).first()
    assert stored is not None
    assert stored.is_public is True
    assert stored.request_type == "marketplace"


@pytest.mark.asyncio
async def test_created_post_shows_up_in_my_posts(client, pet, service_type):
    del service_type
    payload = {
        "title": "Walk my dog Bob",
        "description": "Bob needs walks 5 days a week, morning and noon.",
        "service_type": "walking",
        "pet_ids": [pet.id],
        "is_urgent": False,
    }
    create_resp = await client.post(f"{BASE}/", json=payload)
    assert create_resp.status_code == status.HTTP_200_OK

    my_posts_resp = await client.get(f"{BASE}/my-posts")
    assert my_posts_resp.status_code == status.HTTP_200_OK
    ids = [p["id"] for p in my_posts_resp.json()]
    assert create_resp.json()["id"] in ids


@pytest.mark.asyncio
async def test_get_single_post_no_longer_503s(client, open_post):
    resp = await client.get(f"{BASE}/{open_post.id}")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["id"] == open_post.id


@pytest.mark.asyncio
async def test_respond_creates_response_row(
    client, db_session, open_post, provider_user
):
    app.dependency_overrides[get_current_user] = lambda: provider_user
    app.dependency_overrides[rel_get_current_user] = lambda: provider_user

    resp = await client.post(f"{BASE}/{open_post.id}/respond")
    assert resp.status_code == status.HTTP_200_OK, resp.text

    response_row = (
        db_session.query(ServiceRequestResponseORM)
        .filter(
            ServiceRequestResponseORM.service_request_id == open_post.id,
            ServiceRequestResponseORM.provider_id == provider_user.id,
        )
        .first()
    )
    assert response_row is not None
    assert response_row.status == "pending"

    db_session.refresh(open_post)
    assert open_post.responses_count == 1


@pytest.mark.asyncio
async def test_respond_twice_returns_409(client, open_post, provider_user):
    app.dependency_overrides[get_current_user] = lambda: provider_user
    app.dependency_overrides[rel_get_current_user] = lambda: provider_user

    first = await client.post(f"{BASE}/{open_post.id}/respond")
    assert first.status_code == status.HTTP_200_OK

    second = await client.post(f"{BASE}/{open_post.id}/respond")
    assert second.status_code == status.HTTP_409_CONFLICT


@pytest.mark.asyncio
async def test_two_different_providers_can_both_respond(
    client, db_session, open_post, provider_user, other_provider
):
    app.dependency_overrides[get_current_user] = lambda: provider_user
    app.dependency_overrides[rel_get_current_user] = lambda: provider_user
    first = await client.post(f"{BASE}/{open_post.id}/respond")
    assert first.status_code == status.HTTP_200_OK

    app.dependency_overrides[get_current_user] = lambda: other_provider
    app.dependency_overrides[rel_get_current_user] = lambda: other_provider
    second = await client.post(f"{BASE}/{open_post.id}/respond")
    assert second.status_code == status.HTTP_200_OK

    db_session.refresh(open_post)
    assert open_post.responses_count == 2


@pytest.mark.asyncio
async def test_cannot_respond_to_own_post(client, open_post, user):
    del user  # override_auth already authenticates as the post's owner
    resp = await client.post(f"{BASE}/{open_post.id}/respond")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_respond_to_missing_post_404s(client, provider_user):
    app.dependency_overrides[get_current_user] = lambda: provider_user
    app.dependency_overrides[rel_get_current_user] = lambda: provider_user
    resp = await client.post(f"{BASE}/999999/respond")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_and_delete_owner_only(client, db_session, open_post, provider_user):
    upd_resp = await client.put(f"{BASE}/{open_post.id}", json={"title": "Updated title here"})
    assert upd_resp.status_code == status.HTTP_200_OK
    assert upd_resp.json()["title"] == "Updated title here"

    # Non-owner cannot update or delete
    app.dependency_overrides[get_current_user] = lambda: provider_user
    app.dependency_overrides[rel_get_current_user] = lambda: provider_user
    forbidden_update = await client.put(f"{BASE}/{open_post.id}", json={"title": "Should not work"})
    assert forbidden_update.status_code == status.HTTP_404_NOT_FOUND

    forbidden_delete = await client.delete(f"{BASE}/{open_post.id}")
    assert forbidden_delete.status_code == status.HTTP_404_NOT_FOUND

    # Owner can delete
    app.dependency_overrides[get_current_user] = lambda: open_post.user
    app.dependency_overrides[rel_get_current_user] = lambda: open_post.user
    delete_resp = await client.delete(f"{BASE}/{open_post.id}")
    assert delete_resp.status_code == status.HTTP_200_OK
