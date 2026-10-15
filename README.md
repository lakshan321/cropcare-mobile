# CropCare — WE_178 Mobile Application (IT3060 Milestone 03)

CropCare is an intelligent mobile application designed to assist smallholder farmers in diagnosing crop diseases, receiving treatment guidance, and requesting expert assistance from Agricultural Extension Officers.

---

## 👥 Group WE_178 Workload & Responsibilities

| Member | Student ID | Workload & Feature Responsibilities |
| :--- | :--- | :--- |
| **Ameen F.A.** | **IT21377730** | **Member 1:** Farmer Home Dashboard, Camera & Gallery Photo Capture, Guidelines, Image Preview & Retake, Image Analysis State |
| **Nirmani A.K.G.B.** | **IT22101174** | **Member 2:** Diagnosis Results & Confidence, Treatment Guidance, Plant Care Tasks CRUD, Language Preference (English, Sinhala, Tamil) |
| **Silva G.S.T.** | **IT21179358** | **Member 3:** Saved Diagnoses History, Expert Consultation Request, Farmer Case Tracking & Published Feedback |
| **Lakshan A.W.A.** | **IT22606310** | **Member 4:** Agricultural Officer Dashboard Queue, Private Drafts & Published Responses, Outbreak Analytics & CSV Export |

---

## 🔑 Development & Evaluation Credentials

CropCare features a **single shared login screen** for both Farmers and Agricultural Extension Officers. The backend determines the account role from the database upon authentication.

| Role | Username | Password | Post-Login Destination |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer_kamal` | `Farmer123!` | Navigates to **Farmer Home Dashboard** |
| **Agricultural Officer** | `officer_perera` | `Officer123!` | Navigates to **Officer Dashboard Queue** |

*(Quick autofill shortcut buttons are also provided on the mobile login screen for evaluation convenience).*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ or v22 LTS
- npm v9+

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run seed     # (Optional) Pre-populates sample cases, diagnoses, and demo accounts
npm run dev      # Starts API server on http://localhost:5000 (accessible on LAN: 0.0.0.0:5000)
```
*Note: If no external MongoDB URI is supplied, the backend automatically boots an embedded in-memory MongoDB server (`mongodb-memory-server`), ensuring zero manual database setup hurdles!*

### 2. Run Backend Automated Integration Tests
```bash
cd backend
npm test
```
*Executes all 37 integration tests across authentication, farmer features, officer workflows, and outbreak analytics with 100% pass rate.*

### 3. Start the Mobile Client
```bash
cd mobile
npm install
npm run start    # Starts Metro bundler / Expo dev server
```
- Press **`a`** to launch in an Android Emulator.
- Press **`w`** to open in a Web Browser.
- Scan the terminal QR code with **Expo Go** on a physical Android device.

---

## 🌿 Pluggable Disease Diagnosis Engine

CropCare implements an interchangeable diagnosis provider architecture (`IDiagnosisProvider`):
1. **Mock Diagnosis Engine (Default):**
   - Utilizes realistic botanical plant pathology datasets (Tomato Early Blight, Healthy Crop, Paddy Blast, Chilli Anthracnose, Potato Late Blight).
   - Generates symptoms, fungal causes, organic remedies, and chemical precautions.
   - **Critical Transparency:** Explicitly labels results with `isMock: true` and displays a visible `SIMULATED BOTANICAL PREDICTION (DEMO)` banner.
2. **Real AI Prediction Engine:**
   - Set `DIAGNOSIS_PROVIDER=real` in `backend/.env`.
   - Provide `REAL_PREDICTION_API_URL` (e.g. FastAPI / PyTorch endpoint) and `REAL_PREDICTION_API_KEY`.

---

## 📱 Physical Device LAN Connection & APK Build

When testing on a physical Android device over Wi-Fi, point `mobile/.env` to your computer's LAN IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.27:5000
```
Detailed instructions for physical device setup and standalone APK generation via EAS Build are documented in [docs/ANDROID_APK_BUILD_GUIDE.md](docs/ANDROID_APK_BUILD_GUIDE.md).

---

## 📚 Project Documentation Links

- [Group Workload Mapping](docs/WORKLOAD_MAPPING.md)
- [Requirements & CRUD Traceability Matrix](docs/REQUIREMENTS_CRUD_TRACEABILITY.md)
- [System Architecture & Tech Stack Justification](docs/ARCHITECTURE_AND_TECH_STACK.md)
- [Milestone 02 Prototype Deviation Log](docs/PROTOTYPE_DEVIATIONS.md)
- [Functional Test Matrix & Execution Results](docs/FUNCTIONAL_TEST_MATRIX.md)
- [Usability Testing Protocol & Observer Sheets](docs/USABILITY_TESTING_PROTOCOL.md)
- [Consolidated 35-Page Final Report Outline](docs/CONSOLIDATED_REPORT_OUTLINE.md)
- [Android APK Build Instructions](docs/ANDROID_APK_BUILD_GUIDE.md)
