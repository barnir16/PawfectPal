# tests/test_weight_record.py
import pytest
from datetime import datetime, timedelta, timezone

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.pet import PetORM
from app.models.weight_record import WeightRecordORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user

BASE = "/api/weight-records"


@pytest.fixture
def test_user(db_session):
    user = UserORM(
        username="wr_user",
        email="wr_user@test.com",
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
        username="wr_other",
        email="wr_other@test.com",
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
def pet(db_session, test_user):
    p = PetORM(user_id=test_user.id, name="Fido", breed_type="Dog", breed="Beagle")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


def make_record_payload(pet_id: int, when: datetime, kg: float = 10.5):
    return {
        "pet_id": pet_id,
        "weight": kg,
        "weight_unit": "kg",
        "date": when.isoformat(),
        "notes": "Healthy",
        "source": "manual",
    }


@pytest.mark.asyncio
async def test_create_weight_record_success(client, pet):
    payload = make_record_payload(pet.id, datetime.now(timezone.utc))
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["pet_id"] == pet.id
    assert data["weight"] == payload["weight"]


@pytest.mark.asyncio
async def test_list_all_weight_records_for_user(client, db_session, pet):
    # Seed a couple of records
    now = datetime.now(timezone.utc)
    wr1 = WeightRecordORM(pet_id=pet.id, weight=10.0, weight_unit="kg", date=now)
    wr2 = WeightRecordORM(pet_id=pet.id, weight=11.0, weight_unit="kg", date=now)
    db_session.add_all([wr1, wr2])
    db_session.commit()

    resp = await client.get(f"{BASE}/")
    assert resp.status_code == status.HTTP_200_OK
    items = resp.json()
    assert len(items) >= 2
    assert all("pet_name" in it and "pet_type" in it for it in items)


@pytest.mark.asyncio
async def test_get_weight_records_by_pet(client, db_session, pet):
    now = datetime.now(timezone.utc)
    wr = WeightRecordORM(pet_id=pet.id, weight=9.9, weight_unit="kg", date=now)
    db_session.add(wr)
    db_session.commit()

    resp = await client.get(f"{BASE}/pet/{pet.id}/")
    assert resp.status_code == status.HTTP_200_OK
    assert any(item["pet_id"] == pet.id for item in resp.json())


@pytest.mark.asyncio
async def test_get_weight_records_by_date_range(client, db_session, pet):
    now = datetime.now(timezone.utc)
    early = now - timedelta(days=5)
    mid = now - timedelta(days=2)
    late = now
    db_session.add_all(
        [
            WeightRecordORM(pet_id=pet.id, weight=8.0, weight_unit="kg", date=early),
            WeightRecordORM(pet_id=pet.id, weight=9.0, weight_unit="kg", date=mid),
            WeightRecordORM(pet_id=pet.id, weight=10.0, weight_unit="kg", date=late),
        ]
    )
    db_session.commit()

    # Use naive ISO strings for query params to avoid 422 parsing issues
    start_q = mid.replace(tzinfo=None).isoformat()
    end_q = late.replace(tzinfo=None).isoformat()
    resp = await client.get(
        f"{BASE}/pet/{pet.id}/range/?start_date={start_q}&end_date={end_q}"
    )
    assert resp.status_code == status.HTTP_200_OK
    dates = [datetime.fromisoformat(r["date"]) for r in resp.json()]
    # Normalize to naive datetimes for comparison
    dates_naive = [d.replace(tzinfo=None) for d in dates]
    mid_naive = mid.replace(tzinfo=None)
    late_naive = late.replace(tzinfo=None)
    assert all(mid_naive <= d <= late_naive for d in dates_naive)


@pytest.mark.asyncio
async def test_update_weight_record_success(client, db_session, pet):
    wr = WeightRecordORM(
        pet_id=pet.id, weight=10.0, weight_unit="kg", date=datetime.now(timezone.utc)
    )
    db_session.add(wr)
    db_session.commit()
    db_session.refresh(wr)

    upd = {"weight": 12.3, "notes": "Gained"}
    resp = await client.put(f"{BASE}/{wr.id}/", json=upd)
    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["weight"] == 12.3
    assert body["notes"] == "Gained"


@pytest.mark.asyncio
async def test_delete_weight_record_success(client, db_session, pet):
    wr = WeightRecordORM(
        pet_id=pet.id, weight=10.0, weight_unit="kg", date=datetime.now(timezone.utc)
    )
    db_session.add(wr)
    db_session.commit()
    db_session.refresh(wr)

    resp = await client.delete(f"{BASE}/{wr.id}/")
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    # Verify gone
    r2 = await client.get(f"{BASE}/pet/{pet.id}/")
    assert all(item["id"] != wr.id for item in r2.json())


@pytest.mark.asyncio
async def test_weight_record_access_denied_for_other_user(
    client, db_session, pet, other_user
):
    # Create record for pet owned by test_user
    wr = WeightRecordORM(
        pet_id=pet.id, weight=10.0, weight_unit="kg", date=datetime.now(timezone.utc)
    )
    db_session.add(wr)
    db_session.commit()
    db_session.refresh(wr)

    # Switch to other user
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    # Access endpoints should be denied
    r_get = await client.get(f"{BASE}/pet/{pet.id}/")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND

    r_upd = await client.put(f"{BASE}/{wr.id}/", json={"weight": 9.5})
    assert r_upd.status_code == status.HTTP_403_FORBIDDEN

    r_del = await client.delete(f"{BASE}/{wr.id}/")
    assert r_del.status_code == status.HTTP_403_FORBIDDEN
