# Environment Setup Guide (Legacy)

⚠️ **DEPRECATED**: This guide is for legacy environment variable setup. 

🚀 **RECOMMENDED**: Use Firebase Remote Config instead! See `FIREBASE_CONFIG_SETUP.md` for the new centralized configuration system.

---

This file contains instructions for setting up environment variables for PawfectPal (legacy method).

## Required Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000

# Google OAuth Configuration (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Environment
VITE_ENVIRONMENT=development
```

## Google OAuth Setup (Optional)

If you want to enable Google Sign-In:

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen if needed
6. Select "Web application" as application type
7. Add authorized origins:
   - `http://localhost:5173` (for Vite dev server)
   - `http://127.0.0.1:5173`
   - Your production domain
8. Copy the Client ID

### 2. Configure Environment Variable

Add your Google Client ID to `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

### 3. Restart Development Server

After adding environment variables, restart your development server:

```bash
npm run dev
```

## Notes

- **Google Sign-In is optional**: The app will work without it. The Google Sign-In button will only appear if `VITE_GOOGLE_CLIENT_ID` is configured.
- **Environment Variables**: Make sure to prefix all environment variables with `VITE_` for Vite to include them in the build.
- **Security**: Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

## Development vs Production

### Development
Use `.env.local` for local development environment variables.

### Production
Set environment variables directly in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment Variables
- Docker: Use docker-compose environment section

## Testing Configuration

To test if environment variables are loaded correctly:

1. Open browser developer tools
2. Go to Console
3. Type: `import.meta.env`
4. You should see your VITE_ variables listed

## Troubleshooting

**Google Sign-In not appearing?**
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the development server after adding the variable
- Check browser console for any errors

**API calls failing?**
- Verify `VITE_API_BASE_URL` points to your running backend server
- Ensure backend server is running on the specified port
