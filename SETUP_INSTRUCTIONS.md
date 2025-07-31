# PawfectPal Setup Instructions

## Issues Fixed

### 1. Package Version Mismatches ✅
- Updated `react-native-safe-area-context` to version `5.4.0`
- Updated `react-native-screens` to version `~4.11.1`
- Added `@react-native-async-storage/async-storage` for proper React Native storage

### 2. localStorage Issues ✅
- Replaced all `localStorage` usage with `AsyncStorage`
- Created `StorageHelper` utility for consistent storage interface
- Updated all API calls to handle async token retrieval
- Fixed `LocaleHelper` to use AsyncStorage

### 3. Missing setup.bat ✅
- Created `setup.bat` for Windows users
- Created `setup.sh` for Unix/Linux/Mac users

### 4. API Configuration ✅
- Created config system for different environments
- Added support for device vs simulator API URLs

## Quick Setup

### Option 1: Use Setup Scripts

**Windows:**
```bash
setup.bat
```

**Unix/Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 2. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 3. Setup Database
```bash
cd ..
python backend/database.py
```

## Running the Application

### 1. Start Backend Server
```bash
cd backend
python main.py
```
The API will be available at `http://127.0.0.1:8000`
You can view the API documentation at `http://127.0.0.1:8000/docs`

### 2. Start Frontend
```bash
cd frontend
npm start
```

## Configuration

### API URL Configuration
If you're running on a physical device, update the API URL in `frontend/src/config.ts`:

```typescript
export const API_CONFIG = {
  LOCAL: 'http://127.0.0.1:8000',
  DEVICE: 'http://YOUR_COMPUTER_IP:8000', // Change this
  PRODUCTION: 'https://your-api-domain.com',
};
```

To find your computer's IP address:
- **Windows:** `ipconfig` in Command Prompt
- **Mac/Linux:** `ifconfig` or `ip addr` in Terminal

### Environment Variables (Optional)
For production, consider using environment variables:

```bash
# Create .env file in frontend directory
REACT_NATIVE_API_URL=http://your-api-url.com
```

## Troubleshooting

### Common Issues

1. **Metro Bundler Cache Issues**
   ```bash
   cd frontend
   npx expo start --clear
   ```

2. **Package Version Conflicts**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Backend Connection Issues**
   - Ensure backend is running on port 8000
   - Check firewall settings
   - Verify API URL in config.ts

4. **Database Issues**
   ```bash
   cd backend
   rm pawfectpal.db
   python database.py
   ```

### Development Tips

1. **For Physical Device Testing:**
   - Use your computer's IP address in config.ts
   - Ensure device and computer are on same network
   - Check firewall allows port 8000

2. **For Simulator/Emulator:**
   - Use `127.0.0.1:8000` (default)
   - No additional configuration needed

3. **Debugging:**
   - Use Expo DevTools for debugging
   - Check console logs in Expo CLI
   - Use React Native Debugger for advanced debugging

## Project Structure

```
PawfectPal/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── models.py           # Database models
│   ├── database.py         # Database setup
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Native app
│   ├── src/
│   │   ├── api.ts         # API client
│   │   ├── config.ts      # Configuration
│   │   ├── types.ts       # TypeScript types
│   │   └── utils/
│   │       ├── StorageHelper.ts  # AsyncStorage wrapper
│   │       └── LocaleHelper.ts   # Localization helper
│   └── package.json       # Node.js dependencies
├── setup.bat              # Windows setup script
├── setup.sh               # Unix setup script
└── README.md              # Project documentation
```

## Next Steps

1. **Test the application** with the setup above
2. **Configure your device IP** if testing on physical device
3. **Implement missing features** from the project summary
4. **Add proper error handling** and loading states
5. **Implement real-time features** (WebSocket, push notifications)
6. **Add payment processing** (Stripe/PayPal integration)
7. **Deploy to production** (AWS, DigitalOcean, etc.)

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all dependencies are installed correctly
3. Ensure backend server is running
4. Check network connectivity for device testing
5. Review the troubleshooting section above 