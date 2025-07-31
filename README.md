# PawfectPal 🐾

A universal pet care management platform that connects pet owners with pet care providers. Built with FastAPI backend and React Native frontend for cross-platform support (Web, Android, iOS).

## 🎯 Project Goals

Transform **PawfectPlanner** (Kotlin pet management app) into **PawfectPal** - a comprehensive pet care service platform that:

- **Manages Pets**: Complete pet profiles with health tracking
- **Schedules Tasks**: Pet care reminders and activities
- **Tracks Location**: Real-time GPS tracking during services
- **Connects Providers**: Pet walkers, sitters, groomers, vets
- **Documents Services**: Photo uploads and service reports
- **Supports Multi-Platform**: Web, Android, iOS

## 🚀 Features

### ✅ Implemented
- **Authentication**: JWT-based user registration/login
- **Pet Management**: Complete CRUD with health/behavior tracking
- **Task Scheduling**: Recurring tasks with vaccine suggestions
- **GPS Tracking**: Real-time location updates and history
- **Image Upload**: Pet photos and task attachments
- **Service Booking**: Walking, sitting, boarding, grooming, veterinary
- **AI Assistant**: Simulated Gemini-powered chat interface
- **Multi-language**: English/Hebrew support
- **Dark Mode**: Theme switching
- **Push Notifications**: Service updates and reminders
- **External APIs**: Dog/Cat breed information integration

### 🔄 In Progress
- **Provider Profiles**: Service provider registration
- **Service Discovery**: Search and filter providers
- **Payment Integration**: Stripe/PayPal processing
- **Real-time Chat**: Provider-owner communication

### 📋 Planned
- **WhatsApp Integration**: Provider-owner messaging
- **Vet Integration**: Medical record sharing
- **Pet Store Integration**: Food/toy ordering
- **Analytics Dashboard**: Usage tracking and reporting

## 🏗️ Architecture

### Backend (FastAPI + SQLAlchemy)
```
backend/
├── main.py              # FastAPI application
├── models.py            # Database models
├── database.py          # Database configuration
├── requirements.txt     # Python dependencies
└── uploads/            # Image storage
```

### Frontend (React Native + Expo)
```
frontend/
├── src/
│   ├── types.ts         # TypeScript definitions
│   ├── api.ts           # API client
│   ├── components/      # React components
│   ├── utils/           # Utility functions
│   └── vaccines.ts      # Static vaccine data
├── App.tsx              # Main application
└── package.json         # Node.js dependencies
```

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Development database (PostgreSQL for production)
- **JWT**: Authentication tokens
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform
- **TypeScript**: Type safety
- **React Navigation**: Navigation system
- **AsyncStorage**: Local data persistence

### External Services
- **The Dog API**: Breed information
- **The Cat API**: Breed information
- **Google Gemini**: AI assistant (simulated)

## 📦 Installation

### Prerequisites
- Python 3.11+ (FastAPI compatibility)
- Node.js 18+ and npm
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PawfectPal
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend**
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://127.0.0.1:8000`
API documentation at `http://127.0.0.1:8000/docs`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on different platforms**
   ```bash
   # Web
   npm run web
   
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./pawfectpal.db

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# External APIs
DOG_API_KEY=your-dog-api-key
CAT_API_KEY=your-cat-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### API Keys
- **The Dog API**: Free tier available at https://thedogapi.com/
- **The Cat API**: Free tier available at https://thecatapi.com/
- **Google Gemini**: Available at https://ai.google.dev/

## 📱 Usage

### Authentication
1. Register a new account
2. Login with username/password
3. JWT token is automatically stored

### Pet Management
1. Add pets with photos and health information
2. Enable GPS tracking for real-time location
3. View location history and activity

### Task Scheduling
1. Create tasks with descriptions and schedules
2. Assign tasks to specific pets
3. Get vaccine suggestions based on pet type

### Service Booking
1. Browse available service providers
2. Book walking, sitting, boarding, grooming, or veterinary services
3. Track service progress and location
4. Upload before/after photos

### GPS Tracking
1. Enable tracking for pets
2. View real-time location updates
3. Review location history and routes
4. Calculate distance traveled

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Pydantic models for data validation
- **File Upload Security**: Type checking and size limits

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /token` - User login

### Pets
- `GET /pets` - Get user's pets
- `POST /pets` - Create new pet
- `PUT /pets/{id}` - Update pet
- `DELETE /pets/{id}` - Delete pet

### GPS Tracking
- `POST /pets/{id}/location` - Update pet location
- `GET /pets/{id}/location-history` - Get location history

### Image Upload
- `POST /upload/pet-image/{id}` - Upload pet photo
- `POST /upload/task-attachment/{id}` - Upload task attachment

### Services
- `GET /services` - Get user's services
- `POST /services` - Create service booking

### Tasks
- `GET /tasks` - Get user's tasks
- `POST /tasks` - Create new task

### Vaccines
- `GET /vaccines` - Get all vaccines
- `GET /age_restrictions` - Get age restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔮 Roadmap

### Phase 1: Core Platform ✅
- [x] User authentication
- [x] Pet management
- [x] Task scheduling
- [x] GPS tracking
- [x] Image upload

### Phase 2: Service Marketplace 🚧
- [ ] Provider profiles
- [ ] Service discovery
- [ ] Booking system
- [ ] Payment integration

### Phase 3: Advanced Features 📋
- [ ] Real-time chat
- [ ] WhatsApp integration
- [ ] Vet integration
- [ ] Analytics dashboard

### Phase 4: Business Features 📋
- [ ] Provider verification
- [ ] Insurance integration
- [ ] Pet store integration
- [ ] Emergency contacts

---

**PawfectPal** - Making pet care easier, one paw at a time! 🐾 