# 🏗️ UEMS-PHD-VV — Build Plan

**Project**: University Examination Management System + PhD Viva Voce Administration  
**Stack**: Next.js 14+ · TypeScript · MySQL 8+ · Tailwind CSS v4 · Shadcn UI  
**Copyright © 2026 Spider Tabs Ltd**

---

## 📊 Overall Progress

| Module | Status | Progress |
|--------|--------|----------|
| UEMS Core (Sections 1–10) | ✅ Complete | 100% |
| PhD VV — Database Schema (Section 11-14) | ✅ Complete | 100% |
| PhD VV — Seed Data (viva.sql) | ✅ Complete | 100% |
| PhD VV — Data Access Layer (Phase A) | ✅ Complete | 100% |
| PhD VV — API Routes (Phase B) | ✅ Complete | 100% |
| PhD VV — UI Pages (Phase C) | ✅ Complete | 100% |
| PhD VV — Notifications wiring (Phase D) | ✅ Complete | 100% |
| PhD VV — RBAC Guards (Phase E) | ✅ Complete | 100% |
| PhD VV — Audit Logging (Phase F) | ✅ Complete | 100% |
| PhD VV — Panel Structure (v3.1.2) | ✅ Complete | 100% |
| Student Mobile App — API Supporting (Phase G) | 🏗️ Planned | 0% |

---

## ✅ UEMS CORE — COMPLETED

Everything below is **done and shipped**. Listed here for reference only.

<details>
<summary>Click to expand completed items</summary>

### Database
- [x] Schema: all 10 core sections (colleges → audit_logs)
- [x] Seed: colleges, departments, programmes, staff (226 records)
- [x] Triggers: marks recalculation, sub-question guard, usage counts
- [x] Views: `hod_pending_approvals`, `papers_ready_for_print`, `vw_paper_questions_hierarchy`, `lecturer_permissions_summary`
- [x] Stored procedures: `sp_get_paper_full_details`, `cleanup_expired_sessions`, `archive_old_notifications`
- [x] Scheduled events: daily session cleanup, weekly notification archive

### Authentication
- [x] `/api/auth/login` — session creation
- [x] `/api/auth/logout` — session destruction
- [x] `/api/auth/register` — new account
- [x] `/api/auth/me` — session check
- [x] `/api/auth/change-password`
- [x] `src/lib/auth.ts` — session helpers
- [x] `src/lib/rbac.ts` — role guard middleware
- [x] Login page UI
- [x] Register page UI

### Question Bank
- [x] `GET/POST /api/question-bank`
- [x] `GET/PUT/DELETE /api/question-bank/[id]`
- [x] Question bank listing page
- [x] Create/edit question form (MCQ, Essay, Practical, etc.)
- [x] Bloom's taxonomy + difficulty filters

### Exam Papers
- [x] Full paper CRUD API
- [x] Paper builder UI with drag-and-drop
- [x] Hierarchical sub-question support (unlimited nesting)
- [x] Section management (A, B, C)
- [x] Auto mark calculation (trigger)
- [x] Paper preview page
- [x] Version history snapshots

### Approval Workflow
- [x] Submit → HOD Review → HOD Approve/Reject
- [x] `workflow_history` written at every transition
- [x] HOD approval queue page
- [x] Comments / feedback system

### Print Queue
- [x] Exam Master print queue dashboard
- [x] Start printing → set quantity → complete → publish

### Notifications
- [x] Notification creation on all paper workflow events
- [x] Notifications page (mark read / mark all read)

### Reports & Analytics
- [x] Dashboard with key metrics
- [x] Paper statistics by status, course, programme
- [x] Audit log viewer

### User & Org Management
- [x] User management page (admin)
- [x] Lecturer permissions grant/revoke (HOD)
- [x] Colleges / departments / programmes pages

</details>

---

## 🔴 PhD VIVA VOCE — BUILD PLAN

### Foundation already in place
- [x] Schema Section 11 — all 6 tables created
- [x] Schema Section 12 — `vw_viva_schedule_overview` view created
- [x] Schema Section 13 — 3 viva triggers created (`trg_candidate_status_on_viva_schedule`, `trg_candidate_status_on_viva_complete`, `trg_thesis_version_increment`)
- [x] Schema Section 14 — `sp_get_viva_report` stored procedure created
- [x] Seed — `seed_phd_vivavoce.sql` (14 staff, 10 candidates, 12 thesis submissions, 9 schedules, 27 examiners, 18 evaluations, 6 recommendations)
- [x] Notifications table already has viva types: `viva_scheduled`, `viva_reminder`, `viva_result`, `thesis_uploaded`, `examiner_assigned`
- [x] `staff` table already has `viva_coordinator` role in ENUM

---

## PHASE A — Data Access Layer

> Build the TypeScript database query functions first.  
> No UI yet. Everything else depends on these.

---

### A1 — Type Definitions

**File**: `src/types/phd.ts`

```typescript
// Create these interfaces matching the schema exactly

PhdCandidate
ThesisSubmission
VivaSchedule
VivaExaminer (includes `panel_slot`)
VivaEvaluation
VivaRecommendation

// Composite types for joined queries
CandidateWithDetails       // candidate + user + programme + supervisor
VivaWithPanel              // schedule + examiners + candidate
VivaEvaluationSummary      // all evaluations for a viva + averages
VivaReportFull             // full sp_get_viva_report result shape

// Status union types (mirror DB ENUMs)
CandidateStatus
VivaStatus
VivaOutcome
ExaminerRole
```

**Checklist**
- [x] `PhdCandidate` interface
- [x] `ThesisSubmission` interface
- [x] `VivaSchedule` interface
- [x] `VivaExaminer` interface
- [x] `VivaEvaluation` interface (include `overall_score` as readonly)
- [x] `VivaRecommendation` interface
- [x] All composite/joined types
- [x] All ENUM union types
- [x] Export from `src/types/index.ts`

---

### A2 — Database Query Functions

**File**: `src/lib/phd/candidates.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getAllCandidates(filters?)` | `phd_candidates` JOIN staff, programmes | `CandidateWithDetails[]` |
| `getCandidateById(id)` | same + supervisor user | `CandidateWithDetails` |
| `getCandidateByUserId(userId)` | | `PhdCandidate` |
| `createCandidate(data)` | INSERT `phd_candidates` | `number` (new id) |
| `updateCandidate(id, data)` | UPDATE `phd_candidates` | `void` |
| `updateCandidateStatus(id, status)` | UPDATE status only | `void` |

**File**: `src/lib/phd/thesis.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getThesisByCandidateId(candidateId)` | `thesis_submissions` | `ThesisSubmission[]` |
| `getLatestThesis(candidateId)` | MAX(version) | `ThesisSubmission` |
| `createThesisSubmission(data)` | INSERT — trigger handles version | `number` |

**File**: `src/lib/phd/schedules.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getAllSchedules(filters?)` | `vw_viva_schedule_overview` | `VivaWithPanel[]` |
| `getScheduleById(vivaId)` | same + full joins | `VivaWithPanel` |
| `createSchedule(data)` | INSERT `viva_schedules` | `number` |
| `updateScheduleStatus(vivaId, status, reason?)` | UPDATE | `void` |

**File**: `src/lib/phd/examiners.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getExaminersByVivaId(vivaId)` | `viva_examiners` JOIN staff | `VivaExaminer[]` |
| `assignExaminer(data)` | INSERT `viva_examiners` with `panel_slot` | `number` |
| `confirmExaminer(vivaId, examinerId)` | UPDATE confirmed, confirmed_at | `void` |
| `removeExaminer(vivaId, examinerId)` | DELETE | `void` |
| `getEligibleExaminers(deptId?)` | staff WHERE role IN (hod, lecturer) | `User[]` |

**File**: `src/lib/phd/evaluations.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getEvaluationsByVivaId(vivaId)` | `viva_evaluations` JOIN staff | `VivaEvaluation[]` |
| `getEvaluationByExaminer(vivaId, examinerId)` | | `VivaEvaluation` |
| `upsertEvaluation(data)` | INSERT … ON DUPLICATE KEY UPDATE | `number` |
| `submitEvaluation(vivaId, examinerId)` | UPDATE is_submitted=TRUE, submitted_at=NOW() | `void` |
| `getEvaluationSummary(vivaId)` | AVG scores across examiners | `VivaEvaluationSummary` |

**File**: `src/lib/phd/recommendations.ts`

| Function | SQL target | Returns |
|----------|-----------|---------|
| `getRecommendationByVivaId(vivaId)` | `viva_recommendations` | `VivaRecommendation \| null` |
| `createRecommendation(data)` | INSERT | `number` |
| `getFullVivaReport(vivaId)` | CALL `sp_get_viva_report(vivaId)` | `VivaReportFull` |

**Checklist**
- [x] `src/types/phd.ts` — all interfaces
- [x] `src/lib/phd/candidates.ts`
- [x] `src/lib/phd/thesis.ts`
- [x] `src/lib/phd/evaluations.ts`
- [x] `src/lib/phd/examiners.ts`
- [x] `src/lib/phd/schedules.ts`
- [x] `src/lib/phd/recommendations.ts`

---

## PHASE B — API Routes

> One API file per resource. Follow exact same pattern as existing UEMS routes.  
> All routes protected by `rbac.ts` — coordinator or admin only except where noted.

---

### B1 — Candidate Routes

**File**: `src/app/api/phd/candidates/route.ts`

```
GET  /api/phd/candidates
     query params: status, programme_id, supervisor_id, search
     role guard: viva_coordinator, admin, hod
     returns: CandidateWithDetails[]

POST /api/phd/candidates
     body: { user_id, registration_number, thesis_title, programme_id,
             supervisor_id, co_supervisor_id?, enrolment_year }
     role guard: viva_coordinator, admin
     writes: phd_candidates + audit_log
```

**File**: `src/app/api/phd/candidates/[candidateId]/route.ts`

```
GET    /api/phd/candidates/[candidateId]
PUT    /api/phd/candidates/[candidateId]
       body: updatable fields (thesis_title, status, co_supervisor_id, etc.)
```

**Checklist**
- [ ] `GET /api/phd/candidates` with filters
- [ ] `POST /api/phd/candidates` with validation
- [ ] `GET /api/phd/candidates/[candidateId]`
- [ ] `PUT /api/phd/candidates/[candidateId]`

---

### B2 — Thesis Routes

**File**: `src/app/api/phd/candidates/[candidateId]/thesis/route.ts`

```
GET  /api/phd/candidates/[candidateId]/thesis
     returns: ThesisSubmission[] (all versions)

POST /api/phd/candidates/[candidateId]/thesis
     body: { file_name, file_path, file_size_kb, submission_notes }
     trigger auto-increments version
     side-effect: update candidate status → 'thesis_submitted'
     side-effect: create notification (thesis_uploaded) to coordinator
```

**File**: `src/app/api/phd/thesis/[thesisId]/route.ts`

```
GET  /api/phd/thesis/[thesisId]
```

**Checklist**
- [ ] `GET /api/phd/candidates/[candidateId]/thesis`
- [ ] `POST /api/phd/candidates/[candidateId]/thesis`
- [ ] `GET /api/phd/thesis/[thesisId]`

---

### B3 — Viva Schedule Routes

**File**: `src/app/api/phd/schedules/route.ts`

```
GET  /api/phd/schedules
     query params: status, date_from, date_to, candidate_id
     returns: VivaWithPanel[] from vw_viva_schedule_overview

POST /api/phd/schedules
     body: { candidate_id, thesis_id, scheduled_date, scheduled_time,
             venue, duration_minutes }
     DB trigger fires → candidate.status = 'viva_scheduled'
     side-effect: notification (viva_scheduled) to candidate + supervisor
```

**File**: `src/app/api/phd/schedules/[vivaId]/route.ts`

```
GET  /api/phd/schedules/[vivaId]
PUT  /api/phd/schedules/[vivaId]
     body: { scheduled_date?, scheduled_time?, venue?, duration_minutes? }
```

**File**: `src/app/api/phd/schedules/[vivaId]/complete/route.ts`

```
POST /api/phd/schedules/[vivaId]/complete
     UPDATE status → 'completed'
     DB trigger fires → candidate.status = 'viva_completed'
     side-effect: notification (viva_result) when recommendation exists
```

**File**: `src/app/api/phd/schedules/[vivaId]/postpone/route.ts`

```
POST /api/phd/schedules/[vivaId]/postpone
     body: { postponement_reason }
     UPDATE status → 'postponed'
```

**Checklist**
- [ ] `GET /api/phd/schedules`
- [ ] `POST /api/phd/schedules`
- [ ] `GET /api/phd/schedules/[vivaId]`
- [ ] `PUT /api/phd/schedules/[vivaId]`
- [ ] `POST /api/phd/schedules/[vivaId]/complete`
- [ ] `POST /api/phd/schedules/[vivaId]/postpone`

---

### B4 — Examiner Routes

**File**: `src/app/api/phd/schedules/[vivaId]/examiners/route.ts`

```
GET  /api/phd/schedules/[vivaId]/examiners
     returns: VivaExaminer[] with user details

POST /api/phd/schedules/[vivaId]/examiners
     body: { examiner_id, panel_slot: 1|2|3 }
     validation: unique panel_slot per viva, role-based filtering logic
     side-effect: notification (examiner_assigned) to assigned examiner
```

**File**: `src/app/api/phd/schedules/[vivaId]/examiners/[examinerId]/route.ts`

```
PUT    — confirm examiner  { confirmed: true }
DELETE — remove examiner (only if viva not yet completed)
```

**Checklist**
- [ ] `GET /api/phd/schedules/[vivaId]/examiners`
- [ ] `POST /api/phd/schedules/[vivaId]/examiners`
- [ ] `PUT /api/phd/schedules/[vivaId]/examiners/[examinerId]` (confirm)
- [ ] `DELETE /api/phd/schedules/[vivaId]/examiners/[examinerId]`

---

### B5 — Evaluation Routes

**File**: `src/app/api/phd/schedules/[vivaId]/evaluations/route.ts`

```
GET  /api/phd/schedules/[vivaId]/evaluations
     returns: VivaEvaluation[] + VivaEvaluationSummary
     role guard: viva_coordinator, admin + the examiner themselves
```

**File**: `src/app/api/phd/evaluations/route.ts`

```
POST /api/phd/evaluations
     body: { viva_id, examiner_id, originality_score, methodology_score,
             presentation_score, literature_score,
             strengths, weaknesses, recommended_corrections, general_comments }
     validation: each score 0–25
     uses UPSERT (save draft)
```

**File**: `src/app/api/phd/evaluations/[evaluationId]/route.ts`

```
PUT  /api/phd/evaluations/[evaluationId]   — update draft
```

**File**: `src/app/api/phd/evaluations/[evaluationId]/submit/route.ts`

```
POST /api/phd/evaluations/[evaluationId]/submit
     UPDATE is_submitted=TRUE, submitted_at=NOW()
     validation: all 4 scores must be filled before submit
     locked after submission — no further edits
```

**Checklist**
- [ ] `GET /api/phd/schedules/[vivaId]/evaluations`
- [ ] `POST /api/phd/evaluations` (upsert/draft)
- [ ] `PUT /api/phd/evaluations/[evaluationId]`
- [ ] `POST /api/phd/evaluations/[evaluationId]/submit`

---

### B6 — Recommendation Routes

**File**: `src/app/api/phd/schedules/[vivaId]/recommendation/route.ts`

```
GET  /api/phd/schedules/[vivaId]/recommendation
POST /api/phd/schedules/[vivaId]/recommendation
     body: { outcome, correction_deadline?, final_comments }
     validation: correction_deadline required if outcome != 'pass'
     validation: all examiners must have submitted evaluations first
     side-effect: notification (viva_result) to candidate + supervisor
     side-effect: update candidate status based on outcome:
       pass                       → trigger already sets 'viva_completed';
                                    coordinator manually sets 'awarded'
       pass_with_*_corrections    → set candidate.status = 'corrections_pending'
       fail                       → set candidate.status = 'viva_completed' (failed)
```

**File**: `src/app/api/phd/report/[vivaId]/route.ts`

```
GET  /api/phd/report/[vivaId]
     calls CALL sp_get_viva_report(vivaId)
     returns: VivaReportFull (two result sets: schedule info + evaluations)
     role guard: viva_coordinator, admin, supervisor of that candidate
```

**Checklist**
- [ ] `GET /api/phd/schedules/[vivaId]/recommendation`
- [ ] `POST /api/phd/schedules/[vivaId]/recommendation`
- [ ] `GET /api/phd/report/[vivaId]`

---

## PHASE C — UI Pages

> All pages live under `src/app/(dashboard)/phd/`.  
> Reuse existing Shadcn components. Follow the same layout shell as UEMS pages.  
> Role guard: redirect non-coordinator/admin staff away from coordinator-only pages.

---

### C1 — Navigation

**File**: `src/components/sidebar.tsx` *(update existing)*

Add a **PhD Viva Voce** section to the sidebar nav:
```
🎓 PhD Viva Voce
  ├─ Dashboard          /phd
  ├─ Candidates         /phd/candidates
  ├─ Viva Schedule      /phd/schedules
  └─ Reports            /phd/reports
```

- [ ] Add PhD nav group to sidebar
- [ ] Active state highlights correctly
- [ ] Hidden from roles that have no viva access (lecturer, exam_master)

---

### C2 — PhD Dashboard Page

**Route**: `/phd`  
**File**: `src/app/(dashboard)/phd/page.tsx`  
**Role**: viva_coordinator, admin, dean

**Layout**: 4 stat cards + 2 tables side by side

```
┌─────────────────────────────────────────────────────────────────┐
│  🎓 PhD Viva Voce Overview                                       │
├──────────┬──────────┬──────────────┬──────────────────────────  │
│  Total   │  Vivás   │  Pending     │  Evaluations               │
│ Candidats│Scheduled │  Outcomes    │  Outstanding               │
│   10     │    2     │      2       │       6                    │
└──────────┴──────────┴──────────────┴────────────────────────────┘
│                                                                  │
│  Upcoming Vivás (next 30 days)    │  Recent Outcomes            │
│  ─────────────────────────────    │  ─────────────────────────  │
│  Candidate · Date · Venue         │  Candidate · Outcome · Date │
│  ...                              │  ...                        │
└─────────────────────────────────────────────────────────────────┘
```

**Checklist**
- [ ] Fetch summary stats (counts by candidate status, upcoming schedules)
- [ ] Upcoming vivas table (next 30 days, status = scheduled)
- [ ] Recent outcomes table (last 5 recommendations)
- [ ] Stat cards with correct counts from DB

---

### C3 — Candidates List Page

**Route**: `/phd/candidates`  
**File**: `src/app/(dashboard)/phd/candidates/page.tsx`  
**Role**: viva_coordinator, admin

```
┌────────────────────────────────────────────────────────────────┐
│  PhD Candidates                          [+ Register Candidate]│
├────────────────────────────────────────────────────────────────┤
│  Filter: [All Statuses ▼]  [All Programmes ▼]  [Search...]     │
├──────┬──────────────────┬──────────────┬───────────┬───────────┤
│  Reg │  Candidate Name  │  Programme   │  Status   │  Actions  │
├──────┼──────────────────┼──────────────┼───────────┼───────────┤
│  001 │  David Ochieng   │  PhD CS      │ ● Awarded │  View     │
│  002 │  Miriam Namaganda│  PhD CS      │ ● Sched.  │  View     │
│  ... │  ...             │  ...         │  ...      │  ...      │
└──────┴──────────────────┴──────────────┴───────────┴───────────┘
```

Status badge colours:
- `enrolled` → grey
- `thesis_submitted` → blue
- `viva_scheduled` → yellow
- `viva_completed` → purple
- `corrections_pending` → orange
- `corrections_submitted` → cyan
- `awarded` → green
- `withdrawn` → red

**Checklist**
- [ ] Table with pagination
- [ ] Status filter dropdown
- [ ] Programme filter dropdown
- [ ] Search by name or registration number
- [ ] Status badge colours
- [ ] "Register Candidate" button → opens modal or navigates to create page

---

### C4 — Register Candidate Page

**Route**: `/phd/candidates/new`  
**File**: `src/app/(dashboard)/phd/candidates/new/page.tsx`  
**Role**: viva_coordinator, admin

**Form fields**:

| Field | Input Type | Source |
|-------|-----------|--------|
| Candidate (User) | Searchable select | `staff` table |
| Registration Number | Text | Manual |
| Thesis Title | Textarea | Manual |
| Programme | Select | PhD programmes only (`level='phd'`) |
| Primary Supervisor | Searchable select | HODs + lecturers |
| Co-Supervisor | Searchable select (optional) | HODs + lecturers |
| Enrolment Year | Year picker | Manual |

**Checklist**
- [ ] Form with validation (all required fields)
- [ ] Programme dropdown filtered to `level = 'phd'` only
- [ ] User searchable select (candidate must exist as a user first)
- [ ] Supervisor searchable select (HOD/lecturer staff)
- [ ] Duplicate registration number check (client + server)
- [ ] Success redirect to candidate detail page

---

### C5 — Candidate Detail Page

**Route**: `/phd/candidates/[candidateId]`  
**File**: `src/app/(dashboard)/phd/candidates/[candidateId]/page.tsx`  
**Role**: viva_coordinator, admin (supervisor can view their own candidates)

**Layout**: Header info block + tabbed content

```
┌────────────────────────────────────────────────────────────────┐
│  David Ochieng                                    ● Awarded    │
│  KIU/PHD/CS/2021/001 · PhD Computer Science                    │
│  Supervisor: Dr. Derrick Mugisha (HOD CS)                      │
│  Enrolled: 2021                                                 │
├────────────────────────────────────────────────────────────────┤
│  [Thesis Versions]  [Viva History]  [Edit Details]             │
├────────────────────────────────────────────────────────────────┤
│  TAB: Thesis Versions                                           │
│  ─────────────────────────────────────────────────────────     │
│  Version 1 · 4820 KB · Submitted 15 Jan 2024    [Download]     │
│  Version 2 · 4890 KB · Submitted 01 Jun 2024    [Download]     │
│  [+ Upload New Version]                                         │
├────────────────────────────────────────────────────────────────┤
│  TAB: Viva History                                              │
│  ─────────────────────────────────────────────────────────     │
│  Viva on 10 May 2024 · Senate Board Room 1 · PASS              │
│  [View Full Report]                                             │
└────────────────────────────────────────────────────────────────┘
```

**Checklist**
- [ ] Header: name, reg number, programme, supervisor, status badge
- [ ] Thesis tab: list all versions with file size, submission date, download link
- [ ] Upload new thesis version button → modal with file input + notes
- [ ] Viva history tab: list all vivas for this candidate with outcome
- [ ] Edit details tab/button: update thesis title, co-supervisor, status
- [ ] Status update dropdown (manual override by coordinator)

---

### C6 — Viva Schedule List Page

**Route**: `/phd/schedules`  
**File**: `src/app/(dashboard)/phd/schedules/page.tsx`  
**Role**: viva_coordinator, admin

```
┌────────────────────────────────────────────────────────────────┐
│  Viva Schedules                              [+ Schedule Viva] │
├────────────────────────────────────────────────────────────────┤
│  Filter: [All Statuses ▼]  [Date Range]  [Programme ▼]         │
├───────┬──────────────┬────────┬──────────┬─────────┬───────────┤
│ Date  │  Candidate   │ Venue  │ Examiners│  Status │  Actions  │
├───────┼──────────────┼────────┼──────────┼─────────┼───────────┤
│20 May │ M. Namaganda │Senate  │  3/3 ✓  │Scheduled│ View      │
│28 May │ L. Atim      │SPH Hall│  0/3    │Scheduled│ View      │
│10 May │ D. Ochieng   │Senate  │  3/3 ✓  │Completed│ View      │
└───────┴──────────────┴────────┴──────────┴─────────┴───────────┘
```

The `Examiners` column shows `confirmed/total` — a quick readiness indicator.

**Checklist**
- [ ] Table with all schedules from `vw_viva_schedule_overview`
- [ ] Status filter
- [ ] Date range filter (from/to)
- [ ] Programme filter
- [ ] Examiner confirmation count indicator
- [ ] "Schedule Viva" button

---

### C7 — Schedule Viva Page (Create)

**Route**: `/phd/schedules/new`  
**File**: `src/app/(dashboard)/phd/schedules/new/page.tsx`  
**Role**: viva_coordinator, admin

**Form fields**:

| Field | Input Type | Notes |
|-------|-----------|-------|
| Candidate | Searchable select | Filter to status = `thesis_submitted` or `enrolled` |
| Thesis Version | Select | Auto-populated from candidate's submissions |
| Date | Date picker | Must be future date |
| Time | Time picker | |
| Venue | Text | |
| Duration (minutes) | Number | Default 90 |

**Checklist**
- [ ] Candidate select filtered to schedulable statuses
- [ ] Thesis version auto-loads on candidate selection
- [ ] Date validation (no past dates)
- [ ] Form submission → POST `/api/phd/schedules`
- [ ] Trigger confirmation: page confirms that scheduling will advance candidate status to `viva_scheduled`
- [ ] On success: redirect to the new viva detail page

---

### C8 — Viva Detail Page

**Route**: `/phd/schedules/[vivaId]`  
**File**: `src/app/(dashboard)/phd/schedules/[vivaId]/page.tsx`  
**Role**: viva_coordinator, admin

**Layout**: Header + 3 tabs

```
┌────────────────────────────────────────────────────────────────┐
│  Viva — David Ochieng                          ● Completed     │
│  10 May 2024 · 09:00 · Senate Board Room 1 · 120 min           │
│  PhD CS · KIU/PHD/CS/2021/001                                  │
│  Thesis: "Deep Learning for Malaria Detection" (v1)            │
├────────────────────────────────────────────────────────────────┤
│  [Panel & Confirmation]  [Evaluations]  [Recommendation]       │
├────────────────────────────────────────────────────────────────┤
```

**Tab 1 — Panel & Confirmation**
```
  Chairperson      · hod.it          · ✅ Confirmed  [Remove]
  Internal Examiner· lect.cs1        · ✅ Confirmed  [Remove]
  External Examiner· hod.math        · ✅ Confirmed  [Remove]

  [+ Assign Examiner]

  [Mark Viva Complete]   [Postpone Viva]
```

**Tab 2 — Evaluations**
```
  Examiner         Orig  Meth  Pres  Lit   Total  Status
  hod.it            22    21    23    22    88     ✅ Submitted
  lect.cs1          23    22    21    23    89     ✅ Submitted
  hod.math          21    23    22    20    86     ✅ Submitted

  Average Scores:   22.0  22.0  22.0  21.7  87.7

  [View Individual Evaluation: hod.it]
```

**Tab 3 — Recommendation**
```
  Outcome: PASS
  Issued by: Agnes Nakamya (Viva Coordinator)
  Issued at: 10 May 2024, 15:00
  Comments: "The panel unanimously recommends the award..."

  (if no recommendation yet)
  [Issue Recommendation]
```

**Checklist**
- [ ] Header with all schedule details
- [ ] Tab 1: panel list with roles and confirmation status
- [ ] Tab 1: Assign Examiner button → inline form (select user + role)
- [ ] Tab 1: Confirm examiner button (per row, if not yet confirmed)
- [ ] Tab 1: Remove examiner button (guard: not if viva completed)
- [ ] Tab 1: "Mark Viva Complete" button (guard: only if status = scheduled/in_progress)
- [ ] Tab 1: "Postpone" button → modal with reason field
- [ ] Tab 2: Evaluation scores table with averages row
- [ ] Tab 2: Row-level link to view individual evaluation detail
- [ ] Tab 3: Show recommendation if it exists
- [ ] Tab 3: "Issue Recommendation" button if no recommendation yet and all evals submitted
- [ ] Tab 3: Guard — block recommendation if any evaluations are unsubmitted (show warning)

---

### C9 — Issue Recommendation Modal / Page

**Route**: `/phd/schedules/[vivaId]/recommend` *(or modal on viva detail)*  
**File**: `src/app/(dashboard)/phd/schedules/[vivaId]/recommend/page.tsx`  
**Role**: viva_coordinator, admin

**Form fields**:

| Field | Input Type | Notes |
|-------|-----------|-------|
| Outcome | Radio buttons | pass / minor corrections / major corrections / fail |
| Correction Deadline | Date picker | Required if outcome ≠ pass |
| Final Comments | Textarea | |

Pre-filled context shown above the form:
- Average score across all examiners (from evaluation summary)
- Individual examiner score breakdown

**Checklist**
- [ ] Show evaluation summary before the form
- [ ] Outcome radio buttons
- [ ] Conditional correction deadline (show/hide based on outcome)
- [ ] Validation: deadline required for correction outcomes
- [ ] On submit: POST → `/api/phd/schedules/[vivaId]/recommendation`
- [ ] Side-effect: candidate status update based on outcome
- [ ] Side-effect: notification sent to candidate + supervisor
- [ ] Redirect to viva detail page after success

---

### C10 — Examiner Evaluation Form

**Route**: `/phd/evaluations/[vivaId]`  
**File**: `src/app/(dashboard)/phd/evaluations/[vivaId]/page.tsx`  
**Role**: The assigned examiner themselves (internal + external + chair)

> This is the page an examiner uses to enter and submit their scores.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Evaluation Form — David Ochieng · 10 May 2024                 │
│  Your Role: Internal Examiner                                  │
├────────────────────────────────────────────────────────────────┤
│  Thesis: "Deep Learning for Malaria Detection"                 │
├────────────────────────────────────────────────────────────────┤
│  Scoring (each criterion out of 25)                            │
│  ─────────────────────────────────                             │
│  Originality        [  22  ] /25                               │
│  Methodology        [  21  ] /25                               │
│  Presentation       [  23  ] /25                               │
│  Literature Review  [  22  ] /25                               │
│                              ─────                             │
│  Total (auto)                88 /100                           │
├────────────────────────────────────────────────────────────────┤
│  Strengths         [                                    ]       │
│  Weaknesses        [                                    ]       │
│  Corrections       [                                    ]       │
│  General Comments  [                                    ]       │
├────────────────────────────────────────────────────────────────┤
│  [Save Draft]                              [Submit Evaluation] │
└────────────────────────────────────────────────────────────────┘
```

**Checklist**
- [ ] Score inputs with 0–25 validation
- [ ] Live-updating total display (client-side sum of 4 fields)
- [ ] Textarea fields for qualitative feedback
- [ ] "Save Draft" → UPSERT without setting `is_submitted`
- [ ] "Submit Evaluation" → set `is_submitted=TRUE` — confirm dialog first
- [ ] Lock all fields after submission (read-only view if `is_submitted=TRUE`)
- [ ] Guard: only the assigned examiner for this viva can access their own form
- [ ] Pre-fill form if draft already exists

---

### C11 — Viva Report Page

**Route**: `/phd/report/[vivaId]`  
**File**: `src/app/(dashboard)/phd/report/[vivaId]/page.tsx`  
**Role**: viva_coordinator, admin, supervisor of that candidate

**Layout**: Printable full report

```
┌────────────────────────────────────────────────────────────────┐
│  KAMPALA INTERNATIONAL UNIVERSITY                              │
│  PhD Viva Voce Examination Report                              │
├────────────────────────────────────────────────────────────────┤
│  Candidate: David Ochieng · KIU/PHD/CS/2021/001               │
│  Programme: PhD Computer Science                               │
│  Thesis: "Deep Learning for Malaria Detection..."             │
│  Supervisor: Dr. Derrick Mugisha                               │
│  Viva Date: 10 May 2024 · Senate Board Room 1                 │
├────────────────────────────────────────────────────────────────┤
│  PANEL EVALUATIONS                                             │
│  ─────────────────────────────────────────────────────────     │
│  Examiner (Role)    Orig  Meth  Pres  Lit   Total             │
│  hod.it (Chair)      22    21    23    22    88               │
│  lect.cs1 (Int.)     23    22    21    23    89               │
│  hod.math (Ext.)     21    23    22    20    86               │
│  ─────────────────────────────────────────────────────────     │
│  AVERAGE                                        87.7          │
├────────────────────────────────────────────────────────────────┤
│  INDIVIDUAL COMMENTS                                           │
│  [Expandable per examiner]                                     │
├────────────────────────────────────────────────────────────────┤
│  PANEL RECOMMENDATION: PASS                                    │
│  Final Comments: ...                                           │
│  Issued by: Agnes Nakamya · 10 May 2024                       │
└────────────────────────────────────────────────────────────────┘
                                          [🖨️ Print Report]
```

**Checklist**
- [ ] Calls `GET /api/phd/report/[vivaId]` which invokes `sp_get_viva_report`
- [ ] Schedule + candidate + supervisor section
- [ ] Evaluations table with individual scores + average row
- [ ] Expandable per-examiner qualitative comments
- [ ] Recommendation section (outcome, deadline if applicable, final comments)
- [ ] Print button → `window.print()` with print-specific CSS (hide nav/sidebar)

---

### C12 — PhD Reports Page

**Route**: `/phd/reports`  
**File**: `src/app/(dashboard)/phd/reports/page.tsx`  
**Role**: viva_coordinator, admin, dean

**Sections**:
1. **Candidate Status Summary** — count of candidates per status (bar chart or table)
2. **Outcome Summary** — count of each recommendation outcome (pass, minor, major, fail)
3. **Programme Breakdown** — candidates per PhD programme
4. **Upcoming Vivas** — full list of scheduled vivás with dates
5. **Pending Actions** — candidates with unsubmitted evaluations or no recommendation yet

**Checklist**
- [ ] Candidate status summary (SQL: GROUP BY status)
- [ ] Outcome distribution table/chart
- [ ] Programme breakdown table
- [ ] Upcoming vivas list (date-sorted)
- [ ] Pending actions list (alert style for coordinators)

---

## PHASE D — Notifications Wiring

> The notification types are already defined in the DB schema.  
> Wire them up to the correct API side-effects.

| Event | Notification Type | Recipients |
|-------|-------------------|-----------|
| Thesis uploaded | `thesis_uploaded` | Viva Coordinator(s) |
| Viva scheduled | `viva_scheduled` | Candidate + Supervisor + all assigned Examiners |
| Examiner assigned to panel | `examiner_assigned` | That Examiner |
| Viva result issued | `viva_result` | Candidate + Supervisor |
| Viva reminder (3 days before) | `viva_reminder` | All panel members + Candidate |

**File**: `src/lib/phd/notifications.ts`

```typescript
notifyThesisUploaded(candidateId, coordinatorIds)
notifyVivaScheduled(vivaId)      // candidate + supervisor + examiners
notifyExaminerAssigned(vivaId, examinerId)
notifyVivaResult(vivaId)         // candidate + supervisor
```

**Checklist**
- [ ] `src/lib/phd/notifications.ts` helper functions
- [ ] Wire `notifyThesisUploaded` into `POST /api/phd/candidates/[id]/thesis`
- [ ] Wire `notifyVivaScheduled` into `POST /api/phd/schedules`
- [ ] Wire `notifyExaminerAssigned` into `POST /api/phd/schedules/[id]/examiners`
- [ ] Wire `notifyVivaResult` into `POST /api/phd/schedules/[id]/recommendation`
- [ ] Ensure existing notifications page renders viva notification types correctly (icons, colours)

---

## PHASE E — RBAC Guards

> Extend existing `src/lib/rbac.ts` with viva-specific rules.

| Route / Page | Allowed Roles |
|-------------|---------------|
| All `/phd/*` pages | `viva_coordinator`, `admin` |
| View candidate detail | + `hod` (own department supervisors) |
| Submit evaluation form | The assigned examiner only (any role) |
| View viva report | + supervisor of that candidate |
| PhD dashboard | + `dean` |
| PhD reports page | + `dean` |

**Checklist**
- [ ] Add `isVivaCoordinator()` helper
- [ ] Add `isAssignedExaminer(vivaId, userId)` helper
- [ ] Add `isCandidateSupervisor(candidateId, userId)` helper
- [ ] Apply guards to all Phase B API routes
- [ ] Apply guards to all Phase C pages (server-side redirect if unauthorised)

---

## PHASE F — Audit Logging

> All write operations must write to `audit_logs` — same pattern as UEMS.

| Action | Entity Type | Trigger |
|--------|-------------|---------|
| `candidate_registered` | `phd_candidates` | POST create candidate |
| `thesis_submitted` | `thesis_submissions` | POST upload thesis |
| `viva_scheduled` | `viva_schedules` | POST create schedule |
| `viva_postponed` | `viva_schedules` | POST postpone |
| `viva_completed` | `viva_schedules` | POST complete |
| `examiner_assigned` | `viva_examiners` | POST assign |
| `evaluation_submitted` | `viva_evaluations` | POST submit |
| `recommendation_issued` | `viva_recommendations` | POST recommend |
| `candidate_status_updated` | `phd_candidates` | Manual status change |

**Checklist**
- [ ] Ensure `auditLogger.ts` `log()` function is called in each API write route above
- [ ] Confirm audit log viewer page shows phd entity types correctly

---

## Build Order Summary

Work through phases in this order. Each phase unblocks the next.

```
A — Data Access Layer  (types + DB query functions)
        ↓
B — API Routes         (depends on A)
        ↓
C — UI Pages           (depends on B)
  C1  Sidebar nav update
  C2  PhD Dashboard
  C3  Candidate List
  C4  Register Candidate
  C5  Candidate Detail
  C6  Schedule List
  C7  Create Schedule
  C8  Viva Detail (tabs)
  C9  Issue Recommendation
  C10 Examiner Evaluation Form
  C11 Viva Report (printable)
  C12 PhD Reports
        ↓
D — Notifications wiring
        ↓
E — RBAC guards
        ↓
F — Audit logging
```

---

## Full Checklist (collapsed)

### Phase A — Data Access Layer
- [x] `src/types/phd.ts` — all interfaces and ENUM types
- [x] `src/lib/phd/candidates.ts`
- [x] `src/lib/phd/thesis.ts`
- [x] `src/lib/phd/schedules.ts`
- [x] `src/lib/phd/examiners.ts`
- [x] `src/lib/phd/evaluations.ts`
- [x] `src/lib/phd/recommendations.ts`

### Phase B — API Routes
- [x] `GET/POST /api/phd/candidates`
- [x] `GET/PUT /api/phd/candidates/[candidateId]`
- [x] `GET/POST /api/phd/candidates/[candidateId]/thesis`
- [x] `GET /api/phd/thesis/[thesisId]`
- [x] `GET/POST /api/phd/schedules`
- [x] `GET/PUT /api/phd/schedules/[vivaId]`
- [x] `POST /api/phd/schedules/[vivaId]/complete`
- [x] `POST /api/phd/schedules/[vivaId]/postpone`
- [x] `GET/POST /api/phd/schedules/[vivaId]/examiners`
- [x] `PUT/DELETE /api/phd/schedules/[vivaId]/examiners/[examinerId]`
- [x] `GET /api/phd/schedules/[vivaId]/evaluations`
- [x] `POST /api/phd/evaluations`
- [x] `PUT /api/phd/evaluations/[evaluationId]`
- [x] `POST /api/phd/evaluations/[evaluationId]/submit`
- [x] `GET/POST /api/phd/schedules/[vivaId]/recommendation`
- [x] `GET /api/phd/report/[vivaId]`
- [x] `GET /api/phd/eligible-examiners` *(added — required by C8)*

### Phase C — UI Pages
- [x] C1  Sidebar nav (`headerNavLinks.ts`)
- [x] C2  `/phd` dashboard
- [x] C3  `/phd/candidates` list
- [x] C4  `/phd/candidates/new`
- [x] C5  `/phd/candidates/[candidateId]`
- [x] C6  `/phd/schedules` list
- [x] C7  `/phd/schedules/new`
- [x] C8  `/phd/schedules/[vivaId]`
- [x] C9  `/phd/schedules/[vivaId]/recommend`
- [x] C10 `/phd/evaluations/[vivaId]`
- [x] C11 `/phd/report/[vivaId]`
- [x] C12 `/phd/reports`

### Phase D — Notifications
- [x] `src/lib/phd/notifications.ts`
- [x] Wire `notifyThesisUploaded` into POST thesis route
- [x] Wire `notifyVivaScheduled` into POST schedules route
- [x] Wire `notifyExaminerAssigned` into POST examiners route
- [x] Wire `notifyVivaResult` into POST recommendation route

### Phase E — RBAC
- [x] `isVivaCoordinator()` helper
- [x] `isPhdExaminerFor()` helper (replaces `isAssignedExaminer`)
- [x] `isCandidateSupervisorForViva()` helper
- [x] `canViewViva()` guard function for viva detail pages
- [x] Guards on all B API routes (auth + role verification)
- [x] Guards on all C UI pages (via server-side redirects)

### Phase F — Audit Logging
- [x] 14 audit log entries wired across API routes
  - candidate_registered (POST candidates)
  - candidate_updated (PUT candidates/[id])
  - thesis_submitted (POST candidates/[id]/thesis)
  - viva_scheduled (POST schedules)
  - viva_updated (PUT schedules/[id])
  - viva_completed (POST schedules/[id]/complete)
  - viva_postponed (POST schedules/[id]/postpone)
  - examiner_assigned (POST schedules/[id]/examiners)
  - examiner_confirmed (PUT schedules/[id]/examiners/[id])
  - examiner_removed (DELETE schedules/[id]/examiners/[id])
  - evaluation_submitted (POST evaluations/[id]/submit)
  - evaluation_updated (PUT evaluations/[id])
  - evaluation_created (POST evaluations)
  - recommendation_issued (POST schedules/[id]/recommendation)

---

---

## PHASE G — Mobile API & Student Support

> Extend the system to support a Flutter-based mobile application for candidates.  
> Focus on read-only access to their own data via secure endpoints.

### G1 — Student Authentication API
- [ ] `POST /api/mobile/auth/login` (Student registration number + password)
- [ ] `GET /api/mobile/auth/me` (Session check)
- [ ] Token-based or secure session support for mobile clients

### G2 — Candidate Data Endpoints
- [ ] `GET /api/mobile/viva/current` (Active/Upcoming viva for the student)
- [ ] `GET /api/mobile/viva/history` (Past vivas and outcomes)
- [ ] `GET /api/mobile/thesis/versions` (Thesis submission history)
- [ ] `GET /api/mobile/results/[vivaId]` (Outcome and final comments)

### G3 — Push Notification Service
- [ ] Integration with Firebase Cloud Messaging (FCM)
- [ ] Side-effects to trigger push alerts on viva scheduling/completion

### G4 — Document Export
- [ ] `GET /api/mobile/report/[vivaId]/pdf` (Generate a mobile-friendly results summary)

*UEMS-PHD-VV v3.1 · Spider Tabs Ltd © 2026*