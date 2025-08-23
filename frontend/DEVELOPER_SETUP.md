# 🚀 Developer Setup Guide - PawfectPal

## Quick Start (No Environment Variables Needed!)

### 1. Clone the Repository
```bash
git clone https://github.com/barnir16/PawfectPal.git
cd PawfectPal
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend (in another terminal)
cd ../backend
python -m venv venv
venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 3. Start the Backend
```bash
cd backend
python main.py
```
Backend will run at: `http://127.0.0.1:8000`

### 4. Start the Frontend
```bash
cd frontend
npm run dev
```
Frontend will run at: `http://localhost:5173`

## 🔑 Configuration (Already Set Up!)

**Good news!** All configuration is already set up and ready to go:

- ✅ **Firebase API Keys** - Already configured and safe to expose
- ✅ **Backend API** - Points to localhost:8000
- ✅ **Feature Flags** - All enabled by default
- ✅ **External APIs** - Can be configured via Firebase Remote Config

## 🎯 What's Working Now

- **Authentication** - User login/register
- **Pet Management** - Add, edit, view pets
- **Task Management** - Create and track pet care tasks
- **AI Chatbot** - Pet care advice assistant
- **Medical Records** - Vaccination and health tracking

## 🚧 What to Work On Next

### **Week 1: Complete Core Features**
- [ ] **Image Upload** - Complete file upload functionality
- [ ] **Notifications** - Basic reminder system
- [ ] **Chatbot Polish** - Better AI responses

### **Week 2: Service Provider Platform**
- [ ] **Service Models** - Walker, sitter, groomer profiles
- [ ] **Booking System** - Service scheduling
- [ ] **Provider Dashboard** - Management interface

### **Week 3: Mobile App**
- [ ] **React Native** - iOS/Android apps
- [ ] **Push Notifications** - Mobile notifications
- [ ] **App Store Prep** - Ready for submission

## 🔧 Development Tips

### **Adding New Features**
1. **Frontend**: Add components in `src/features/`
2. **Backend**: Add models in `backend/models/`
3. **API**: Add routes in `backend/routers/`
4. **Types**: Add TypeScript types in `src/types/`

### **Testing Changes**
- **Frontend**: Changes auto-reload at `localhost:5173`
- **Backend**: API docs at `http://127.0.0.1:8000/docs`
- **Database**: SQLite file at `backend/pawfectpal.db`

### **Common Commands**
```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build

# Backend
python main.py       # Start server
uvicorn main:app --reload  # Auto-reload server
```

## 🌐 Firebase Remote Config

For production settings, use Firebase Remote Config:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `pawfectpal-ac5d7`
3. Navigate to Remote Config
4. Add parameters for API keys, feature flags, etc.

## 🤝 Team Collaboration

- **Shared Config**: All developers use the same `shared.ts` file
- **No .env Files**: Configuration is centralized and shared
- **Firebase Access**: Share Firebase project access with team members
- **Git Workflow**: Use feature branches from `prototype`

## 🆘 Need Help?

- **Documentation**: Check `README.md` and `FIREBASE_CONFIG_SETUP.md`
- **API Docs**: Visit `http://127.0.0.1:8000/docs` when backend is running
- **Issues**: Create GitHub issues for bugs or feature requests

---

**Happy coding! 🐾** 

The app should work immediately after following these steps. No environment variables or complex setup required!
