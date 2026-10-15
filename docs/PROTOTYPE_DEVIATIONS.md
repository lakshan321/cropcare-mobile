# Milestone 02 Prototype Deviation Log

**Course:** IT3060 Human Computer Interaction  
**Milestone:** 03  
**Group:** WE_178  
**Project:** CropCare Mobile Application  

The following deviations from the Milestone 02 prototype and HTML blueprint were implemented, documented, and justified to satisfy mobile security standards, assignment requirements, and user feedback.

---

## 1. Single Shared Authentication Screen (Elimination of Role Switcher)

- **Milestone 02 Prototype / HTML Blueprint:**
  The blueprint demo included an unrestricted top-level "Switch to Officer Role" button allowing instant client-side role toggling without credentials.
- **Implemented Mobile Application:**
  A secure, production-grade **Single Shared Login Screen** was implemented.
- **Justification:**
  In a real agricultural extension environment, farmers must not possess the ability to self-promote to Agricultural Officers. The backend database securely stores credentials and assigns verified roles via signed JWT tokens. Changing roles requires signing out and logging in with authenticated credentials.

---

## 2. Trilingual Language Support (English, Sinhala, Tamil)

- **Milestone 02 Prototype / HTML Blueprint:**
  The Milestone 02 wireframes and prototype initially showed an English / Sinhala toggle in the header.
- **Implemented Mobile Application:**
  Added full trilingual support with **Tamil (`ta`)** alongside **Sinhala (`si`)** and **English (`en`)**.
- **Justification:**
  Milestone 01 user requirement UR11 and field stakeholder feedback highlighted that northern and eastern Sri Lankan agricultural regions predominantly speak Tamil. Incorporating Tamil ensures linguistic equity and nationwide accessibility.

---

## 3. Interactive Plant Care Tasks (Action Plan CRUD)

- **Milestone 02 Prototype / HTML Blueprint:**
  The treatment screen was predominantly informational, presenting static paragraphs of immediate actions and chemical suggestions.
- **Implemented Mobile Application:**
  Added a fully persistent **Care Tasks CRUD module** allowing farmers to add custom field tasks (e.g. "Spray copper fungicide on Plot B", "Prune lower blight leaves"), toggle completion checkboxes, and delete completed tasks.
- **Justification:**
  Farmer interviews indicated that farmers need a personal to-do checklist to track their execution of disease management tasks across days, satisfying the rubric's requirement for working persistent CRUD operations on the treatment interface.

---

## 4. Concurrency Version Checks & State Transition Integrity

- **Milestone 02 Prototype / HTML Blueprint:**
  Officers in the demo could freely overwrite case fields without tracking concurrent edits or audit history.
- **Implemented Mobile Application:**
  Introduced an integer version counter on `Consultation` records to prevent conflicting simultaneous edits by different officers, along with strict permitted state transitions (`Submitted` → `In Review` → `Resolved`).
- **Justification:**
  Prevents lost updates when multiple officers review regional cases, ensuring full regulatory traceability and case audit accountability.

---

## 5. Spreadsheet Formula Injection Protection on CSV Export

- **Milestone 02 Prototype / HTML Blueprint:**
  The prototype featured simple text CSV generation without input sanitization.
- **Implemented Mobile Application:**
  All exported fields are sanitized against formula injection (cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prefixed with a single quote `'`) and enclosed in escaped double quotes.
- **Justification:**
  Prevents Remote Code Execution (RCE) and malicious macro execution when officers open exported CSV reports in Microsoft Excel or Google Sheets.
