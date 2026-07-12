"""
Edge-case tests for the pets router: auth requirements, ownership isolation
(a user must never be able to read/update/delete another user's pet), and
validation of minimal/invalid payloads.
"""
import pytest
from fastapi import status
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.models import UserORM
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def owner(db_session):
    u = UserORM(
        username="pet_owner",
        email="pet_owner@example.com",
        hashed_password="StrongPass1",
        is_provider=False,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def intruder(db_session):
    u = UserORM(
        username="pet_intruder",
        email="pet_intruder@example.com",
        hashed_password="StrongPass1",
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


MINIMAL_PET_PAYLOAD = {
    "name": "Rex",
    "breed_type": "dog",
    "breed": "Labrador",
}


@pytest.mark.asyncio
async def test_create_pet_without_auth_returns_401(client):
    resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_create_pet_missing_required_fields_returns_422(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.post("/pets/", json={"name": "Rex"})
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_create_pet_minimal_payload_applies_defaults(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
        assert resp.status_code == status.HTTP_200_OK, resp.text
        data = resp.json()
        assert data["name"] == "Rex"
        assert data["gender"] == "unknown"
        assert data["is_neutered"] is False
        assert data["weight_unit"] == "kg"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_get_nonexistent_pet_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.get("/pets/999999/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_cannot_read_another_users_pet(client, owner, intruder):
    # Owner creates a pet
    _override_auth_as(owner)
    create_resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
    _clear_auth_override()
    assert create_resp.status_code == status.HTTP_200_OK
    pet_id = create_resp.json()["id"]

    # Intruder tries to read it - should be invisible, not just "forbidden"
    _override_auth_as(intruder)
    try:
        resp = await client.get(f"/pets/{pet_id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_cannot_update_another_users_pet(client, owner, intruder):
    _override_auth_as(owner)
    create_resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
    _clear_auth_override()
    pet_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        update_payload = {**MINIMAL_PET_PAYLOAD, "name": "Hijacked"}
        resp = await client.put(f"/pets/{pet_id}/", json=update_payload)
        assert resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_cannot_delete_another_users_pet(client, owner, intruder):
    _override_auth_as(owner)
    create_resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
    _clear_auth_override()
    pet_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        resp = await client.delete(f"/pets/{pet_id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()

    # Confirm it still exists for the real owner
    _override_auth_as(owner)
    try:
        get_resp = await client.get(f"/pets/{pet_id}/")
        assert get_resp.status_code == status.HTTP_200_OK
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_update_nonexistent_pet_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.put("/pets/999999/", json=MINIMAL_PET_PAYLOAD)
        assert resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_delete_nonexistent_pet_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.delete("/pets/999999/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_updating_pet_weight_creates_auto_weight_record(client, owner):
    _override_auth_as(owner)
    try:
        create_resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
        pet_id = create_resp.json()["id"]

        # NOTE: update_pet currently does a full overwrite rather than a
        # partial patch (see test_update_pet_with_partial_payload_returns_500_bug
        # below), so every NOT NULL column with no DB-level default
        # (is_birthday_given, gender, weight_unit, plus the required name/
        # breed_type/breed) must be explicitly included here or the request
        # crashes on a NOT NULL constraint - unrelated to what this test is
        # actually checking (auto weight-record creation).
        update_payload = {
            **MINIMAL_PET_PAYLOAD,
            "weight_kg": 12.5,
            "is_birthday_given": False,
            "gender": "unknown",
            "weight_unit": "kg",
            "is_neutered": False,
            "is_vaccinated": False,
            "is_microchipped": False,
            "is_tracking_enabled": False,
            "is_lost": False,
            "is_active": True,
        }
        update_resp = await client.put(f"/pets/{pet_id}/", json=update_payload)
        assert update_resp.status_code == status.HTTP_200_OK
        assert update_resp.json()["weight_kg"] == 12.5

        records_resp = await client.get(f"/api/weight-records/pet/{pet_id}/")
        assert records_resp.status_code == status.HTTP_200_OK
        records = records_resp.json()
        assert len(records) == 1
        assert records[0]["source"] == "auto"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_update_pet_with_partial_payload_returns_500_bug(client, owner):
    """KNOWN BUG (found while writing edge-case tests, not yet fixed):
    PUT /pets/{id}/ in app/routers/pet.py does an unconditional full
    overwrite of every column from the PetUpdate body instead of a partial
    patch, even though PetUpdate declares every field Optional. Any field
    omitted by the caller (e.g. a real-world client that only sends the
    fields the user actually edited) gets reset to None.

    For most columns that just silently wipes data. For several NOT NULL
    columns with no DB-level default (is_birthday_given, gender,
    weight_unit, ...) it crashes with an IntegrityError instead of a clean
    4xx. The test client is configured to let app exceptions propagate
    (httpx ASGITransport's default raise_app_exceptions=True), so the
    crash surfaces here as a raised IntegrityError rather than a 500
    response - that's the current (broken) behavior. This test pins it
    down so a future fix is forced to update it: replace the pytest.raises
    block with a plain 200 assertion once update_pet is changed to a real
    partial update.
    """
    _override_auth_as(owner)
    try:
        create_resp = await client.post("/pets/", json=MINIMAL_PET_PAYLOAD)
        pet_id = create_resp.json()["id"]

        # A realistic partial update: caller only wants to rename the pet.
        with pytest.raises(IntegrityError):
            await client.put(f"/pets/{pet_id}/", json={"name": "Renamed"})
    finally:
        _clear_auth_override()
