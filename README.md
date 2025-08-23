# PawfectPal 🐾

A comprehensive pet care management platform built with **React + TypeScript + Vite** (frontend) and **FastAPI + SQLAlchemy** (backend).

## 🚀 Current Status: **PROTOTYPE PHASE** 🚧

This project is currently in active development with a working prototype that demonstrates core functionality. The app has been completely overhauled with modern architecture and improved features.

## ✨ What's Working Now

### ✅ **Completed Features**
- **Modern React Architecture**: Clean, component-based structure with TypeScript
- **Authentication System**: JWT-based auth with Google OAuth support
- **Pet Management**: Full CRUD operations for pet profiles
- **Task Management**: Create, edit, and track pet care tasks
- **Medical Records**: Track vaccinations and medical history
- **AI Integration**: Gemini AI chatbot for pet care advice
- **Responsive UI**: Material-UI components with modern design
- **API Integration**: Robust backend communication with error handling

### 🔧 **Technical Infrastructure**
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: FastAPI + SQLAlchemy + SQLite + JWT Auth
- **State Management**: React Context + Custom Hooks
- **API Layer**: Centralized service architecture
- **Configuration**: Firebase Remote Config integration
- **Type Safety**: Comprehensive TypeScript definitions

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
- **SQLite** for development database
- **JWT** for secure authentication
- **Pydantic** for data validation
- **Python 3.11+** with async support

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
- [ ] **User Profile Management**: Edit user details, preferences
- [ ] **Notification System**: Push notifications for tasks and reminders
- [ ] **Image Upload**: Complete file upload functionality
- [ ] **Offline Support**: Basic offline data caching
- [ ] **Data Export**: Export pet data to PDF/CSV

### **Medium Priority**
- [ ] **Multi-language Support**: Hebrew and English localization
- [ ] **Advanced Search**: Filter pets and tasks
- [ ] **Data Backup**: Cloud backup and sync
- [ ] **Social Features**: Share pet profiles, community features
- [ ] **Analytics**: Pet health trends and insights

### **Future Enhancements**
- [ ] **GPS Tracking**: Real-time pet location (requires mobile app)
- [ ] **Service Booking**: Integration with pet care services
- [ ] **Vet Integration**: Direct communication with veterinarians
- [ ] **Emergency Alerts**: Critical health notifications
- [ ] **Pet Social Network**: Connect with other pet owners

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
- **Image Upload**: Placeholder implementation, needs file upload service
- **Mobile App**: Currently web-only, mobile app planned for future
- **Real-time Updates**: No WebSocket implementation yet
- **Offline Mode**: Basic offline support planned

### **Development Notes**
- Backend runs on SQLite for development (PostgreSQL recommended for production)
- Firebase Remote Config requires internet connection for initial setup
- Some external APIs (breed data) may have rate limits

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

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Deploy to cloud platform (Heroku, AWS, DigitalOcean, etc.)
4. Update Firebase Remote Config with production API URL

### Frontend Deployment
1. Build for production: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, GitHub Pages, etc.)
3. Configure Firebase Remote Config for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch from `prototype`
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

*Last updated: December 2024 - Prototype Phase* 