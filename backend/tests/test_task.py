# tests/test_task.py
import pytest
from datetime import datetime, timedelta, timezone

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.task import TaskORM

from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def test_user(db_session):
    user = UserORM(
        username="task_user",
        email="task_user@test.com",
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
        username="task_other",
        email="task_other@test.com",
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


def make_task_payload(offset_hours: int = 0):
    dt = datetime.now(timezone.utc) + timedelta(hours=offset_hours)
    return {
        "title": "Walk Fido",
        "description": "Evening walk",
        "date_time": dt.isoformat(),
        "repeat_interval": None,
        "repeat_unit": None,
        "repeat_end_date": None,
        "pet_ids": [],
        "attachments": [],
        "priority": "medium",
        "status": "pending",
        "is_completed": False,
    }


@pytest.mark.asyncio
async def test_create_task_success(client):
    payload = make_task_payload()
    resp = await client.post("/task/", json=payload)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["title"] == payload["title"]


@pytest.mark.asyncio
async def test_list_tasks_returns_user_tasks_only(
    client, db_session, test_user, other_user
):
    # Create a task for default user and another for other_user
    t1 = TaskORM(
        user_id=test_user.id,
        title="Task 1",
        description="Mine",
        date_time=datetime.now(timezone.utc),
    )
    t2 = TaskORM(
        user_id=other_user.id,
        title="Task 2",
        description="Other's",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add_all([t1, t2])
    db_session.commit()

    resp = await client.get("/task/")
    assert resp.status_code == status.HTTP_200_OK
    items = resp.json()
    assert any(item["title"] == "Task 1" for item in items)
    assert all(item["title"] != "Task 2" for item in items)


@pytest.mark.asyncio
async def test_get_task_by_id_and_ownership(client, db_session, test_user, other_user):
    task = TaskORM(
        user_id=test_user.id,
        title="My Task",
        description="Mine",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    # Owner can get
    r1 = await client.get(f"/task/{task.id}/")
    assert r1.status_code == status.HTTP_200_OK
    assert r1.json()["id"] == task.id

    # Switch to other user -> 404
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user
    r2 = await client.get(f"/task/{task.id}/")
    assert r2.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_task_success(client, db_session, test_user):
    task = TaskORM(
        user_id=test_user.id,
        title="Old Title",
        description="Old Desc",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    upd = {"title": "New Title", "status": "in_progress"}
    resp = await client.put(f"/task/{task.id}/", json=upd)
    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["title"] == "New Title"
    assert body["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_task_success(client, db_session, test_user):
    task = TaskORM(
        user_id=test_user.id,
        title="Delete Me",
        description="Desc",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    task_id = task.id
    try:
        db_session.expunge(task)
    except Exception:
        pass

    resp = await client.delete(f"/task/{task_id}/")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["message"] == "Task deleted successfully"

    # Verify not found thereafter
    r2 = await client.get(f"/task/{task_id}/")
    assert r2.status_code == status.HTTP_404_NOT_FOUND
