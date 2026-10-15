# Functional Test Matrix & Execution Results

**Course:** IT3060 Human Computer Interaction — Milestone 03  
**Group:** WE_178  
**Project:** CropCare Mobile Application  
**Execution Environment:** Node.js v22 LTS, Jest v29, TypeScript v5, MongoDB Memory Server  
**Execution Status:** **37 / 37 Tests Passing (100% Pass Rate)**  

---

## 1. Automated Integration Test Suite Results

```
PASS  tests/farmer_features.test.ts (17 tests)
PASS  tests/officer_and_analytics.test.ts (14 tests)
PASS  tests/auth.test.ts (6 tests)

Test Suites: 3 passed, 3 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        10.659 s
```

---

## 2. Detailed Functional Test Case Log

| Test ID | Module / Feature | Test Objective | Steps to Execute | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Authentication | Shared Login (Farmer) | Send POST /api/auth/login with farmer credentials (`farmer_kamal`) | Returns 200 OK, JWT token, user object with role `'farmer'` | As expected. Navigates to Farmer Home. | **PASS** |
| **TC-AUTH-02** | Authentication | Shared Login (Officer) | Send POST /api/auth/login with officer credentials (`officer_perera`) on SAME endpoint | Returns 200 OK, JWT token, user object with role `'officer'` | As expected. Navigates to Officer Dashboard. | **PASS** |
| **TC-AUTH-03** | Authentication | Invalid Credentials | Send POST /api/auth/login with incorrect password | Returns 401 Unauthorized with descriptive error | As expected. Login rejected. | **PASS** |
| **TC-AUTH-04** | Authentication | Public Registration | Submit POST /api/auth/register with `role: "officer"` | Returns 201 Created; server hardcodes role to `'farmer'` | As expected. Role escalation blocked. | **PASS** |
| **TC-AUTH-05** | Authentication | Session Restoration | Send GET /api/auth/me with Bearer token | Returns 200 OK with authenticated user profile | As expected. Restores profile on app launch. | **PASS** |
| **TC-AUTH-06** | Authentication | Unauthenticated Access | Request protected endpoint without Authorization header | Returns 401 Unauthorized | As expected. Request rejected. | **PASS** |
| **TC-DRAFT-01** | Member 1: Capture & Drafts | Create Image Draft | Upload leaf JPEG via POST /api/drafts | Returns 201 Created with draft ID and image URL | As expected. Draft created in database. | **PASS** |
| **TC-DRAFT-02** | Member 1: Capture & Drafts | Read Current Draft | Request GET /api/drafts/current | Returns 200 OK with active draft record | As expected. Displayed in image preview. | **PASS** |
| **TC-DRAFT-03** | Member 1: Capture & Drafts | Update Crop Notes | Send PUT /api/drafts/:id with updated crop note | Returns 200 OK with updated crop note | As expected. Crop note updated. | **PASS** |
| **TC-DRAFT-04** | Member 1: Capture & Drafts | Delete / Dismiss Draft | Send DELETE /api/drafts/:id | Returns 200 OK; draft removed from database | As expected. Draft dismissed without submission. | **PASS** |
| **TC-DIAG-01** | Member 1 & 2: Diagnosis | Automated Leaf Analysis | Send POST /api/diagnosis/analyze with draftId & cropHint | Returns 201 Created, `isMock: true`, symptoms, treatment | As expected. Pluggable provider analyzed leaf. | **PASS** |
| **TC-DIAG-02** | Member 2: Results | Update Observations | Send PATCH /api/diagnosis/:id/notes with personal observations | Returns 200 OK; observations saved to diagnosis | As expected. Personal notes persisted. | **PASS** |
| **TC-TASK-01** | Member 2: Care Tasks | Create Plant Care Task | Send POST /api/care-tasks with task description | Returns 201 Created; task added to user's schedule | As expected. Task persisted in MongoDB. | **PASS** |
| **TC-TASK-02** | Member 2: Care Tasks | Read Care Tasks | Send GET /api/care-tasks | Returns 200 OK with list of farmer's care tasks | As expected. Listed on treatment screen. | **PASS** |
| **TC-TASK-03** | Member 2: Care Tasks | Toggle Completion | Send PATCH /api/care-tasks/:id with `isCompleted: true` | Returns 200 OK with `isCompleted = true` | As expected. Task visually struck through. | **PASS** |
| **TC-TASK-04** | Member 2: Care Tasks | Delete Care Task | Send DELETE /api/care-tasks/:id | Returns 200 OK; task deleted from database | As expected. Task removed from list. | **PASS** |
| **TC-PREF-01** | Member 2: Language | Set Language Preference | Send PUT /api/preferences with `language: "si"` | Returns 200 OK with Sinhala preference saved | As expected. Persisted locally and on server. | **PASS** |
| **TC-SAVE-01** | Member 3: Saved History | Save Diagnosis Record | Send POST /api/saved-diagnoses with diagnosisId | Returns 201 Created; saved diagnosis record created | As expected. Added to history. | **PASS** |
| **TC-SAVE-02** | Member 3: Saved History | Search & Read History | Send GET /api/saved-diagnoses?search=Tomato | Returns 200 OK with filtered records matching "Tomato" | As expected. Instant search filtering works. | **PASS** |
| **TC-SAVE-03** | Member 3: Saved History | Update Field Notes | Send PATCH /api/saved-diagnoses/:id with updated observations | Returns 200 OK with updated observations | As expected. Saved record updated. | **PASS** |
| **TC-SAVE-04** | Member 3: Saved History | Delete Saved Record | Send DELETE /api/saved-diagnoses/:id | Returns 200 OK; record removed from database | As expected. Record deleted. | **PASS** |
| **TC-CONS-01** | Member 3: Consultation | Submit Consultation | Send POST /api/consultations linked to diagnosis & image | Returns 201 Created with status `'Submitted'` | As expected. Consultation queued for officer. | **PASS** |
| **TC-CONS-02** | Member 3: Consultation | Read Farmer Cases | Send GET /api/consultations/my | Returns 200 OK with user's cases; NO private drafts | As expected. Private drafts strictly hidden. | **PASS** |
| **TC-CONS-03** | Member 3: Consultation | Edit Symptoms While Open | Send PATCH /api/consultations/:id with updated notes | Returns 200 OK while status is `'Submitted'` | As expected. Notes updated and audited. | **PASS** |
| **TC-CONS-04** | Member 3: Consultation | Cancel Consultation | Send DELETE /api/consultations/:id while in `'Submitted'` | Returns 200 OK; consultation cancelled and deleted | As expected. Withdrawn from queue. | **PASS** |
| **TC-OFF-01** | Member 4: Security | Farmer Blocked from Officer | Request GET /api/officer/cases with farmer JWT token | Returns 403 Forbidden | As expected. Access strictly denied. | **PASS** |
| **TC-OFF-02** | Member 4: Security | Farmer Blocked from Analytics | Request GET /api/analytics/summary with farmer token | Returns 403 Forbidden | As expected. Access strictly denied. | **PASS** |
| **TC-OFF-03** | Member 4: Dashboard | Officer Case Queue | Send GET /api/officer/cases?sort=highest_priority | Returns 200 OK with counts (open, resolved, highPriority) | As expected. Case cards rendered with status. | **PASS** |
| **TC-OFF-04** | Member 4: Review | Save Private Working Draft | Send PUT /api/officer/cases/:id/draft with advice draft | Returns 200 OK with draft saved; case marked In Review | As expected. Invisible to farmer endpoint. | **PASS** |
| **TC-OFF-05** | Member 4: Review | Read Private Draft | Send GET /api/officer/cases/:id/draft with officer token | Returns 200 OK with private draft data | As expected. Officer can resume draft. | **PASS** |
| **TC-OFF-06** | Member 4: Review | Publish Expert Advice | Send POST /api/officer/cases/:id/publish | Returns 200 OK; status set to `'Resolved'`, draft cleared | As expected. Farmer can now read advice in Cases. | **PASS** |
| **TC-OFF-07** | Member 4: Review | Edit Published Response | Send PUT /api/officer/cases/:id/published with revised advice | Returns 200 OK; audit entry appended | As expected. Published response updated. | **PASS** |
| **TC-OFF-08** | Member 4: Review | Withdraw Advice & Reopen | Send POST /api/officer/cases/:id/withdraw | Returns 200 OK; status reverted to `'In Review'` | As expected. Case reopened with audit log. | **PASS** |
| **TC-ANL-01** | Member 4: Analytics | Outbreak Summary | Send GET /api/analytics/summary?district=All | Returns 200 OK with disease, district, & crop counts | As expected. Aggregated metrics generated. | **PASS** |
| **TC-ANL-02** | Member 4: Analytics | Sanitized CSV Export | Send GET /api/analytics/export.csv | Returns 200 OK with `text/csv` header and sanitized cells | As expected. Formula injection shielded. | **PASS** |
| **TC-ANL-03** | Member 4: Analytics | Saved Views CRUD | Create, read, update, and delete saved analytics views | Returns 201, 200, 200, 200 across CRUD operations | As expected. Filter views saved and reloaded. | **PASS** |
