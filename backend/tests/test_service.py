# tests/test_service.py
import pytest
from datetime import datetime, timedelta, timezone

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.pet import PetORM
from app.models.service_type import ServiceTypeORM
from app.models.service import ServiceORM
from app.models.base import ServiceStatus

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def test_user(db_session):
    user = UserORM(
        username="service_user",
        email="service_user@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_user(db_session):
    user = UserORM(
        username="service_other",
        email="service_other@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(autouse=True)
def override_auth(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[rel_get_current_user] = lambda: test_user
    yield
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


@pytest.fixture
def service_type(db_session):
    st = ServiceTypeORM(name="walking", description="Dog walking")
    db_session.add(st)
    db_session.commit()
    db_session.refresh(st)
    return st


@pytest.fixture
def pet(db_session, test_user):
    p = PetORM(user_id=test_user.id, name="Fido", breed_type="Dog", breed="Beagle")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


def make_service_payload(pet_id: int, service_type: str, start: datetime):
    return {
        "pet_id": pet_id,
        "service_type": service_type,
        "status": ServiceStatus.PENDING,
        "start_datetime": start.isoformat(),
        "end_datetime": (start + timedelta(hours=1)).isoformat(),
        "duration_hours": 1.0,
        "price": 20.0,
        "currency": "USD",
        "pickup_address": "123 Main St",
        "dropoff_address": "123 Main St",
        "before_images": [],
        "after_images": [],
        "service_report": None,
    }


@pytest.mark.asyncio
async def test_create_service_success(client, pet, service_type):
    payload = make_service_payload(pet.id, service_type.name, datetime.now(timezone.utc))
    resp = await client.post("/service_booking/", json=payload)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["pet_id"] == pet.id
    assert data["service_type"] == service_type.name


@pytest.mark.asyncio
async def test_get_service_by_id_and_ownership(
    client, db_session, pet, service_type, other_user
):
    # Create a service for the default user
    start = datetime.now(timezone.utc)
    svc = ServiceORM(
        user_id=pet.user_id,
        pet_id=pet.id,
        service_type=service_type.name,
        status=ServiceStatus.PENDING,
        start_datetime=start,
        end_datetime=start + timedelta(hours=1),
    )
    db_session.add(svc)
    db_session.commit()
    db_session.refresh(svc)

    # Owner can retrieve
    resp = await client.get(f"/service_booking/{svc.id}")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["id"] == svc.id

    # Switch to other user -> should 404 (not owner)
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    resp2 = await client.get(f"/service_booking/{svc.id}")
    assert resp2.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_list_services_filters(client, db_session, pet, service_type):
    # Create active and completed services
    now = datetime.now(timezone.utc)

    active1 = ServiceORM(
        user_id=pet.user_id,
        pet_id=pet.id,
        service_type=service_type.name,
        status=ServiceStatus.CONFIRMED,
        start_datetime=now + timedelta(hours=1),
    )
    completed1 = ServiceORM(
        user_id=pet.user_id,
        pet_id=pet.id,
        service_type=service_type.name,
        status=ServiceStatus.COMPLETED,
        start_datetime=now - timedelta(days=2),
    )

    db_session.add_all([active1, completed1])
    db_session.commit()

    # All
    r_all = await client.get("/service_booking/")
    assert r_all.status_code == status.HTTP_200_OK
    assert len(r_all.json()) >= 2

    # Active
    r_active = await client.get("/service_booking/?status=active")
    assert r_active.status_code == status.HTTP_200_OK
    assert all(item["status"] != ServiceStatus.COMPLETED for item in r_active.json())

    # History
    r_hist = await client.get("/service_booking/?status=history")
    assert r_hist.status_code == status.HTTP_200_OK
    assert all(item["status"] == ServiceStatus.COMPLETED for item in r_hist.json())

    # By pet
    r_pet = await client.get(f"/service_booking/?pet_id={pet.id}")
    assert r_pet.status_code == status.HTTP_200_OK
    assert all(item["pet_id"] == pet.id for item in r_pet.json())


@pytest.mark.asyncio
async def test_update_service_success(client, db_session, pet, service_type):
    start = datetime.now(timezone.utc)
    svc = ServiceORM(
        user_id=pet.user_id,
        pet_id=pet.id,
        service_type=service_type.name,
        status=ServiceStatus.PENDING,
        start_datetime=start,
    )
    db_session.add(svc)
    db_session.commit()
    db_session.refresh(svc)

    upd = {"status": ServiceStatus.CONFIRMED}
    resp = await client.put(f"/service_booking/{svc.id}", json=upd)
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["status"] == ServiceStatus.CONFIRMED


@pytest.mark.asyncio
async def test_delete_service_success(client, db_session, pet, service_type):
    start = datetime.now(timezone.utc)
    svc = ServiceORM(
        user_id=pet.user_id,
        pet_id=pet.id,
        service_type=service_type.name,
        status=ServiceStatus.PENDING,
        start_datetime=start,
    )
    db_session.add(svc)
    db_session.commit()
    db_session.refresh(svc)
    svc_id = svc.id
    # Expunge to avoid accessing a deleted instance in the same session
    try:
        db_session.expunge(svc)
    except Exception:
        pass

    resp = await client.delete(f"/service_booking/{svc_id}")
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    # Verify deletion
    r2 = await client.get(f"/service_booking/{svc_id}")
    assert r2.status_code == status.HTTP_404_NOT_FOUND
