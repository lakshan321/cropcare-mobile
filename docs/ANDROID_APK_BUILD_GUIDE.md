# Android Physical Device Setup & APK Build Guide

**Project:** CropCare Mobile Application  
**Course:** IT3060 Human Computer Interaction — Group WE_178  

---

## 1. Connecting a Physical Android Device to the Local Backend

When testing CropCare on a physical Android smartphone or tablet, **the device cannot connect to `http://localhost:5000`**, because `localhost` on the phone refers to the phone itself. Instead, the phone must communicate with the computer hosting the Node.js backend over your local Wi-Fi / Local Area Network (LAN).

### Step 1: Confirm Your Computer's LAN IP Address
Open PowerShell and run:
```powershell
ipconfig
```
Look for your active **Wireless LAN adapter Wi-Fi** IPv4 Address:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.27
```
*(Your machine's current local IP is **`192.168.1.27`**).*

### Step 2: Ensure Both Devices are on the Same Wi-Fi Network
Connect your Android phone to the same Wi-Fi network/router as your computer.

### Step 3: Configure `mobile/.env`
In `mobile/.env`, set the API URL to your computer's LAN IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.27:5000
```

### Step 4: Start the Backend on Host `0.0.0.0`
The CropCare backend server is already configured in `backend/src/server.ts` to listen on `0.0.0.0`, allowing incoming LAN connections from physical devices:
```bash
cd backend
npm run dev
```

*(Note: If the phone cannot connect, verify that Windows Defender Firewall allows incoming connections on port 5000, or temporarily allow Node.js through the firewall).*

### Step 5: Run the Mobile App on Physical Device via Expo Go
1. Install **Expo Go** from Google Play Store on your Android phone.
2. In your terminal:
   ```bash
   cd mobile
   npx expo start
   ```
3. Scan the generated terminal QR code with the Expo Go app.
4. The mobile application will load on your device and communicate with `http://192.168.1.27:5000`.

---

## 2. Generating a Standalone Android APK Build

To generate an installable standalone `.apk` file that does not depend on Expo Go, follow these steps using EAS (Expo Application Services):

### Option A: Cloud APK Build with EAS (Recommended)
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log into your free Expo account:
   ```bash
   eas login
   ```
3. Initialize project with EAS:
   ```bash
   cd mobile
   eas build:configure
   ```
4. Configure `eas.json` for APK generation:
   ```json
   {
     "cli": {
       "version": ">= 12.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "http://192.168.1.27:5000"
         }
       },
       "production": {}
     }
   }
   ```
5. Trigger the standalone APK build:
   ```bash
   eas build -p android --profile preview
   ```
6. Once the cloud build completes, EAS provides a direct download link for the installable `.apk` file.

### Option B: Local Android Build with Android Studio
If you have Android Studio and the Android SDK installed locally:
1. Generate the native Android project folder:
   ```bash
   cd mobile
   npx expo run:android
   ```
2. Build the debug APK directly:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
3. The resulting APK will be located at:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
