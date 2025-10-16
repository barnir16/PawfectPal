# PawfectPal 🐾

A comprehensive pet care management platform built with **React + TypeScript + Vite** (frontend) and **FastAPI + SQLAlchemy** (backend).

## 🚀 Current Status: **PRODUCTION READY** ✅

This project is now in production with a fully functional pet care management platform. The app features a modern React frontend with FastAPI backend, deployed on Railway with PostgreSQL database.

## ✨ What's Working Now

### ✅ **Completed Features**
- **Modern React Architecture**: Clean, component-based structure with TypeScript
- **Authentication System**: JWT-based auth with Google OAuth support
- **Pet Management**: Full CRUD operations for pet profiles with image uploads
- **Task Management**: Create, edit, and track pet care tasks with priorities
- **Medical Records**: Track vaccinations and medical history
- **AI Integration**: Gemini AI chatbot for pet care advice
- **Chat System**: Real-time messaging between pet owners and service providers
- **Service Booking**: Complete service request and management system
- **Weight Tracking**: Monitor pet weight with goal setting
- **Multi-language Support**: English and Hebrew localization
- **Responsive UI**: Material-UI components with modern design
- **API Integration**: Robust backend communication with error handling
- **Production Deployment**: Live on Railway with PostgreSQL database

### 🔧 **Technical Infrastructure**
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + JWT Auth
- **Database**: PostgreSQL with Alembic migrations
- **Deployment**: Railway (Frontend + Backend + Database)
- **State Management**: React Context + Custom Hooks
- **API Layer**: Centralized service architecture with error handling
- **Configuration**: Firebase Remote Config integration
- **Type Safety**: Comprehensive TypeScript definitions
- **File Uploads**: Image upload and management system
- **Real-time Features**: Chat system with file attachments

## 🛠️ Technology Stack

### Frontend
- **React 18** with **TypeScript** for type safety
- **Vite** for fast development and building
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **React Hook Form** with **Zod** validation
- **Custom hooks** for business logic

### Backend
- **FastAPI** for modern Python web framework
- **SQLAlchemy** for database ORM
- **PostgreSQL** for production database
- **JWT** for secure authentication
- **Pydantic** for data validation
- **Python 3.11+** with async support
- **Alembic** for database migrations
- **File Upload** support for images and documents

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/barnir16/PawfectPal.git
cd PawfectPal
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Firebase Configuration
The app uses Firebase Remote Config for dynamic configuration. See `frontend/FIREBASE_CONFIG_SETUP.md` for setup details.

### API Configuration
API endpoints are configured through Firebase Remote Config and can be updated without redeploying the app.

## 📱 Current Features

### Authentication
- User registration and login
- JWT token management
- Google OAuth integration (configurable)
- Secure password validation

### Pet Management
- Create and edit pet profiles
- Upload pet photos
- Track breed information with external API integration
- Manage health and behavior issues
- Store medical records and vaccinations

### Task Management
- Create recurring pet care tasks
- Set priorities and status tracking
- Assign tasks to specific pets
- Calendar integration

### AI Assistant
- Integrated Gemini AI chatbot
- Pet care advice and recommendations
- Natural language interaction

## 🚧 What's Missing / Next Steps

### **High Priority**
- [ ] **Mobile App**: Native iOS/Android applications
- [ ] **Push Notifications**: Real-time notifications for tasks and messages
- [ ] **Advanced Search**: Filter pets, tasks, and services
- [ ] **Data Export**: Export pet data to PDF/CSV
- [ ] **Offline Support**: Basic offline data caching

### **Medium Priority**
- [ ] **Advanced Analytics**: Pet health trends and insights
- [ ] **Data Backup**: Cloud backup and sync
- [ ] **Social Features**: Share pet profiles, community features
- [ ] **Calendar Integration**: Google Calendar sync for tasks
- [ ] **Payment Integration**: Stripe/PayPal for service payments

### **Future Enhancements**
- [ ] **GPS Tracking**: Real-time pet location (requires mobile app)
- [ ] **Vet Integration**: Direct communication with veterinarians
- [ ] **Emergency Alerts**: Critical health notifications
- [ ] **Pet Social Network**: Connect with other pet owners
- [ ] **AI Health Analysis**: Advanced health monitoring with AI

## 📁 Project Structure

```
PawfectPal/
├── backend/                    # FastAPI backend
│   ├── main.py                # API server entry point
│   ├── models/                # Database models
│   │   ├── pet.py            # Pet data model
│   │   ├── task.py           # Task data model
│   │   ├── user.py           # User authentication model
│   │   ├── medical_record.py # Medical records model
│   │   └── vaccination.py    # Vaccination tracking
│   ├── schemas/               # Pydantic schemas
│   ├── routers/               # API endpoints
│   ├── auth/                  # Authentication utilities
│   ├── dependencies/          # FastAPI dependencies
│   ├── config.py              # Configuration settings
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Feature-based organization
│   │   │   ├── auth/         # Authentication features
│   │   │   ├── pets/         # Pet management
│   │   │   ├── tasks/        # Task management
│   │   │   └── settings/     # App settings
│   │   ├── services/          # API and external services
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx            # Main app component
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                   # This file
```

## 🐛 Known Issues & Limitations

### **Current Limitations**
- **Mobile App**: Currently web-only, mobile app planned for future
- **Real-time Updates**: Chat works but no WebSocket implementation yet
- **Offline Mode**: Basic offline support planned
- **Push Notifications**: Requires mobile app for full functionality

### **Development Notes**
- Backend runs on PostgreSQL in production (Railway)
- Firebase Remote Config requires internet connection for initial setup
- Some external APIs (breed data) may have rate limits
- File uploads are fully functional with image preview and management

## 🧪 Testing

### Backend Testing
```bash
cd backend
# Run with auto-reload for development
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Check API documentation
# Visit: http://127.0.0.1:8000/docs
```

### Frontend Testing
```bash
cd frontend
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

### Production Deployment (Railway)
The application is currently deployed on Railway with the following setup:

1. **Backend**: FastAPI application with PostgreSQL database
2. **Frontend**: React application built with Vite
3. **Database**: PostgreSQL with Alembic migrations
4. **File Storage**: Local file storage for uploaded images
5. **Environment**: Production environment variables configured

### Local Development
1. Clone the repository
2. Set up backend with virtual environment
3. Configure environment variables
4. Run database migrations
5. Start both frontend and backend servers

### Deployment Commands
```bash
# Backend deployment (Railway)
git push origin mergedPlatform

# Frontend deployment (Railway)
npm run build
git add dist/
git commit -m "Deploy frontend build"
git push origin mergedPlatform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch from `mergedPlatform`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **FastAPI** for the modern Python web framework
- **React Team** for the amazing frontend library
- **Material-UI** for beautiful UI components
- **Vite** for fast development experience
- **Firebase** for remote configuration and services

---

**PawfectPal** - Making pet care easier, one paw at a time! 🐾

*Last updated: January 2025 - Production Ready* 