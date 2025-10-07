# tests/test_weight_goal.py
import pytest
from datetime import datetime, timedelta, timezone

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.pet import PetORM
from app.models.weight_goal import WeightGoalORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user

BASE = "/api/weight-goals"


@pytest.fixture
def test_user(db_session):
    user = UserORM(
        username="wg_user",
        email="wg_user@test.com",
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
        username="wg_other",
        email="wg_other@test.com",
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


def make_goal_payload(pet_id: int, target: float = 12.5):
    return {
        "pet_id": pet_id,
        "target_weight": target,
        "weight_unit": "kg",
        "goal_type": "custom",
        "description": "Gain weight",
        "is_active": True,
        "target_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    }


@pytest.mark.asyncio
async def test_create_weight_goal_success(client, pet):
    payload = make_goal_payload(pet.id)
    resp = await client.post(f"{BASE}/", json=payload)
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["pet_id"] == pet.id
    assert data["target_weight"] == payload["target_weight"]


@pytest.mark.asyncio
async def test_list_all_weight_goals_for_user(client, db_session, pet):
    wg1 = WeightGoalORM(
        pet_id=pet.id, target_weight=11.0, weight_unit="kg", goal_type="custom"
    )
    wg2 = WeightGoalORM(
        pet_id=pet.id, target_weight=12.0, weight_unit="kg", goal_type="custom"
    )
    db_session.add_all([wg1, wg2])
    db_session.commit()

    resp = await client.get(f"{BASE}/")
    assert resp.status_code == status.HTTP_200_OK
    items = resp.json()
    assert len(items) >= 2
    assert all("pet_name" in it and "pet_type" in it for it in items)


@pytest.mark.asyncio
async def test_get_weight_goals_by_pet(client, db_session, pet):
    wg = WeightGoalORM(
        pet_id=pet.id, target_weight=10.0, weight_unit="kg", goal_type="custom"
    )
    db_session.add(wg)
    db_session.commit()

    resp = await client.get(f"{BASE}/pet/{pet.id}/")
    assert resp.status_code == status.HTTP_200_OK
    assert any(item["pet_id"] == pet.id for item in resp.json())


@pytest.mark.asyncio
async def test_update_weight_goal_success(client, db_session, pet):
    wg = WeightGoalORM(
        pet_id=pet.id, target_weight=10.0, weight_unit="kg", goal_type="custom"
    )
    db_session.add(wg)
    db_session.commit()
    db_session.refresh(wg)

    upd = {"target_weight": 9.0, "description": "Cutting"}
    resp = await client.put(f"{BASE}/{wg.id}/", json=upd)
    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["target_weight"] == 9.0
    assert body["description"] == "Cutting"


@pytest.mark.asyncio
async def test_delete_weight_goal_success(client, db_session, pet):
    wg = WeightGoalORM(
        pet_id=pet.id, target_weight=10.0, weight_unit="kg", goal_type="custom"
    )
    db_session.add(wg)
    db_session.commit()
    db_session.refresh(wg)

    resp = await client.delete(f"{BASE}/{wg.id}/")
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    # Verify not found under pet list
    r2 = await client.get(f"{BASE}/pet/{pet.id}/")
    assert all(item["id"] != wg.id for item in r2.json())


@pytest.mark.asyncio
async def test_weight_goal_access_denied_for_other_user(
    client, db_session, pet, other_user
):
    wg = WeightGoalORM(
        pet_id=pet.id, target_weight=10.0, weight_unit="kg", goal_type="custom"
    )
    db_session.add(wg)
    db_session.commit()
    db_session.refresh(wg)

    # Switch to other user
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    r_get = await client.get(f"{BASE}/pet/{pet.id}/")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND

    r_upd = await client.put(f"{BASE}/{wg.id}/", json={"target_weight": 8.5})
    assert r_upd.status_code == status.HTTP_403_FORBIDDEN

    r_del = await client.delete(f"{BASE}/{wg.id}/")
    assert r_del.status_code == status.HTTP_403_FORBIDDEN
