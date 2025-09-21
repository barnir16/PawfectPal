# 🚀 PawfectPal Deployment Guide

## Railway Deployment Steps

### 1. Backend Service Configuration

**Environment Variables to set in Railway:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/pawfectpal
SECRET_KEY=your-super-secret-key-change-this-in-production
CORS_ORIGINS=https://your-frontend-domain.railway.app
ENVIRONMENT=production
DEBUG=false
```

**Build Command:**
```
cd backend && pip install -r requirements.txt
```

**Start Command:**
```
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2. Frontend Service Configuration

**Environment Variables to set in Railway:**
```
VITE_API_BASE_URL=https://your-backend-service.railway.app
VITE_APP_NAME=PawfectPal
VITE_ENVIRONMENT=production
```

**Build Command:**
```
cd frontend && npm ci && npm run build
```

**Start Command:**
```
cd frontend && npm run preview -- --host 0.0.0.0 --port $PORT
```

### 3. Database Setup

Railway will automatically create a PostgreSQL database. You'll need to:

1. **Get the DATABASE_URL** from Railway dashboard
2. **Update your backend environment variables** with the real DATABASE_URL
3. **Run database migrations** (if needed)

### 4. Custom Domain (Optional)

1. Go to Railway dashboard → Settings → Domains
2. Add your custom domain
3. Update CORS_ORIGINS to include your custom domain

## Testing Your Deployment

1. **Backend Health Check:** `https://your-backend.railway.app/health`
2. **Frontend:** `https://your-frontend.railway.app`
3. **API Docs:** `https://your-backend.railway.app/docs`

## Troubleshooting

### Common Issues:
- **CORS errors:** Update CORS_ORIGINS with your frontend URL
- **Database connection:** Check DATABASE_URL format
- **Build failures:** Check Node.js/Python versions in Railway

### Logs:
- Check Railway dashboard → Deployments → View Logs
- Backend logs: Python/FastAPI errors
- Frontend logs: Build/startup errors

## Next Steps After Deployment

1. **Test all features:**
   - User registration/login
   - Pet management
   - Service requests
   - Chat functionality

2. **Set up monitoring:**
   - Railway provides basic monitoring
   - Consider adding Sentry for error tracking

3. **Share with testers:**
   - Send frontend URL to beta testers
   - Collect feedback and iterate

## Cost Estimation

- **Free Tier:** $0/month (750 hours)
- **Hobby Plan:** $5/month (unlimited hours)
- **Pro Plan:** $20/month (better performance)

Start with free tier, upgrade as needed!
