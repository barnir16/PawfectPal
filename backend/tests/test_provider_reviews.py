"""Tests for /provider-reviews after fixing the id mismatch: the router used
to resolve `provider_id` as ProviderProfileORM.id, but every caller (GET
/providers/{id}, marketplace posts, etc.) treats "provider" identity as a
UserORM id post-consolidation. These tests confirm the review endpoints now
accept the same UserORM id everything else uses.
"""
import pytest

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.provider_profile import ProviderProfileORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user
from tests.conftest import TEST_PASSWORD

BASE = "/provider-reviews"


@pytest.fixture
def owner(db_session):
    u = UserORM(
        username="pr_owner",
        email="pr_owner@test.com",
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
        username="pr_provider",
        email="pr_provider@test.com",
        is_provider=True,
        hashed_password=TEST_PASSWORD,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def provider_profile(db_session, provider_user):
    """A ProviderProfileORM whose own id is deliberately different from the
    user's id, so a test that accidentally used profile.id instead of
    user_id would fail loudly instead of passing by coincidence."""
    other = UserORM(
        username="pr_filler",
        email="pr_filler@test.com",
        is_provider=False,
        hashed_password=TEST_PASSWORD,
    )
    db_session.add(other)
    db_session.commit()

    profile = ProviderProfileORM(user_id=provider_user.id, is_available=True)
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture(autouse=True)
def override_auth(owner):
    app.dependency_overrides[get_current_user] = lambda: owner
    app.dependency_overrides[rel_get_current_user] = lambda: owner
    yield
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


@pytest.mark.asyncio
async def test_get_reviews_by_user_id_no_longer_404s(client, provider_user, provider_profile):
    del provider_profile
    resp = await client.get(f"{BASE}/provider/{provider_user.id}")
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_review_by_user_id_lands_under_correct_profile(
    client, db_session, provider_user, provider_profile
):
    payload = {
        "provider_id": provider_user.id,
        "rating": 5,
        "title": "Great walk",
        "comment": "Very punctual and friendly.",
        "service_type": "walking",
    }
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_200_OK, resp.text

    db_session.refresh(provider_profile)
    assert provider_profile.total_reviews == 1
    assert provider_profile.average_rating == 5.0

    fetch_resp = await client.get(f"{BASE}/provider/{provider_user.id}")
    assert fetch_resp.status_code == status.HTTP_200_OK
    assert len(fetch_resp.json()) == 1
    assert fetch_resp.json()[0]["rating"] == 5


@pytest.mark.asyncio
async def test_reviews_for_missing_provider_404(client):
    resp = await client.get(f"{BASE}/provider/999999")
    assert resp.status_code == status.HTTP_404_NOT_FOUND
