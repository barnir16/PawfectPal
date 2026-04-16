# PawfectPal Feature Guide

This file explains how the main parts of PawfectPal currently work in the codebase.

## Runtime Layout

- Frontend app entry: `frontend/src/App.tsx`
- Frontend feature areas: `frontend/src/features`
- Frontend shared services: `frontend/src/services`
- Backend app entry: `backend/app/main.py`
- Backend HTTP routes: `backend/app/routers`
- Backend service integrations: `backend/app/services`

## Authentication

- Frontend auth state is managed in `frontend/src/contexts/AuthContext.tsx`.
- Username/password login goes through `frontend/src/services/auth/authService.ts`, which calls the backend auth routes.
- Google login also starts in `authService.ts`, then the auth context stores the returned bearer token in `StorageHelper`.
- Protected frontend screens rely on the auth context and `frontend/src/components/ProtectedRoute.tsx`.
- Backend auth endpoints live in `backend/app/routers/user.py`.
- Token creation and password helpers live under `backend/app/auth` and `backend/app/dependencies/auth.py`.

## Pets

- Main pets page: `frontend/src/features/pets/pages/PetsPage.tsx`
- Pet creation/edit form: `frontend/src/features/pets/components/PetForm/PetForm.tsx`
- Pet details page: `frontend/src/features/pets/components/PetDetail/PetDetail.tsx`
- Frontend pet API wrapper: `frontend/src/services/pets/petService.ts`
- Backend pet routes: `backend/app/routers/pet.py`

The frontend normalizes backend pet records before rendering them. Shared pet age formatting now lives in `frontend/src/utils/petAge.ts` and is reused across the pets UI, chatbot prompt building, and service detail screens.

## Tasks and Reminders

- Tasks page: `frontend/src/features/tasks/pages/TasksPage.tsx`
- Task form: `frontend/src/features/tasks/components/TaskForm/TaskForm.tsx`
- Frontend task APIs: `frontend/src/services/tasks`
- Backend task routes: `backend/app/routers/task.py`

Notifications are handled on the frontend through `frontend/src/contexts/NotificationContext.tsx` and helper utilities under `frontend/src/utils` and `frontend/src/services/notifications`.

## Vaccinations and Medical Records

- Vaccine tracking UI is connected from the tasks/dashboard areas and `frontend/src/components/tasks/RealVaccineTracker.tsx`.
- Backend vaccination routes: `backend/app/routers/vaccination.py` and `backend/app/routers/vaccines.py`
- Medical record routes: `backend/app/routers/medical_record.py`

These areas are mostly standard CRUD flows: the frontend fetches user pet data, then overlays medical and vaccine records per pet.

## Weight Tracking

- Weight page: `frontend/src/features/weight/pages/WeightTrackingPage.tsx`
- Frontend weight services: `frontend/src/services/weight`
- Backend weight record routes: `backend/app/routers/weight_record.py`
- Backend weight goal routes: `backend/app/routers/weight_goal.py`

The weight UI combines stored weight records with pet metadata so the user can chart trends, add manual measurements, and manage target goals.

## AI Chatbot

- Floating chatbot UI: `frontend/src/components/ai/AIChatbot.tsx`
- Chat state hook: `frontend/src/hooks/useAIChat.ts`
- Frontend AI request builder: `frontend/src/services/ai/aiService.ts`
- Backend AI route: `backend/app/routers/ai_simple.py`
- Firebase-backed config helpers: `backend/app/services/firebase_admin.py` and `backend/app/services/firebase_user_service.py`

### Chatbot request flow

1. The floating chatbot loads pets from the frontend pet service.
2. `aiService.ts` builds a simplified `pet_context` payload from the current pets.
3. The frontend detects the dominant message language and sends `message`, `pet_context`, and `prompt_language` to `POST /ai/chat`.
4. `backend/app/routers/ai_simple.py` builds a plain-language prompt for Gemini and returns a chatbot message plus suggested actions.

### Gemini key and model flow

- Primary Gemini key source: Railway backend environment variable `GEMINI_API_KEY`
- Fallback Gemini key source: Firebase Remote Config key `gemini_api_key`
- Model name source: Railway backend environment variable `GEMINI_MODEL`
- Default model if `GEMINI_MODEL` is missing: `gemini-2.5-flash-lite`

The current backend architecture is Railway-first for the Gemini key. Firebase Remote Config is only the backup source if Railway does not provide a valid Gemini key.

### Chatbot fallback behavior

- If Gemini is unavailable, the backend can still return limited rule-based replies for some pet-specific or sorting requests.
- If the AI provider returns quota or availability errors, the backend returns a temporary unavailable response instead of crashing the request path.

## Service Marketplace for Pet Care Providers

- Main services page: `frontend/src/features/services/pages/ServicesPage.tsx`
- Booking page: `frontend/src/features/services/pages/BookService.tsx`
- Request browser: `frontend/src/components/services/ServiceRequestBrowser.tsx`
- Request details: `frontend/src/components/services/ServiceRequestDetails.tsx`
- My requests: `frontend/src/components/services/MyServiceRequests.tsx`
- Service chat UI: `frontend/src/components/services/EnhancedChatWindow.tsx`
- Backend service request routes: `backend/app/routers/service_requests.py`
- Backend provider routes: `backend/app/routers/provider.py`
- Backend chat routes: `backend/app/routers/chat.py`
- Backend WebSocket chat route: `backend/app/websocket/chat_router.py`

### How the service flow works

- A pet owner creates a service request from the frontend form.
- The backend stores the request and associated pet context.
- Providers can browse open requests and respond.
- Once a provider is engaged, the service chat area uses API calls and WebSocket support for real-time updates.

### Current marketplace/service chat notes

- The core request-and-chat flow exists.
- Several screens still overlap between older and newer service/chat implementations, so this area benefits most from future consolidation.

## Marketplace Posts

- Marketplace page: `frontend/src/features/marketplace/pages/MarketplacePostsPage.tsx`
- Marketplace card/form components: `frontend/src/components/marketplace`
- Frontend marketplace types and services: `frontend/src/types/services/marketplacePost.ts` and marketplace service modules
- Backend routes: `backend/app/routers/marketplace_posts.py`

Marketplace posts support list/browse/create/edit flows. The current in-page details/edit behavior is intentionally routed inside the marketplace page rather than relying on missing standalone routes.

## Chat Between Users and Providers

- Frontend chat list: `frontend/src/features/chat/pages/ChatListPage.tsx`
- Frontend chat page: `frontend/src/features/chat/pages/ChatPage.tsx`
- Frontend chat API helpers: `frontend/src/features/chat/chatApi.ts` and `frontend/src/services/chat`
- Backend message routes: `backend/app/routers/chat.py`
- Backend WebSocket endpoint: `backend/app/websocket/chat_router.py`

The chat stack mixes REST for history/loading and WebSocket for live events. Attachments are uploaded through `backend/app/routers/image_upload.py` and then referenced inside messages.

## File and Image Uploads

- Backend upload routes: `backend/app/routers/image_upload.py`
- Shared upload storage path is exposed through the backend static `/uploads` mount in `backend/app/main.py`

Uploaded pet images, profile images, task attachments, and chat attachments are stored under the backend uploads directory and served back through relative `/uploads/...` paths.

## Firebase and Remote Config

- Backend Firebase Admin wrapper: `backend/app/services/firebase_admin.py`
- User-facing Firebase helper: `backend/app/services/firebase_user_service.py`
- Frontend Remote Config support: `frontend/src/services/config`

Firebase Remote Config is currently used as a secondary configuration source for non-secret operational values and as a backup location for Gemini-related settings when Railway env values are missing.

## Deployment Notes

- Railway currently deploys from the `mergedPlatform` branch.
- Backend runtime config is centered around Railway environment variables.
- Frontend runtime API base resolution is shared through `frontend/src/services/api.ts`.
- Backend CORS and static file mounting are configured in `backend/app/main.py`.

## Recommended Reading Order

If you need to re-learn the project quickly, read these files first:

1. `frontend/src/App.tsx`
2. `backend/app/main.py`
3. `frontend/src/contexts/AuthContext.tsx`
4. `frontend/src/services/api.ts`
5. `backend/app/routers/ai_simple.py`
6. `backend/app/routers/service_requests.py`
7. `backend/app/routers/chat.py`
8. `frontend/src/components/ai/AIChatbot.tsx`
9. `frontend/src/features/marketplace/pages/MarketplacePostsPage.tsx`
10. `frontend/src/features/services/pages/ServicesPage.tsx`
