# PawfectPal

PawfectPal is a full-stack pet-care platform built with a React/Vite frontend, a FastAPI backend, and a PostgreSQL-ready data layer. It combines pet profiles, vaccination and weight tracking, service marketplace features, real-time chat, Google sign-in, and a Gemini-backed pet-care assistant.

This repository is being prepared as a clean portfolio version of an active development project. The strongest DevOps story is the production configuration work: separating frontend/backend/database concerns, moving secrets into environment variables, externalizing CORS and runtime config, and validating the app with CI before deployment.

## Project Status

Stable or mostly stable:

- User registration and JWT login
- Google sign-in through Google Identity Services
- Pet profile management
- Vaccination, task, and weight tracking flows
- Gemini assistant through the backend
- Railway-oriented backend deployment
- PostgreSQL-compatible SQLAlchemy models and Alembic migrations
- Real-time service-request chat

Still being refined:

- Provider marketplace UX
- Booking/provider-side edge cases
- Push notification polish
- Demo video and screenshots for the public portfolio page

## Tech Stack

Frontend:

- React 18
- Vite
- TypeScript
- Material UI
- React Router
- Vitest

Backend:

- Python 3.11
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL in production, SQLite-friendly tests/local fallback
- JWT authentication
- Google Identity Services verification
- Google Gemini API
- Firebase Admin SDK for Firebase-backed services such as messaging/config

Infrastructure:

- Railway backend service
- Railway PostgreSQL
- Railway environment variables for backend secrets
- GitHub Actions CI for backend smoke tests and frontend builds

## Architecture

```text
User
  -> React/Vite frontend
  -> FastAPI backend on Railway
  -> PostgreSQL database

Google sign-in:
  React frontend requests a Google token
  FastAPI verifies the token with Google
  FastAPI maps or creates a local PostgreSQL user
  FastAPI issues the app JWT

AI assistant:
  React frontend sends pet context to FastAPI
  FastAPI calls Gemini with a backend-only API key
  FastAPI returns the assistant response
```

## Security And Configuration

Production secrets are expected to live outside the repository.

Backend-only values:

- `DATABASE_URL`
- `SECRET_KEY`
- `GEMINI_API_KEY`
- `DOG_API_KEY`, `CAT_API_KEY`, or `PETS_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- Private API keys or service credentials

Frontend public values:

- `VITE_API_BASE_URL`
- Firebase web config values
- `VITE_GOOGLE_CLIENT_ID`
- Public feature flags

Breed/provider API calls are proxied through FastAPI so private provider keys never ship in the browser bundle.

Never commit `.env`, database URLs, Firebase service account JSON, private keys, or production JWT secrets. If a key was ever committed to a public repository, treat it as compromised and rotate it.

## Local Setup

Backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm ci
copy .env.example .env
npm run dev
```

Run migrations when using PostgreSQL:

```bash
cd backend
alembic upgrade head
```

## Testing

Backend smoke tests:

```bash
cd backend
pytest --no-cov tests/test_ai.py tests/test_ai_chat.py tests/test_user_router.py tests/test_users.py
```

Frontend:

```bash
cd frontend
npm run build
npm run test:run
```

## Deployment Notes

Railway handles deployment for the backend service and managed PostgreSQL. GitHub Actions is used for pre-deployment validation: backend smoke tests must pass and the frontend production build must succeed.

Recommended Railway backend variables:

- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `DOG_API_KEY`
- `CAT_API_KEY`
- `PETS_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `PUBLIC_BACKEND_URL`
- `ENVIRONMENT=production`

Example `CORS_ORIGINS`:

```text
https://your-frontend-domain.com,http://localhost:5173
```

## Known Limitations

PawfectPal is a portfolio project, not a finished commercial marketplace. The core pet profile, auth, deployment, database, and AI assistant flows are the main showcase. The provider marketplace and booking flows are still being refined.

## Portfolio Framing

PawfectPal began as an experimental full-stack pet-care project and evolved into a deployed multi-service app. The most relevant junior DevOps takeaways were configuring Railway services, separating public frontend configuration from backend secrets, handling CORS and production API URLs, integrating a managed database, and adding CI checks around an existing application.
