# PawfectPal 🐾

A comprehensive pet care management platform built with **React Native + Expo** (frontend) and **FastAPI + SQLAlchemy** (backend).

## 🚀 Features

### Core Features
- **Pet Management**: Add, edit, and manage pet profiles with detailed information
- **Task Scheduling**: Create and manage pet care tasks with reminders
- **GPS Tracking**: Real-time location tracking for pets (requires expo-location)
- **Image Upload**: Upload pet photos and task attachments
- **Service Booking**: Book pet care services (walking, sitting, grooming, etc.)
- **Vaccine Tracking**: Manage vaccination schedules and records
- **AI Assistant**: Integrated AI assistant for pet care advice

### Technical Features
- **Cross-Platform**: Works on iOS, Android, and Web
- **JWT Authentication**: Secure user authentication
- **AsyncStorage**: Persistent data storage for React Native
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Basic offline functionality
- **Multi-language**: Support for English and Hebrew

## 🛠️ Technology Stack

### Frontend
- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **AsyncStorage** for data persistence
- **Expo Vector Icons** for UI icons

### Backend
- **FastAPI** for API development
- **SQLAlchemy** for database ORM
- **SQLite** for database storage
- **JWT** for authentication
- **Pydantic** for data validation
- **Python 3.11+**

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/barnir16/pawfectpal.git
cd pawfectpal
```

### 2. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Start the backend server
python main.py
```

The backend will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npm start
```

### 4. Access the Application
- **Web**: Open `http://localhost:8081` in your browser
- **Mobile**: Scan the QR code with Expo Go app
- **Emulator**: Press `a` for Android or `i` for iOS

## 🔧 Configuration

### API Configuration
Edit `frontend/src/config.ts` to configure API endpoints:

```typescript
export const API_CONFIG = {
  LOCAL: 'http://127.0.0.1:8000',        // Local development
  DEVICE: 'http://192.168.1.100:8000',   // Physical device (change IP)
  PRODUCTION: 'https://your-api.com',     // Production
};
```

### Environment Variables
Create `.env` files for environment-specific settings:

**Backend** (optional):
```env
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./pawfectpal.db
```

## 📱 Usage

### Authentication
1. Register a new account or login with existing credentials
2. JWT tokens are automatically stored and managed

### Pet Management
1. Navigate to the "Pets" tab
2. Tap "Add Pet" to create a new pet profile
3. Fill in pet details (name, breed, birth date, etc.)
4. Add health and behavior issues if needed
5. Upload a photo of your pet

### Task Management
1. Navigate to the "Tasks" tab
2. Tap "Add Task" to create a new task
3. Set task details (title, description, date/time)
4. Assign pets to the task
5. Set repeat intervals if needed

### GPS Tracking
1. Enable tracking for pets in their profile
2. Use the location tracking features (requires expo-location)
3. View location history and calculate distances

## 🐛 Troubleshooting

### Common Issues

**Metro Bundler Warnings**
- ✅ Fixed: Package version mismatches resolved
- ✅ Updated: `react-native-safe-area-context` to `5.4.0`
- ✅ Updated: `react-native-screens` to `~4.11.1`

**Authentication Issues**
- Ensure backend is running on the correct port
- Check API configuration in `frontend/src/config.ts`
- Verify network connectivity

**Image Upload Issues**
- Requires expo-image-picker for full functionality
- Currently using placeholder implementation
- Implement with actual image picker library

**GPS Tracking Issues**
- Requires expo-location for full functionality
- Currently using placeholder implementation
- Install: `expo install expo-location`

**Database Issues**
- Ensure SQLite is properly initialized
- Check file permissions for database file
- Verify virtual environment is activated

### Development Tips

**Backend Development**
```bash
# Activate virtual environment
venv\Scripts\activate

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Check API documentation
# Visit: http://127.0.0.1:8000/docs
```

**Frontend Development**
```bash
# Clear Metro cache
npx expo start --clear

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

## 📁 Project Structure

```
PawfectPal/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── models.py           # Database models
│   ├── database.py         # Database setup
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # Uploaded files
├── frontend/              # React Native frontend
│   ├── App.tsx           # Main app component
│   ├── src/
│   │   ├── api.ts        # API client
│   │   ├── types.ts      # TypeScript types
│   │   ├── config.ts     # Configuration
│   │   ├── AuthScreen.tsx
│   │   ├── PetForm.tsx
│   │   ├── PetList.tsx
│   │   ├── TaskForm.tsx
│   │   ├── components/   # Reusable components
│   │   └── utils/        # Utility functions
│   ├── package.json      # Node.js dependencies
│   └── assets/          # Images and fonts
├── uploads/             # Shared uploads directory
└── README.md           # This file
```

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Server-side and client-side validation
- **SQL Injection Protection**: SQLAlchemy ORM protection

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Deploy to cloud platform (Heroku, AWS, etc.)
4. Update API configuration in frontend

### Frontend Deployment
1. Build for production: `expo build`
2. Deploy to app stores or web
3. Update API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Expo** for the amazing React Native development platform
- **FastAPI** for the modern Python web framework
- **React Navigation** for navigation solutions
- **SQLAlchemy** for database ORM

---

**PawfectPal** - Making pet care easier, one paw at a time! 🐾 