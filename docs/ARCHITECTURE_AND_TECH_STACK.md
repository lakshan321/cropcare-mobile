# System Architecture & Technology Stack Justification

**Project:** CropCare Mobile Application  
**Course:** IT3060 Human Computer Interaction — Milestone 03  
**Group:** WE_178  

---

## 1. Technology Stack Selection & Justification

The CropCare system was designed to meet strict mobile usability, cross-platform performance, data persistence, and security requirements.

### 1.1 Mobile Client
- **Framework:** React Native with Expo SDK 52.
  - *Justification:* Cross-platform code sharing across Android and iOS with native camera, photo gallery, and hardware security access. Expo Router provides file-based routing matching modern production standards.
- **Language:** TypeScript (Strict Mode).
  - *Justification:* Compile-time type safety preventing runtime null/undefined pointer errors, ensuring reliable form validation and API contract compliance.
- **Security:** `expo-secure-store` with encrypted keychain/keystore token storage.
  - *Justification:* Prevents access token theft via mobile storage inspection.
- **Camera & Photos:** `expo-image-picker`.
  - *Justification:* Handles runtime Android/iOS camera and media library permissions, image compression, and file-size validation (<5 MB).

### 1.2 Backend API & Runtime
- **Runtime:** Node.js (v22 LTS).
  - *Justification:* High-throughput asynchronous event-driven I/O ideal for handling image uploads, concurrent consultations, and REST APIs.
- **Web Framework:** Express.js with TypeScript (`tsx`).
  - *Justification:* Mature middleware ecosystem (CORS, Multer, Zod, JWT) offering predictable request pipelines and centralized error management.
- **Authentication:** JSON Web Tokens (JWT) with bcryptjs (10 salt rounds).
  - *Justification:* Stateless authentication with expiring access tokens, role claims verified server-side on every protected endpoint.

### 1.3 Database & Storage
- **Database:** MongoDB with Mongoose ODM.
  - *Justification:* Flexible document model naturally supporting nested structures (e.g. audit trails, care task lists, private working drafts, and botanical symptom arrays) without awkward relational joins.
  - *Resilience:* Connected via Mongoose with automatic fallback to embedded in-memory database (`mongodb-memory-server`) during local development and testing, ensuring seamless zero-config evaluation.
- **File Storage:** Local uploads directory behind a modular abstraction layer, readily replaceable by cloud object storage (e.g., AWS S3 / Cloudinary).

---

## 2. Pluggable Disease Diagnosis Engine Architecture

CropCare incorporates an interchangeable disease-provider design pattern (`IDiagnosisProvider`):

```
                   +----------------------------------+
                   |    IDiagnosisProvider Interface  |
                   |  - name: string                  |
                   |  - isMock: boolean               |
                   |  - analyzeImage(path, hint): Res |
                   +----------------------------------+
                                     ^
                                     |
               +---------------------+---------------------+
               |                                           |
+-------------------------------+           +-------------------------------+
|     MockDiagnosisProvider     |           |     RealDiagnosisProvider     |
| - Accurate botanical symptoms |           | - Calls FastAPI / PyTorch svc |
| - Labelled: isMock = true     |           | - Environment URL & API key   |
| - Zero external dependencies  |           | - Labelled: isMock = false    |
+-------------------------------+           +-------------------------------+
```

### Pluggable Modes
1. **Mock Diagnosis Provider (Default):**
   - Employs realistic botanical disease pathology datasets for Tomato (Early Blight, Healthy Crop), Paddy Rice (Blast), Chilli (Anthracnose), and Potato (Late Blight).
   - Provides realistic symptoms, underlying fungal causes, organic remedies, chemical guidance, and prevention tips.
   - **Critical Transparency:** Explicitly labels results with `isMock: true` and a visible `SIMULATED BOTANICAL PREDICTION (DEMO)` badge in the mobile UI.
2. **Real Inference Service Integration:**
   - To activate real AI model predictions, set in `backend/.env`:
     ```env
     DIAGNOSIS_PROVIDER=real
     REAL_PREDICTION_API_URL=http://localhost:8000/predict
     REAL_PREDICTION_API_KEY=your_optional_api_key
     ```
   - Accepts multipart image requests and returns real model confidence scores and bounding boxes.

---

## 3. Security & Role Authorization Architecture

### 3.1 Single Shared Login Screen
- Both **Farmers** and **Agricultural Officers** log in through the **same single login screen**.
- The login request transmits only `{ username, password }`—there is **no role selector** on the client form.
- The server authenticates credentials against the database and injects the verified role (`farmer` or `officer`) into the signed JWT token.
- Mobile client inspects the decoded role and routes:
  - Role `'farmer'` → Navigates to `/(farmer)` Home.
  - Role `'officer'` → Navigates to `/(officer)/dashboard`.

### 3.2 Server-Side Permission Enforcement
- Hiding UI buttons is insufficient. The backend enforces `requireRole('officer')` on all `/api/officer/*` and `/api/analytics/*` routes.
- Public registration (`POST /api/auth/register`) hardcodes `role: 'farmer'`. Any role submitted in the request body is strictly ignored.
- Officer accounts are provisioned exclusively through protected development seeding (`npm run seed`).

### 3.3 Data Isolation (Private Drafts)
- When an officer saves a private review draft, it is stored in `consultation.privateDraft`.
- Farmer consultation endpoints (`GET /api/consultations/my` and `GET /api/consultations/:id`) explicitly delete `privateDraft` before serialization, ensuring private working drafts are completely invisible to farmers until published.

---

## 4. Offline & Connectivity Strategy

1. **Cached History:** Saved diagnoses and user preferences are persisted in local device storage for immediate access even when disconnected.
2. **Idempotency Protection:** Consultation requests include client-generated keys and recent duplicate checks (60-second window) to prevent accidental double submissions on mobile network retries.
3. **Session Expiry Handling:** 401 Unauthorized API responses trigger automatic SecureStore token cleanup and route the user cleanly back to the shared login form with descriptive guidance.
4. **State Transition Enforcement:** Case progression strictly validates allowed transitions:
   `Submitted` → `In Review` → `Resolved`.
   Withdrawal transitions `Resolved` → `In Review` with mandatory audit trail logging.
