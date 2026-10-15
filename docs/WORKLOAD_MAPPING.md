# CropCare — WE_178 Group Workload & Member Responsibility Matrix

**Course:** IT3060 Human Computer Interaction  
**Milestone:** 03 — Final Implementation & Evaluation  
**Group ID:** WE_178  
**Project:** CropCare Mobile Application  

---

## 1. Member Workload Distribution

| Member # | Student Name | Student ID | Primary Assigned Interfaces & Feature Responsibilities | Key Backend Modules & Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** | **Ameen F.A.** | **IT21377730** | • Farmer Home Dashboard<br>• Camera & Gallery Photo Capture<br>• Photo Guidelines<br>• Image Preview & Retake<br>• Image Analysis Scanning State | `drafts.controller.ts`<br>`diagnosis.controller.ts`<br>`ImageDraft.ts`<br>`POST /api/drafts`<br>`GET /api/drafts/current`<br>`PUT /api/drafts/:id`<br>`DELETE /api/drafts/:id`<br>`POST /api/diagnosis/analyze` |
| **Member 2** | **Nirmani A.K.G.B.** | **IT22101174** | • Diagnosis Results View<br>• Confidence, Symptoms & Severity<br>• Treatment & Prevention Guidance<br>• Personal Action Care Tasks CRUD<br>• Language Preference (EN / SI / TA) | `careTasks.controller.ts`<br>`preferences.controller.ts`<br>`CareTask.ts`<br>`UserPreference.ts`<br>`PATCH /api/diagnosis/:id/notes`<br>`POST /api/care-tasks`<br>`GET /api/care-tasks`<br>`PATCH /api/care-tasks/:id`<br>`DELETE /api/care-tasks/:id`<br>`PUT /api/preferences` |
| **Member 3** | **Silva G.S.T.** | **IT21179358** | • Saved Diagnoses History<br>• Expert Consultation Submission<br>• Farmer Consultation Case Tracking<br>• Published Expert Advice Inspection | `savedDiagnosis.controller.ts`<br>`consultations.controller.ts`<br>`SavedDiagnosis.ts`<br>`Consultation.ts`<br>`POST /api/saved-diagnoses`<br>`GET /api/saved-diagnoses`<br>`PATCH /api/saved-diagnoses/:id`<br>`DELETE /api/saved-diagnoses/:id`<br>`POST /api/consultations`<br>`GET /api/consultations/my`<br>`PATCH /api/consultations/:id` |
| **Member 4** | **Lakshan A.W.A.** | **IT22606310** | • Agricultural Officer Dashboard Queue<br>• Officer Case Review & Triage<br>• Private Review Draft Management<br>• Expert Response Publishing & Withdrawal<br>• Outbreak Analytics & Saved Views<br>• Anonymized CSV Data Export | `officer.controller.ts`<br>`analytics.controller.ts`<br>`SavedAnalyticsView.ts`<br>`GET /api/officer/cases`<br>`PATCH /api/officer/cases/:id/status`<br>`PUT /api/officer/cases/:id/draft`<br>`POST /api/officer/cases/:id/publish`<br>`POST /api/officer/cases/:id/withdraw`<br>`GET /api/analytics/summary`<br>`GET /api/analytics/export.csv`<br>`POST /api/analytics/views` |

---

## 2. Interface to Test Suite Traceability

Each member's assigned workload is directly validated by targeted unit and integration test suites in `backend/tests/`:

1. **Member 1 (Ameen F.A.):** Tested in `backend/tests/farmer_features.test.ts`
   - `should create an image draft via upload`
   - `should read current active draft`
   - `should update draft crop note`
   - `should run analysis and return botanical prediction with isMock explicitly labelled`
2. **Member 2 (Nirmani A.K.G.B.):** Tested in `backend/tests/farmer_features.test.ts`
   - `should create a care task`
   - `should read care tasks list`
   - `should toggle care task completion status`
   - `should update and retrieve language preferences (Sinhala / Tamil / English)`
   - `should delete a care task`
   - `should update farmer observations on the diagnosis`
3. **Member 3 (Silva G.S.T.):** Tested in `backend/tests/farmer_features.test.ts`
   - `should save a diagnosis to history with personal observations`
   - `should read and search saved diagnoses`
   - `should update personal observations on saved diagnosis`
   - `should submit an expert consultation linked to diagnosis and image`
   - `should read farmer consultation cases and ensure private drafts are NEVER exposed to farmers`
   - `should allow editing farmer notes while case is in Submitted status`
   - `should delete saved diagnosis record with confirmation`
4. **Member 4 (Lakshan A.W.A.):** Tested in `backend/tests/officer_and_analytics.test.ts`
   - `should strictly forbid farmers from accessing officer endpoints (403 Forbidden)`
   - `should strictly forbid farmers from accessing analytics endpoints (403 Forbidden)`
   - `should list cases for officer with counts and filtering`
   - `should allow officer to save a private draft and verify isolation from farmer`
   - `should read private draft using officer endpoint`
   - `should publish expert response and resolve case`
   - `should allow officer to edit an already published response`
   - `should allow officer to withdraw response, reopening case to In Review with audit trail`
   - `should generate outbreak analytics summary`
   - `should export analytics CSV with formula sanitization and no unescaped formula cells`
   - `should create a saved analytics view`
   - `should list saved analytics views`
   - `should update saved analytics view`
   - `should delete saved analytics view`
