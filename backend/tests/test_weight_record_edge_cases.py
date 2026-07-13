"""
Edge-case tests for the weight records router: ownership isolation across
the pet->weight-record relationship, not-found handling, and validation.
"""
import pytest
from datetime import datetime, timezone

from fastapi import status

from app.main import app
from app.models import UserORM
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user
from tests.conftest import TEST_PASSWORD, TEST_WRONG_PASSWORD


@pytest.fixture
def owner(db_session):
    u = UserORM(
        username="weight_owner",
        email="weight_owner@example.com",
        hashed_password=TEST_PASSWORD,
        is_provider=False,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def intruder(db_session):
    u = UserORM(
        username="weight_intruder",
        email="weight_intruder@example.com",
        hashed_password=TEST_PASSWORD,
        is_provider=False,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def _override_auth_as(user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[rel_get_current_user] = lambda: user


def _clear_auth_override():
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


async def _create_pet(client, owner_user):
    _override_auth_as(owner_user)
    resp = await client.post(
        "/pets/", json={"name": "Bella", "breed_type": "dog", "breed": "Beagle"}
    )
    _clear_auth_override()
    assert resp.status_code == status.HTTP_200_OK, resp.text
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_get_all_weight_records_with_no_pets_returns_empty_list(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.get("/api/weight-records/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_create_weight_record_for_nonexistent_pet_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        payload = {
            "petId": 999999,
            "weight": 10.0,
            "date": datetime.now(timezone.utc).isoformat(),
        }
        resp = await client.post("/api/weight-records/", json=payload)
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found or access denied"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_create_weight_record_for_other_users_pet_returns_404(
    client, owner, intruder
):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(intruder)
    try:
        payload = {
            "petId": pet_id,
            "weight": 10.0,
            "date": datetime.now(timezone.utc).isoformat(),
        }
        resp = await client.post("/api/weight-records/", json=payload)
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found or access denied"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_create_weight_record_with_non_positive_weight_returns_422(
    client, owner
):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    try:
        payload = {
            "petId": pet_id,
            "weight": 0,
            "date": datetime.now(timezone.utc).isoformat(),
        }
        resp = await client.post("/api/weight-records/", json=payload)
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_update_nonexistent_weight_record_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.put(
            "/api/weight-records/999999/", json={"weight": 5.0}
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Weight record not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_update_other_users_weight_record_returns_403(client, owner, intruder):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    create_resp = await client.post(
        "/api/weight-records/",
        json={
            "petId": pet_id,
            "weight": 8.0,
            "date": datetime.now(timezone.utc).isoformat(),
        },
    )
    _clear_auth_override()
    assert create_resp.status_code == status.HTTP_201_CREATED
    record_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        resp = await client.put(
            f"/api/weight-records/{record_id}/", json={"weight": 99.0}
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert resp.json()["detail"] == "Access denied to this weight record"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_delete_other_users_weight_record_returns_403(client, owner, intruder):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    create_resp = await client.post(
        "/api/weight-records/",
        json={
            "petId": pet_id,
            "weight": 8.0,
            "date": datetime.now(timezone.utc).isoformat(),
        },
    )
    _clear_auth_override()
    record_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        resp = await client.delete(f"/api/weight-records/{record_id}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
    finally:
        _clear_auth_override()

    # Confirm the record is untouched
    _override_auth_as(owner)
    try:
        records_resp = await client.get(f"/api/weight-records/pet/{pet_id}/")
        assert len(records_resp.json()) == 1
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_date_range_query_with_start_after_end_returns_empty_not_error(
    client, owner
):
    """A reversed date range is a logic error from the caller, not a server
    error - it should come back as an empty list, not a 500."""
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    try:
        await client.post(
            "/api/weight-records/",
            json={
                "petId": pet_id,
                "weight": 8.0,
                "date": datetime.now(timezone.utc).isoformat(),
            },
        )

        resp = await client.get(
            f"/api/weight-records/pet/{pet_id}/range/",
            params={
                "start_date": "2030-01-01T00:00:00",
                "end_date": "2020-01-01T00:00:00",
            },
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []
    finally:
        _clear_auth_override()
