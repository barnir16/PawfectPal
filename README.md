# PawfectPal 

> A comprehensive pet care management platform that helps pet owners track their pets' health, schedule vet visits, and connect with pet care services.

## Features

- **Pet Profiles**: Create and manage detailed profiles for all your pets
- **Health Tracking**: Monitor vaccinations, medications, and vet visits
- **Vet Connect**: Find and book appointments with local veterinarians
- **AI Assistant**: Get personalized pet care advice powered by Google's Gemini AI
- **Mobile-Friendly**: Responsive design works on all devices
- **Secure Authentication**: JWT-based auth with Google OAuth support
- **Real-time Chat**: Message your vet or pet service providers directly
- **Health Analytics**: Track weight and health metrics over time

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Google Gemini AI** - For AI-powered pet care advice
- **JWT** - Secure authentication

### Frontend
- **React** (Vite) - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - UI component library
- **React Query** - Data fetching and state management
- **React Hook Form** - Form handling
- **Date-fns** - Date utilities

## Screenshots

*Screenshots will be added here*

## Project Structure

```
PawfectPal/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configurations
│   │   ├── crud/          # Database operations
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic models
│   │   └── services/      # Business logic
│   ├── tests/             # Backend tests
│   └── alembic/           # Database migrations
│
├── frontend/
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── types/         # TypeScript types
│       └── utils/         # Helper functions
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS version recommended)
- **Python** 3.11+
- **PostgreSQL** 14+
- **Docker** (optional, for containerized development)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/PawfectPal.git
cd PawfectPal
```

2. Set up backend environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up frontend:
```bash
cd ../frontend
npm install
```

### Configuration

Create `.env` files with the following structure:

**Backend (backend/.env):**
```
DATABASE_URL=REDACTED_DATABASE_URL
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET
GEMINI_API_KEY=REDACTED_GEMINI_API_KEY
ENVIRONMENT=development
```

**Frontend (frontend/.env):**
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Running Locally

1. Start the database:
```bash
docker-compose up -d db
```

2. Run database migrations:
```bash
cd backend
alembic upgrade head
```

3. Start the backend:
```bash
uvicorn app.main:app --reload
```

4. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

## Deployment

The application is deployed on Railway. To deploy your own instance:

1. Fork this repository
2. Create a new Railway project
3. Connect your GitHub repository
4. Add the required environment variables
5. Deploy!

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## Contact

For questions or support, please open an issue on GitHub or contact us at [your-email@example.com](mailto:your-email@example.com).

---

> Made with by [Your Name] | [GitHub](https://github.com/your-username)
**PawfectPal** - Making pet care easier, one paw at a time! 🐾

