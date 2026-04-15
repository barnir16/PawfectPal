# PawfectPal Feature Architecture

This document explains how the major app features work today, which files own the flow, and where the current rough edges are.

## Stack Overview

- Frontend: React + Vite in `frontend/src`
- Backend: FastAPI in `backend/app`
- Database: PostgreSQL via Railway
- Auth: Firebase Authentication on the client, JWT validation on the backend
- Runtime config: Railway environment variables first, with Firebase Remote Config used as a limited backup/feature-flag source
- Deployment: Railway runs the backend from `backend` and the frontend from `frontend`

## Authentication

Frontend:
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/features/auth/pages/AuthPage.tsx`

Backend:
- `backend/app/dependencies/auth.py`
- `backend/app/routers/user.py`

Flow:
1. The user signs in on the frontend.
2. The frontend stores the auth token in local storage through `StorageHelper`.
3. API calls include `Authorization: Bearer ...` through `frontend/src/services/api.ts`.
4. Backend dependencies validate the JWT and attach the current user to the request.

Notes:
- The auth flow is functional, but several backend routers still contain noisy debug logging and should be cleaned further.

## App Shell And Routing

Main shell:
- `frontend/src/App.tsx`
- `frontend/src/app/layout/Header.tsx`
- `frontend/src/app/layout/Sidebar.tsx`

Flow:
1. `App.tsx` wraps the app in theme, auth, localization, notification, and error-boundary providers.
2. After auth resolves, the app renders the dashboard and feature routes.
3. The floating AI chatbot is mounted globally from `App.tsx`.

Notes:
- The marketplace currently only has a `/marketplace` route. The detail, contact, and edit routes referenced by the marketplace UI are not wired yet.

## Pets

Frontend:
- `frontend/src/features/pets/pages/PetsPage.tsx`
- `frontend/src/features/pets/components/PetList.tsx`
- `frontend/src/features/pets/components/PetCard.tsx`
- `frontend/src/features/pets/components/PetForm/PetForm.tsx`
- `frontend/src/features/pets/components/PetDetail/PetDetail.tsx`

Backend:
- `backend/app/routers/pet.py`
- `backend/app/models/pet.py`
- `backend/app/schemas/pet.py`

Flow:
1. The frontend loads the current user's pets from the backend.
2. The list/cards normalize age from either birthday or stored age.
3. Pet details feed several other features, including AI chat, vaccinations, weights, and service requests.

Notes:
- Pet age handling is now cleaner, but there are still multiple UI components doing similar age formatting logic and that should be centralized later.

## Tasks And Vaccinations

Frontend:
- `frontend/src/features/tasks/pages/TasksPage.tsx`
- `frontend/src/features/tasks/components/TaskForm/TaskForm.tsx`
- `frontend/src/components/tasks/RealVaccineTracker.tsx`

Backend:
- `backend/app/routers/task.py`
- `backend/app/routers/vaccination.py`

Flow:
1. Tasks are created and edited from the tasks screen.
2. Vaccination views query backend endpoints for overdue and due-soon items.
3. Dashboard widgets reuse that data to surface reminders.

Notes:
- The tasks/vaccination flows are more complete than marketplace, but some dashboard behavior still mixes real data with temporary fallback logic.

## Weight Tracking

Frontend:
- `frontend/src/features/weight/pages/WeightTrackingPage.tsx`

Backend:
- `backend/app/routers/weight_record.py`

Flow:
1. The user records pet weights.
2. The backend stores and returns weight history.
3. Frontend charts and summaries display trends for each pet.

Notes:
- Some dashboard-level weight summaries still look partly transitional and should be checked against the dedicated weight flow for consistency.

## Services And Provider Features

Frontend:
- `frontend/src/features/services/pages/ServicesPage.tsx`
- `frontend/src/features/services/pages/BookService.tsx`
- `frontend/src/components/services/*`
- `frontend/src/features/provider/pages/ProviderProfileSetupPage.tsx`
- `frontend/src/features/services/pages/ProviderProfilePage.tsx`

Backend:
- `backend/app/routers/service_requests.py`
- `backend/app/routers/provider.py`
- `backend/app/models/provider_profile.py`

Flow:
1. Pet owners browse services and submit service requests.
2. Providers can browse eligible requests and respond.
3. Chat and file/location sharing support the service-request workflow.

Notes:
- This area is one of the richer parts of the app, but it still has a lot of debug logging and a few TODO-level UI gaps.

## Chat

Frontend:
- `frontend/src/features/chat/pages/ChatListPage.tsx`
- `frontend/src/features/chat/pages/ChatPage.tsx`
- `frontend/src/services/chat/webSocketService.ts`
- `frontend/src/components/services/EnhancedChatWindow.tsx`

Backend:
- `backend/app/routers/chat.py`
- `backend/app/websocket/chat_router.py`

Flow:
1. The frontend opens a conversation and connects through the WebSocket chat service.
2. The backend persists messages and supports attachments, location payloads, and related service-request context.
3. Shared locations are rendered by `LocationMessage.tsx`.

Notes:
- The chat foundation is useful, but some advanced actions in the enhanced chat UI are still TODOs.

## AI Chatbot

Frontend:
- `frontend/src/components/ai/AIChatbot.tsx`
- `frontend/src/hooks/useAIChat.ts`
- `frontend/src/services/ai/aiService.ts`

Backend:
- `backend/app/routers/ai_simple.py`
- `backend/app/services/firebase_user_service.py`
- `backend/app/services/firebase_admin.py`

Flow:
1. The chatbot gathers pet data from the current user context.
2. `aiService.ts` normalizes that pet data into a lightweight `pet_context` payload.
3. The frontend sends `message`, `pet_context`, and `prompt_language` to `POST /ai/chat`.
4. `ai_simple.py` asks `firebase_user_service` for the Gemini key.
5. `firebase_user_service` resolves the key through `firebase_admin`.
6. `firebase_admin` resolves the Gemini key from Railway `GEMINI_API_KEY` first. Firebase Remote Config `gemini_api_key` is only the backup path if Railway does not provide the key.
7. The backend chooses the model from Railway `GEMINI_MODEL`, otherwise it falls back to `gemini-2.5-flash-lite`.
8. Gemini generates the response and the backend returns it with suggested actions.
9. If Gemini is unavailable or rate-limited, the backend now returns a clear retry/unavailable response instead of pretending a weak fallback is a real AI answer.

Notes:
- The current chatbot is real and production-usable, but quality still depends on Gemini quota and better pet-name matching.

## AI Conversation Persistence

Backend:
- `backend/app/routers/ai_conversations.py`
- `backend/app/models/ai_conversation.py`
- `backend/app/schemas/ai_conversation.py`

Flow:
1. AI conversation records can be created, listed, updated, and soft-deleted.
2. Individual messages can be attached to a saved conversation.

Notes:
- This persistence layer exists, but the floating chatbot currently behaves more like a direct request tool than a fully integrated long-lived conversation UI.

## Marketplace

Frontend:
- `frontend/src/features/marketplace/pages/MarketplacePostsPage.tsx`
- `frontend/src/components/marketplace/MarketplacePostCard.tsx`
- `frontend/src/components/marketplace/MarketplacePostForm.tsx`
- `frontend/src/services/marketplace/marketplaceService.ts`

Backend:
- `backend/app/routers/marketplace_posts.py`
- `backend/app/models/marketplace_post.py`
- `backend/app/schemas/marketplace_post.py`

Current flow:
1. Users can browse marketplace posts and create their own posts.
2. Backend validates service type and pet ownership when creating a post.
3. Browsing uses a summary schema for open posts.
4. Responding to a post currently only increments `responses_count`.

Current limitations:
- The frontend expects `description` in `MarketplacePostSummary`, but the backend summary schema does not include it.
- The page navigates to detail/edit/contact routes that are not registered in `App.tsx`.
- The create form is still called with `pets={[]}`, so pet selection is not actually wired.
- Responding does not create a real chat, lead, provider notification, or service-request conversion.

## Notifications And PWA

Frontend:
- `frontend/src/services/notifications/firebaseMessagingService.ts`
- `frontend/src/components/PWAInstallPrompt.tsx`
- `frontend/public/manifest.json`

Flow:
1. The app can initialize Firebase messaging for notifications.
2. The PWA install prompt is shown through the global shell.

Notes:
- Browser-side Firebase config should stay limited to public web config only; secrets must stay in Railway/backend or Firebase server-side access paths.

## Configuration And Deployment

Frontend:
- `frontend/src/config/shared.ts`
- `frontend/src/services/config/firebaseConfigService.ts`

Backend:
- `backend/app/services/firebase_admin.py`
- `backend/start.sh`
- `backend/Dockerfile`

Flow:
1. Public client-safe config comes from `shared.ts`.
2. Browser Firebase Remote Config is optional and only initializes if a browser-safe Firebase API key is present.
3. Backend secrets should come from Railway environment variables by default.
4. Backend Firebase Remote Config access uses service-account OAuth2 and serves as a fallback path, not the primary secret store.

Recommended deployment posture:
- Keep real secrets in Railway and treat Railway as the source of truth for production backend credentials.
- Treat Firebase Remote Config as a fallback or feature-flag source, not the only place that a critical production key exists.
- Rebuild the frontend after config changes that affect bundled public assets.

## Recommended Cleanup Direction

Short-term:
- Finish marketplace routes and data contracts.
- Remove remaining noisy debug logs from backend routers and frontend service layers.
- Replace test/debug endpoints with narrower health/admin tooling.

Medium-term:
- Centralize duplicated formatting helpers such as pet age/date normalization.
- Tighten API typing so frontend and backend marketplace/service-request contracts cannot drift silently.
- Add end-to-end smoke tests for auth, AI chat, service requests, and marketplace flows.

Portfolio-ready direction:
- Keep this repo as the working project history.
- Create a cleaner public-facing branch or separate portfolio mirror later with curated commits, docs, screenshots, and a small set of polished features.
