"""
Edge-case tests for tasks and vaccinations: ownership isolation and
not-found handling. Vaccinations are scoped through their parent pet, so
these tests double as a check that the join-based ownership filter in
vaccination.py actually excludes other users' pets.
"""
import pytest
from datetime import date, timedelta

from fastapi import status

from app.main import app
from app.models import UserORM
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def owner(db_session):
    u = UserORM(
        username="task_owner",
        email="task_owner@example.com",
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
        username="task_intruder",
        email="task_intruder@example.com",
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


async def _create_pet(client, owner_user):
    _override_auth_as(owner_user)
    resp = await client.post(
        "/pets/", json={"name": "Max", "breed_type": "dog", "breed": "Boxer"}
    )
    _clear_auth_override()
    assert resp.status_code == status.HTTP_200_OK, resp.text
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_task_without_auth_returns_401(client):
    resp = await client.post(
        "/task/", json={"title": "Walk the dog", "date_time": "2030-01-01T10:00:00"}
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_nonexistent_task_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.get("/task/999999/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Task not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_cannot_access_another_users_task(client, owner, intruder):
    _override_auth_as(owner)
    create_resp = await client.post(
        "/task/",
        json={
            "title": "Vet appointment",
            "description": "Annual checkup",
            "date_time": "2030-01-01T10:00:00",
        },
    )
    _clear_auth_override()
    assert create_resp.status_code == status.HTTP_200_OK
    task_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        get_resp = await client.get(f"/task/{task_id}/")
        assert get_resp.status_code == status.HTTP_404_NOT_FOUND

        update_resp = await client.put(
            f"/task/{task_id}/",
            json={"title": "Hijacked", "date_time": "2030-01-01T10:00:00"},
        )
        assert update_resp.status_code == status.HTTP_404_NOT_FOUND

        delete_resp = await client.delete(f"/task/{task_id}/")
        assert delete_resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()


# ---------------------------------------------------------------------------
# Vaccinations (scoped through pet ownership via a join)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_vaccination_for_nonexistent_pet_returns_404(client, owner):
    _override_auth_as(owner)
    try:
        resp = await client.post(
            "/vaccinations/pet/999999/",
            json={
                "vaccine_name": "Rabies",
                "date_administered": str(date.today()),
                "veterinarian": "Dr. Smith",
                "clinic": "Main St Clinic",
                "pet_id": 999999,
            },
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_create_vaccination_for_other_users_pet_returns_404(
    client, owner, intruder
):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(intruder)
    try:
        resp = await client.post(
            f"/vaccinations/pet/{pet_id}/",
            json={
                "vaccine_name": "Rabies",
                "date_administered": str(date.today()),
                "veterinarian": "Dr. Smith",
                "clinic": "Main St Clinic",
                "pet_id": pet_id,
            },
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert resp.json()["detail"] == "Pet not found"
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_cannot_update_or_delete_vaccination_on_other_users_pet(
    client, owner, intruder
):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    create_resp = await client.post(
        f"/vaccinations/pet/{pet_id}/",
        json={
            "vaccine_name": "Rabies",
            "date_administered": str(date.today()),
            "veterinarian": "Dr. Smith",
            "clinic": "Main St Clinic",
            "pet_id": pet_id,
        },
    )
    _clear_auth_override()
    assert create_resp.status_code == status.HTTP_200_OK
    vaccination_id = create_resp.json()["id"]

    _override_auth_as(intruder)
    try:
        update_resp = await client.put(
            f"/vaccinations/{vaccination_id}/",
            json={
                "vaccine_name": "Hijacked",
                "date_administered": str(date.today()),
                "veterinarian": "Dr. Smith",
                "clinic": "Main St Clinic",
            },
        )
        assert update_resp.status_code == status.HTTP_404_NOT_FOUND

        delete_resp = await client.delete(f"/vaccinations/{vaccination_id}/")
        assert delete_resp.status_code == status.HTTP_404_NOT_FOUND
    finally:
        _clear_auth_override()


@pytest.mark.asyncio
async def test_overdue_vaccinations_only_includes_past_due_dates(client, owner):
    pet_id = await _create_pet(client, owner)

    _override_auth_as(owner)
    try:
        # One overdue, one not-yet-due
        await client.post(
            f"/vaccinations/pet/{pet_id}/",
            json={
                "vaccine_name": "Overdue Shot",
                "date_administered": str(date.today() - timedelta(days=400)),
                "next_due_date": str(date.today() - timedelta(days=35)),
                "veterinarian": "Dr. Smith",
                "clinic": "Main St Clinic",
                "pet_id": pet_id,
            },
        )
        await client.post(
            f"/vaccinations/pet/{pet_id}/",
            json={
                "vaccine_name": "Future Shot",
                "date_administered": str(date.today()),
                "next_due_date": str(date.today() + timedelta(days=200)),
                "veterinarian": "Dr. Smith",
                "clinic": "Main St Clinic",
                "pet_id": pet_id,
            },
        )

        resp = await client.get("/vaccinations/overdue/")
        assert resp.status_code == status.HTTP_200_OK
        names = [r["vaccine_name"] for r in resp.json()]
        assert "Overdue Shot" in names
        assert "Future Shot" not in names
    finally:
        _clear_auth_override()
