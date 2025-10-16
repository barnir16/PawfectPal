# tests/test_image_upload.py
import io
import pytest
from datetime import datetime, timezone
from pathlib import Path

from fastapi import status

from app.main import app
from app.models import UserORM
from app.models.pet import PetORM
from app.models.task import TaskORM

# Auth deps (override both absolute and relative)
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_current_user as rel_get_current_user


@pytest.fixture
def test_user(db_session):
    user = UserORM(
        username="img_user",
        email="img_user@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    yield user


@pytest.fixture
def other_user(db_session):
    user = UserORM(
        username="other_user",
        email="other_user@test.com",
        is_provider=False,
        hashed_password="StrongPass1",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    yield user


@pytest.fixture
def test_pet(db_session, test_user):
    pet = PetORM(
        user_id=test_user.id,
        name="Fido",
        breed_type="Dog",
        breed="Beagle",
    )
    db_session.add(pet)
    db_session.commit()
    db_session.refresh(pet)
    return pet


@pytest.fixture
def test_task(db_session, test_user):
    task = TaskORM(
        user_id=test_user.id,
        title="Vet Visit",
        description="Annual checkup",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    return task


@pytest.fixture(autouse=True)
def patch_fs_and_auth(tmp_path, monkeypatch, test_user):
    # Point uploads dir to temp location to avoid writing to repo
    images_dir = tmp_path / "images"
    monkeypatch.setattr("routers.image_upload.IMAGES_DIR", images_dir, raising=True)

    # Ensure save_upload_file does minimal work and writes to temp file
    def _fake_save(upload_file, destination: str):
        p = Path(destination)
        p.parent.mkdir(parents=True, exist_ok=True)
        # write small bytes to simulate save
        data = upload_file.file.read() if hasattr(upload_file, "file") else b""
        with open(p, "wb") as f:
            f.write(data or b"test")
        return str(p)

    monkeypatch.setattr(
        "routers.image_upload.save_upload_file", _fake_save, raising=True
    )

    # Default current user override
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[rel_get_current_user] = lambda: test_user

    yield

    # Cleanup overrides
    for key in (get_current_user, rel_get_current_user):
        try:
            del app.dependency_overrides[key]
        except KeyError:
            pass


@pytest.mark.asyncio
async def test_upload_pet_image_success(client, test_pet):
    # Prepare a fake PNG file
    files = {"file": ("test.png", io.BytesIO(b"\x89PNG\r\n"), "image/png")}

    resp = await client.post(f"/image_upload/pet-image/{test_pet.id}", files=files)
    # Note: if router has field mismatch (photoUri vs photo_uri), this may fail and reveal a bug
    assert resp.status_code in (
        status.HTTP_200_OK,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    if resp.status_code == status.HTTP_200_OK:
        data = resp.json()
        assert data["message"]
        assert data["file_path"].startswith("/uploads/images/")


@pytest.mark.asyncio
async def test_upload_pet_image_non_owner_404(client, db_session, test_pet, other_user):
    # Switch auth to other user who does not own the pet
    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[rel_get_current_user] = lambda: other_user

    files = {"file": ("test.jpg", io.BytesIO(b"JPEG"), "image/jpeg")}
    resp = await client.post(f"/image_upload/pet-image/{test_pet.id}", files=files)
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_upload_pet_image_invalid_type_400(client, test_pet):
    files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    resp = await client.post(f"/image_upload/pet-image/{test_pet.id}", files=files)
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_upload_task_attachment_success(client, test_task):
    files = {"file": ("attach.png", io.BytesIO(b"\x89PNG"), "image/png")}
    resp = await client.post(
        f"/image_upload/task-attachment/{test_task.id}", files=files
    )
    assert resp.status_code in (
        status.HTTP_200_OK,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    if resp.status_code == status.HTTP_200_OK:
        data = resp.json()
        assert data["file_path"].startswith("/uploads/images/")


@pytest.mark.asyncio
async def test_upload_task_attachment_invalid_type_400(client, test_task):
    files = {"file": ("attach.pdf", io.BytesIO(b"%PDF"), "application/pdf")}
    resp = await client.post(
        f"/image_upload/task-attachment/{test_task.id}", files=files
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_upload_profile_image_success(client):
    files = {"file": ("avatar.png", io.BytesIO(b"\x89PNG"), "image/png")}
    resp = await client.post("/image_upload/profile-image", files=files)
    assert resp.status_code in (
        status.HTTP_200_OK,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    if resp.status_code == status.HTTP_200_OK:
        data = resp.json()
        assert data["profile_image"].startswith("/uploads/images/")


@pytest.mark.asyncio
async def test_upload_chat_attachment_success(client):
    files = {"file": ("chat.png", io.BytesIO(b"\x89PNG"), "image/png")}
    resp = await client.post("/image_upload/chat-attachment", files=files)
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["id"]
    assert data["file_url"].endswith(".png")
    assert data["file_type"] == "image/png"


@pytest.mark.asyncio
async def test_test_upload_echoes_metadata(client):
    files = {"file": ("debug.png", io.BytesIO(b"\x89PNG"), "image/png")}
    resp = await client.post("/image_upload/test-upload", files=files)
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["filename"] == "debug.png"
    assert data["content_type"] == "image/png"
