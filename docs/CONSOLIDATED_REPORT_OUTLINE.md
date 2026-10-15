# Consolidated Group Report Outline (Milestones 01–03)

**Module:** IT3060 Human Computer Interaction  
**Final Submission Name:** `IT3060HCI2026_Milestone03_GroupWE_178.pdf`  
**Page Budget Constraint:** Maximum 35 pages (excluding References and Appendix)  

---

## Page Budget & Section Plan (Target: 33–35 Pages)

```
+---------------------------------------------------------------------------------------+
| Section                                                       | Target Page Range     |
+---------------------------------------------------------------------------------------+
| 1. Cover Page & Student Workload Table                        | Page 1                |
| 2. Executive Summary                                          | Page 2                |
| 3. Milestone 01 Summary: Research, Stakeholders & Requirements| Pages 3 – 6 (4 pages) |
| 4. Milestone 02 Summary: Sketches, Wireframes & High-Fi Proto | Pages 7 – 10 (4 pages)|
| 5. Technology Stack Selection & Comprehensive Justification   | Pages 11 – 13(3 pages)|
| 6. System Architecture & Component Interaction                | Pages 14 – 16(3 pages)|
| 7. Working Application Implementation & Screen Walkthrough    | Pages 17 – 23(7 pages)|
| 8. Requirements to Implementation & CRUD Traceability Matrix  | Pages 24 – 26(3 pages)|
| 9. Functional Test Cases & Automated Suite Results            | Pages 27 – 29(3 pages)|
| 10. Usability Testing Protocol, Execution & Defect Analysis   | Pages 30 – 32(3 pages)|
| 11. Project Time Schedule (Gantt Chart)                       | Page 33               |
| 12. Conclusion & Lessons Learned                              | Page 34               |
+---------------------------------------------------------------------------------------+
| 13. References (Not counted toward 35-page limit)             | Page 35+              |
| 14. Appendices (Raw Test Logs, Blank Templates, Source Diffs) | Page 36+              |
+---------------------------------------------------------------------------------------+
```

---

## Detailed Content Breakdown by Section

### Section 1: Cover Page & Student Workload Table (Page 1)
- University / Institute branding, IT3060 Human Computer Interaction, Year 3 Semester 2 2026.
- Project Title: **CropCare: Intelligent Crop Disease Diagnosis & Agricultural Extension Management**.
- Group Number: **Group WE_178**.
- Student Details Table:
  - Ameen F.A. (IT21377730) — Member 1: Farmer Home, Camera & Upload, Preview, Analysis State, Guidelines.
  - Nirmani A.K.G.B. (IT22101174) — Member 2: Diagnosis Results, Treatment & Prevention, Care Tasks, Language.
  - Silva G.S.T. (IT21179358) — Member 3: Saved Diagnoses History, Expert Consultation, Farmer Cases.
  - Lakshan A.W.A. (IT22606310) — Member 4: Officer Dashboard Queue, Response Management, Outbreak Analytics.

### Section 2: Executive Summary (Page 2)
- High-level overview of agricultural challenges facing Sri Lankan farmers (crop loss, delayed diagnosis, geographic barriers to extension offices).
- Summary of the solution: A unified mobile system linking farmers and officers via computer-vision disease diagnosis and verifiable expert consultation.
- Key outcomes across Milestones 01, 02, and 03.

### Section 3: Milestone 01 Summary (Pages 3–6)
- **Problem Statement:** Delayed identification of plant blights leading to excessive chemical misuse or total crop failure.
- **Stakeholder Analysis:** Primary (smallholder farmers, greenhouse growers), Secondary (agricultural officers, agronomists), Tertiary (Department of Agriculture, research institutes).
- **Elucidated User Requirements:** Review of UR01 through UR11 and Functional Requirements FR01 through FR10.

### Section 4: Milestone 02 Summary (Pages 7–10)
- **Design Evolution:** Sketches showing Variant A vs Variant B selections (e.g. camera dual buttons, large image preview, header language switcher).
- **Wireframes:** Structural layouts for Home, Capture, Guidelines, Results, Treatment, Saved Diagnoses, Consultations, Officer Queue, and Analytics.
- **High-Fidelity Prototype Feedback:** Insights gathered from preliminary prototype walk-throughs in Figma and HTML blueprints.

### Section 5: Technology Stack Selection & Justification (Pages 11–13)
- React Native with Expo SDK 52 and Expo Router.
- Node.js, Express, and strict TypeScript.
- MongoDB document model with Mongoose ODM and embedded in-memory database resilience.
- Security stack: JWT stateless authorization, bcryptjs password hashing, and Expo SecureStore.
- Pluggable AI Diagnosis Engine (`IDiagnosisProvider`): Mock botanical engine vs real inference service.

### Section 6: System Architecture Overview (Pages 14–16)
- Three-tier client-server architecture diagram.
- Role-based authorization pipeline (Farmer vs Officer).
- Concurrency control and state transition machine (`Submitted` → `In Review` → `Resolved`).
- Offline data caching and idempotency protection against duplicate network requests.

### Section 7: Implementation Details & Screenshots (Pages 17–23)
- Visual walk-through of every implemented interface with annotated callouts:
  - Shared Login Screen & Registration Form.
  - Member 1: Farmer Home, Photo Guidelines, Camera/Upload, Image Preview, Analysis Scanner.
  - Member 2: Diagnosis Results with Severity/Confidence, Treatment Guidance, Care Tasks CRUD, Language Toggle (EN/SI/TA).
  - Member 3: Saved Diagnoses History with Search, Expert Consultation Form, Farmer Case Status Tracking.
  - Member 4: Agricultural Officer Dashboard, Full Case Review, Private Drafts & Published Advice, Outbreak Analytics with CSV Export.

### Section 8: Requirements & CRUD Traceability (Pages 24–26)
- Detailed matrix linking requirements, members, screens, entities, endpoints, and test cases.
- Verification that every interface includes at least 2 working CRUD operations.

### Section 9: Functional Test Cases & Automated Results (Pages 27–29)
- Comprehensive functional test matrix covering 37 automated tests.
- Evidence of 100% test pass rate across authentication, farmer workflows, officer workflows, and outbreak analytics.

### Section 10: Usability Testing Plan & Defect Analysis (Pages 30–32)
- Usability testing protocol for 5 representative participants (farmers and extension officers).
- Task scenarios, quantitative metrics (time-on-task, completion rates, assistance levels), and System Usability Scale (SUS) templates.
- Identified usability defects and corrective actions implemented.

### Section 11: Project Time Schedule (Page 33)
- Milestone 01, 02, and 03 Gantt chart illustrating sprint progress and task allocations.

### Section 12: Conclusion & Lessons Learned (Page 34)
- Summary of project achievements, technical insights, and future agricultural extension recommendations.

### Section 13 & 14: References & Appendices (Page 35+)
- Academic citations and technical documentation.
- Appendix A: Full Jest Integration Test Execution Logs.
- Appendix B: Usability Testing Blank Templates & Observer Sheets.
- Appendix C: Source Code File Tree & Architecture Excerpts.
