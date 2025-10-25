# 🐾 PawfectPal  

> A comprehensive pet care management platform that helps pet owners track their pets' health, schedule vet visits, and connect with pet care services.

---

## 🌐 Live Demo  https://pawfectpal-production-2f07.up.railway.app/auth
🚀 **Try it here:** [https://pawfectpal-production-2f07.up.railway.app](https://pawfectpal-production-2f07.up.railway.app)

---

## 🎥 Demo Video  

[![Watch the Demo](frontend/public/PawFectPal_thumbnail.png)](https://youtu.be/4o4uWqYNfxs)  
*Click the thumbnail to watch the full demo on YouTube!*

---

## ✨ Features

- 🐶 **Pet Profiles** – Create and manage detailed profiles for all your pets  
- 💉 **Health Tracking** – Monitor vaccinations, medications, and vet visits  
- 🏥 **Vet Connect** – Find and book appointments with local veterinarians  
- 🤖 **AI Assistant** – Get personalized pet care advice powered by Google’s Gemini AI  
- 📱 **Mobile-Friendly** – Responsive design works on all devices  
- 🔒 **Secure Authentication** – JWT-based auth with Google OAuth support  
- 💬 **Real-time Chat** – Message your vet or pet service providers directly  
- 📊 **Health Analytics** – Track weight and health metrics over time  

---

## 🛠️ Tech Stack

### 🐍 Backend
- **FastAPI** – Modern, fast web framework  
- **PostgreSQL** – Relational database  
- **SQLAlchemy** – ORM for database operations  
- **Alembic** – Database migrations  
- **Google Gemini AI** – For AI-powered pet care advice  
- **JWT** – Secure authentication  

### ⚛️ Frontend
- **React (Vite)** – Frontend framework  
- **TypeScript** – Type-safe JavaScript  
- **Material-UI (MUI)** – UI component library  
- **React Query** – Data fetching and state management  
- **React Hook Form** – Form handling  
- **Date-fns** – Date utilities  

---

## 📁 Project Structure

PawfectPal/  
├── backend/  
│   ├── app/  
│   │   ├── api/           → API endpoints  
│   │   ├── core/          → Core configurations  
│   │   ├── crud/          → Database operations  
│   │   ├── models/        → SQLAlchemy models  
│   │   ├── schemas/       → Pydantic models  
│   │   └── services/      → Business logic  
│   ├── tests/             → Backend tests  
│   └── alembic/           → Database migrations  
│  
├── frontend/  
│   ├── public/            → Static files  
│   └── src/  
│       ├── components/    → Reusable components  
│       ├── pages/         → Page components  
│       ├── services/      → API services  
│       ├── types/         → TypeScript types  
│       └── utils/         → Helper functions  

---

## 🚀 Getting Started

### 🧩 Prerequisites

- **Node.js** 18+ (LTS recommended)  
- **Python** 3.11+  
- **PostgreSQL** 14+  

### ⚙️ Environment Setup

1️⃣ **Clone the repository**  
git clone https://github.com/your-username/PawfectPal.git  
cd PawfectPal  

2️⃣ **Set up backend**  
cd backend  
python -m venv venv  
source venv/bin/activate  (Windows: .\venv\Scripts\activate)  
pip install -r requirements.txt  

3️⃣ **Set up frontend**  
cd ../frontend  
npm install  

---

## 🔐 Configuration

### Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/pawfectpal  
SECRET_KEY=your-secret-key  
GOOGLE_CLIENT_ID=your-google-client-id  
GOOGLE_CLIENT_SECRET=your-google-client-secret  
GEMINI_API_KEY=your-gemini-api-key  
ENVIRONMENT=development  

### Frontend (.env)
VITE_API_URL=http://localhost:8000  
VITE_GOOGLE_CLIENT_ID=your-google-client-id  

---

## 🧠 Running Locally

1️⃣ **Start the backend**  
uvicorn app.main:app --reload  

2️⃣ **Start the frontend**  
cd frontend  
npm run dev  

---

## ☁️ Deployment

The application is deployed on **Railway**.  
To deploy your own instance:  

1. Fork this repository  
2. Create a new Railway project  
3. Connect your GitHub repository  
4. Add the required environment variables  
5. Deploy!  

---

## 🧪 Testing

**Backend Tests**  
cd backend  
pytest  

---

## 📄 License

This project is licensed under the **MIT License** – see the LICENSE file for details.

---

## 💌 Contact

For questions or support, please open an issue on GitHub or contact us at:  
📧 [your-email@example.com](mailto:your-email@example.com)

---

## ❤️ Made With Love

Built by  
👨‍💻 [**Bar Muller Nir**](https://github.com/barnir16) &  
👨‍💻 [**Dvir Manos**](https://github.com/zoroflamingo)

> **PawfectPal** – Making pet care easier, one paw at a time! 🐕‍🦺
