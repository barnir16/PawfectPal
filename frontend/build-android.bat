@echo off
echo Building PawfectPal Android APK...

echo Step 1: Building web assets...
call npm run build

echo Step 2: Copying web assets to Android...
if exist android\app\src\main\assets\public rmdir /s /q android\app\src\main\assets\public
xcopy dist android\app\src\main\assets\public /E /I

echo Step 3: Opening Android Studio...
echo Please build the APK in Android Studio:
echo 1. Open the 'android' folder in Android Studio
echo 2. Wait for Gradle sync to complete
echo 3. Go to Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo 4. The APK will be created in android\app\build\outputs\apk\debug\

start android
