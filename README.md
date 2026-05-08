# 🎓 UEMS-PHD-VV — University Examination Management System & PhD Viva Voce Administration

A unified digital platform for managing the complete academic examination lifecycle at Kampala International University — from course exam paper creation through to PhD thesis defence administration.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Version](https://img.shields.io/badge/Version-3.1-green)](https://github.com/spidertabs/uems)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Workflow](#system-workflow)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [API Routes](#api-routes)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [Licence](#licence)

---

## 🌟 Overview

**UEMS-PHD-VV** (University Examination Management System — PhD Viva Voce) is the unified successor to the original UEMS platform. It retains the full course examination workflow and extends it with a complete **PhD Viva Voce Administration** module, meaning the entire academic examination lifecycle — from undergraduate coursework papers to doctoral oral defences — is managed in a single, integrated system.

### Problem Statement

Traditional examination management involves:

- ❌ Manual paper handling and version control
- ❌ Disconnected approval workflows
- ❌ Lack of audit trails
- ❌ Inefficient question reuse
- ❌ Poor visibility into paper status
- ❌ PhD viva scheduling handled in isolation (spreadsheets, email chains)
- ❌ No centralised examiner evaluation records or outcome tracking

### Our Solution

UEMS-PHD-VV provides:

- ✅ Digital question bank with categorisation
- ✅ Automated approval workflows (Lecturer → HOD → Exam Master)
- ✅ Real-time notifications and status tracking
- ✅ Comprehensive audit logging
- ✅ Role-based access control (RBAC)
- ✅ Support for hierarchical questions with unlimited sub-questions
- ✅ **PhD candidate lifecycle management** (enrolment → thesis → viva → award)
- ✅ **Thesis version tracking** with automatic versioning
- ✅ **Viva scheduling, panel assignment, and examiner confirmation**
- ✅ **Structured examiner evaluation** with auto-calculated scores
- ✅ **Panel recommendation and outcome recording**
- ✅ **Quickfire Assessments** (manual assessments without HOD approval)
- ✅ **Essay and MCQ Support** with word count constraints for essays
- ✅ **Mobile-matched reporting** for student work preview

---

## ✨ Key Features

### 📚 Question Bank Management

- Create and categorise questions by course, study unit, and difficulty
- Support for multiple question types (MCQ, Essay, Practical, Case Study, etc.)
- Bloom's taxonomy classification
- Question reusability tracking
- HOD approval workflow for questions

### 📝 Exam Paper Creation

- Visual paper builder with drag-and-drop
- **Hierarchical question support** with unlimited nesting levels
- Section management (Section A, B, C, etc.)
- Automatic mark calculation
- Choice questions (e.g., "Answer any 2 of 3")
- Custom instructions and footer text
- Real-time preview

### ✅ Exam Paper Approval Workflow

```
Draft → Submit → HOD Review → HOD Approval → Ready for Print → Printing → Printed → Published
```

- Multi-stage approval process
- Feedback and comments at each stage
- Full version history with snapshots
- In-app notifications at every transition

### 🖨️ Print Management

- Centralised print queue for Exam Master
- Track printing status and quantities
- Print history and audit trail
- Bulk printing support

### 🎓 PhD Viva Voce Administration *(New in v3.1)*

#### Candidate Management

- Register PhD candidates and link to their user account and programme
- Track candidate status through the full doctoral lifecycle:

  ```
  Enrolled → Thesis Submitted → Viva Scheduled → Viva Completed
  → Corrections Pending → Corrections Submitted → Awarded / Withdrawn
  ```

- Record supervisors and co-supervisors per candidate

#### Thesis Submission Tracking

- Upload and store thesis PDF versions
- **Automatic version incrementing** on each re-submission (database trigger)
- Submission notes and file metadata

#### Viva Scheduling

- Schedule oral defence sessions with date, time, venue, and duration
- Manage status transitions: `scheduled → in_progress → completed` (or `postponed / cancelled`)
- Record postponement reasons
- Coordinator-assigned scheduling with full audit trail

#### Examiner Panel Management

- Assign structured three-member panels using designated slots:
  - **Slot 1**: Professor / Staff
  - **Slot 2**: Lecturer / Staff
  - **Slot 3**: External Examiner
- "Configure Panel" interface with role-based filtering for each slot
- Track individual confirmation status per examiner
- Record notification timestamps
- Prevent duplicate assignments (unique constraint per viva + examiner and unique per viva + slot)

#### Structured Evaluations

- Each examiner submits an independent evaluation with four scored criteria:

  | Criterion | Max Marks |
  |-----------|-----------|
  | Originality | 25 |
  | Methodology | 25 |
  | Presentation | 25 |
  | Literature Review | 25 |
  | **Total (auto-calculated)** | **100** |

- Free-text fields for strengths, weaknesses, recommended corrections, and general comments
- Evaluations locked until formally submitted (`is_submitted` flag)
- `overall_score` is a **generated column** — always consistent, never manually entered

#### Panel Recommendations

- One binding recommendation per viva, issued by the Viva Coordinator:
  - `pass`
  - `pass_with_minor_corrections`
  - `pass_with_major_corrections`
  - `fail`
- Correction deadline tracking for non-pass outcomes
- Final panel comments recorded centrally

#### Examiner & Supervisor Portal

- **Personalized Dashboard**: "My Candidates" view showing only those assigned to the current staff member
- **Role-specific Badges**: Clearly distinguish between Primary Supervisor, Co-Supervisor, and Examiner roles
- **Submission Alerts**: Visual cues and "Evaluate" buttons for pending viva scores
- **Access Control**: Supervisors can view their candidates' thesis history and previous viva reports

### 👥 User Management

- Role-based permissions (Lecturer, HOD, Dean, Exam Master, Viva Coordinator, Admin)
- Granular course-level permissions
- HOD can grant question creation rights to lecturers
- Secure session-based authentication

### 📊 Reports & Analytics

- Dashboard with key metrics across both modules
- Paper statistics by status, course, and programme
- Viva schedule overview (coordinator dashboard)
- Candidate progress tracking
- Examiner evaluation summaries
- Audit logs and activity history

#### Exam Timetable & Enrollment

- **HOD Timetable Control**: Centrally manage exam dates, times, and venues for published papers
- **Course Enrollment**: Students register for specific courses each semester; this automatically grants them access to the corresponding exam schedules
- **Supervision Assignments**: HODs assign lecturers to supervise exam slots
- **Privacy Enforcement**:
  - Students only see schedules for courses they are enrolled in for the current semester
  - Lecturers only see enrollment counts for papers they are assigned to supervise
- **Automated Notifications**: Alert students and supervisors of new schedules and assignments

### 📱 Student Mobile Application (Flutter) *(Upcoming)*

- **Results & Reports**: Real-time access to viva outcomes and examiner feedback
- **Schedule Management**: View upcoming viva dates, venues, and panel members
- **Thesis Tracker**: Monitor submission history and version status
- **Quickfire Participation**: Take quick assessments, view scores, and receive immediate feedback
- **Smart Notifications**: Push alerts for schedule changes, examiner confirmations, final results, and new Quickfire assessments
- **Progress Visualization**: Dynamic tracking of the PhD lifecycle (Enrolled → Thesis → Viva → Awarded)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router), React, TypeScript |
| **Styling** | Tailwind CSS v4, Shadcn UI |
| **Backend** | Next.js API Routes (TypeScript) |
| **Database** | Supabase (PostgreSQL) — local CLI for dev, cloud for production |
| **ORM** | Raw SQL with Supabase client |
| **Authentication** | Supabase Auth (unified across web + mobile apps) |
| **State Management** | React Server Components + Client State |
| **Deployment** | Vercel + GitHub (CI/CD via GitHub integration) |

---

## 🔄 System Workflow

### Lecturer Journey

1. **Create Paper**: Select course, exam type, and academic details
2. **Add Questions**: Choose from question bank or add new questions
3. **Add Sub-Questions**: Create hierarchical structures (e.g., 1a, 1b, 1b(i))
4. **Preview**: Review formatted exam paper
5. **Submit**: Send to HOD for approval
6. **Receive Feedback**: View HOD comments and revise if needed

### HOD Journey

1. **Review Submissions**: View pending papers in approval queue
2. **Quality Check**: Review questions, marks, and structure
3. **Provide Feedback**: Add comments or request revisions
4. **Approve/Reject**: Make approval decision
5. **Forward**: Approved papers move to print queue

### Exam Master Journey

1. **View Print Queue**: See all papers ready for printing
2. **Start Printing**: Mark paper as "printing"
3. **Set Quantity**: Specify number of copies
4. **Complete**: Mark paper as "printed"
5. **Publish**: Make paper available for exam day

### Viva Coordinator Journey *(New)*

1. **Register Candidate**: Create PhD candidate record linked to programme and supervisor
2. **Track Thesis**: Log thesis submission(s); system auto-increments version numbers
3. **Schedule Viva**: Set date, time, venue, and duration
4. **Configure Panel**: Assign examiners to structured slots (1: Professor, 2: Lecturer, 3: External) with role-based filtering
5. **Monitor Evaluations**: Track which examiners have submitted their scored evaluations
6. **Issue Recommendation**: Record the panel's binding outcome and any correction deadline
7. **Update Candidate Status**: System triggers automatically advance candidate status on key events

### PhD Candidate Status Flow *(New)*

```
Enrolled
  └─→ Thesis Submitted       (coordinator logs thesis upload)
        └─→ Viva Scheduled   (trigger fires on viva_schedules INSERT)
              └─→ Viva Completed  (trigger fires when schedule status → 'completed')
                    ├─→ Corrections Pending    (minor or major corrections outcome)
                    │     └─→ Corrections Submitted
                    │           └─→ Awarded
                    └─→ Awarded                (pass outcome — direct)
```

---

## 📸 Screenshots

### 🗺️ UEMS Ecosystem Architecture Blueprint

<p style="text-align: justify;">
A technical blueprint diagram rendered in a dark navy grid style — reminiscent of an engineering schematic — that maps the complete UEMS application ecosystem and the data flows between every layer. At the top centre sits the <strong>UEMS-PHD-VV Web</strong> application (Next.js 14, TypeScript, Tailwind, Shadcn UI), serving as the administration hub for HODs, Lecturers, Viva Coordinators, and Admins. It is connected bidirectionally to the two Flutter applications via solid teal arrows: <strong>UEMS Mobile</strong> (Flutter 3.19+, Dart) on the left, targeting Students and PhD Candidates on Android, iOS, and Web; and the <strong>Quickfire Exam Portal</strong> (Flutter 3.x, Hardened Kiosk build) on the right, targeting students in invigilated exam conditions on Linux Desktop, Android, iOS, and Web. Dashed arrows indicate content that flows from the web app into each mobile app — exam schedules and enrollment data flow left to UEMS Mobile, while assessment configurations and result data flow right to Quickfire. All three applications connect downward with solid arrows to the central <strong>Supabase (PostgreSQL 15)</strong> block, which carries four capability icons: Database, Auth, Realtime, and Storage. The Supabase block is labelled "Deployed on Vercel" for the web layer and "Hosted Cloud · Row-Level Security · Single Shared Database" for the backend. Two footer banners at the bottom of the diagram summarise the cross-cutting concerns: <em>Unified Supabase Auth — same credentials across all apps</em> on the left, and <em>RLS enforced at database layer for per-role security</em> on the right.
</p>

![UEMS Ecosystem Architecture Blueprint](./public/screenshots/blueprint.jpg)

---

### 🚀 Vercel Deployment Dashboard

<p style="text-align: justify;">
The Vercel deployment dashboard for the <strong>spidertabs-uems-php-vv</strong> project, viewed under the <em>spider's projects</em> Hobby account. The main panel shows the <strong>Deployment Details</strong> for build <code>k8dTAyDE9</code>. A live screenshot preview on the left displays the UEMS login page — the "Welcome to UEMS" sign-in form overlaid on a KIU campus photograph — confirming this is the correct production application. The deployment metadata shows: <strong>Created</strong> by spidertabs on Apr 21, <strong>Status</strong> of Ready (Stale, meaning a newer deployment supersedes it), a <strong>Duration</strong> of just 39 seconds, and an <strong>Environment</strong> of Production. Under <strong>Domains</strong>, two Vercel-provisioned URLs are listed — <code>spidertabs-uems-php-vv-git-clean-main-spiders-projects-f55c9b6d.vercel.app</code> and a shorter alias — both pointing at the same build. The <strong>Source</strong> section links directly to the <code>clean-main</code> GitHub branch at commit <code>3397c7b</code>, whose message reads <em>"fix: compact login page height for small laptop viewports"</em>, demonstrating the direct GitHub → Vercel CI/CD pipeline. Below the header, collapsible panels provide access to Deployment Settings (flagged with 3 recommendations), Build Logs (completed in 39s with 1 warning), Deployment Summary, Deployment Checks, and Assigning Custom Domains. Four quick-link cards at the bottom of the panel offer Runtime Logs, Observability, Speed Insights (Not Enabled), and Web Analytics (Not Enabled). The left sidebar exposes the full range of Vercel project tools: Deployments, Logs, Analytics, Speed Insights, Observability, Firewall, CDN, Environment Variables, Domains, Integrations, Storage, Flags, Agent, AI Gateway, Sandboxes, and Workflows.
</p>

![Vercel Deployment Dashboard](./public/screenshots/vercel_dashboard.png)

---

### 🗄️ Supabase Database Schema Visualiser

<p style="text-align: justify;">
The Supabase <strong>Schema Visualiser</strong> for the <code>uems-phd-vv</code> project (organisation: spidertabs's Org, branch: main, environment: PRODUCTION), accessed at <code>supabase.com/dashboard/project/zgklfrakozlpjheecatj/database/schemas</code>. The visualiser renders the <code>public</code> schema as an interactive entity-relationship canvas, showing live database tables with their column names and data types laid out as connected cards. The screenshot — captured at 200% zoom to show column-level detail — focuses on two tables in the centre of the canvas. The <strong>exam_paper_questions</strong> table is fully visible on the left, displaying columns: <code>id</code> (int4, primary key), <code>exam_paper_id</code> (int4), <code>question_id</code> (int4), <code>section</code> (varchar), <code>question_number</code> (varchar), <code>sub_question_label</code> (varchar, nullable), <code>display_number</code> (varchar, nullable), <code>marks</code> (int4), <code>sub_marks</code> (varchar, nullable), <code>is_required</code> (bool), <code>is_choice</code> (bool), <code>choice_group</code> (varchar, nullable), <code>choice_instructions</code> (varchar, nullable), and <code>sequence_order</code> (int4) — this table underpins the hierarchical question builder that supports unlimited nesting. The <strong>paper_comments</strong> table on the right shows: <code>id</code>, <code>exam_paper_id</code>, <code>user_id</code>, <code>comment_type</code>, <code>comment</code> (text), <code>is_resolved</code> (bool), <code>parent_comment_id</code> (nullable, enabling threaded replies), <code>created_at</code>, and <code>updated_at</code> (both timestamptz). A partially visible third table on the far right shows columns including <code>submitted_at</code>, <code>published_at</code>, <code>version</code>, <code>is_locked</code>, <code>deleted_at</code>, <code>deleted_by</code>, <code>created_at</code>, and <code>updated_at</code> — consistent with the <code>exam_papers</code> table structure. A minimap in the bottom-right corner shows the full canvas extent, indicating the complete schema spans many more tables beyond what is visible in this view. The left panel provides navigation to all database management tools: Schema Visualiser, Tables, Functions, Triggers, Enumerated Types, Extensions, Indexes, Publications, and under Configuration: Roles and Policies. The legend at the bottom of the canvas defines the four column-type indicators used throughout: Primary Key, Identity, Unique, Nullable (diamond outline), and Non-Nullable (filled diamond).
</p>

![Supabase Database Schema Visualiser](./public/screenshots/supabase_database_schema.png)

---

### 🏠 HOD Dashboard

*The main dashboard for a Head of Department (HOD) role. Shows a summary of key metrics at a glance: Pending Approvals, Department Papers, Department Courses, and total Question Bank entries. The "PhD Candidates" counter links directly to the Viva Voce module. Quick Action shortcuts let the HOD jump straight to reviewing papers, managing courses, granting permissions, or adding questions. The Recent Activity feed below shows a real-time audit trail of actions in the department.*

![HOD Dashboard](./public/screenshots/hod-dashboard-managing-interface.png)

---

### 📚 Question Bank

*The Question Bank page allows HODs and permitted lecturers to browse, search, and manage all exam questions in the department. Filters across the top let users narrow questions by Course, Study Unit, Question Type, Difficulty level, and Bloom's Taxonomy level. Summary statistics show total questions (251), filtered count, total marks, and average marks per question. Each question card displays its course code, study unit, difficulty, Bloom level, mark value, question type, question text, and the lecturer who created it. Edit and Delete actions are available per question.*

![Question Bank](./public/screenshots/rick-question-bank.png)

---

### 📅 Exam Timetable

*The Exam Timetable page is controlled by the HOD and shows the Active Schedule for all published exam papers. Each row in the table shows the Exam Paper code and title (e.g., "Fundamentals of Programming"), the Date & Time, the Venue (e.g., "Complex Room 5"), the list of assigned Supervisors, the Enrollment count visualised as a progress bar against the room capacity (/150), and an Edit action. The "Schedule Paper" button at the top right opens a form to add a new timetable slot. A slot count badge ("2 Slots") shows how many papers are currently scheduled.*

![Exam Timetable](./public/screenshots/exam-timetable.png)

---

### 📋 Course Enrollment

*The Course Enrollment page gives the HOD a view of all courses and their enrollment status for the current semester. Each row lists the Course Code and name, the Department, the number of enrolled students (shown as a coloured badge — green for enrolled, grey for zero), the Schedule Status (date and time if scheduled, or "No schedule set"), and a View Details action. A search bar allows filtering by course name. This page helps HODs quickly identify which courses have students registered and which exam slots are still unscheduled.*

![Course Enrollment](./public/screenshots/course-enrollment.png)

---

### 🛡️ Supervision Roster (Invigilation Overview)

*The Invigilation Overview page (Supervision Roster) shows all active exam slots and the invigilators assigned to each. Cards are displayed for each scheduled paper — showing the Exam Paper code, paper title, exam date and time, venue, and the list of assigned supervisors (highlighted as links). This page helps the HOD verify that every exam session has adequate invigilation coverage and allows supervisors to see which rooms they are responsible for on exam day.*

![Supervision Roster](./public/screenshots/supervision-roster.png)

---

### 🎓 PhD Viva Voce Admin Dashboard (HOD View)

*The PhD Viva Voce Administration dashboard for a HOD user. Four summary cards at the top display: Total Candidates (9), Upcoming Vivás (2), Pending Outcomes (0), and Outstanding Evaluations (0). The left panel lists Upcoming Vivás with each candidate's name, registration number, programme, scheduled date/time, venue, and panel confirmation status (e.g., "3/3 confirmed"). The right panel shows a Candidate Status distribution chart breaking down candidates by their current lifecycle stage (Viva Scheduled: 7, Awarded: 1, Viva Completed: 1). Quick action buttons at the top right allow registering a new candidate or scheduling a new viva.*

![PhD Viva Voce Admin Dashboard](./public/screenshots/phd-viva-voce-admin-dashboard.png)

---

### 🎓 PhD Viva Voce Dashboard (Lecturer View)

*The PhD Viva Voce Dashboard as seen by a Lecturer/Supervisor. The layout is identical to the HOD view but the data is scoped to that lecturer's assigned candidates. The top cards show Assigned Candidates (9), Upcoming Vivás (2), Pending Outcomes (0), and Outstanding Evaluations (0). The Upcoming Vivás list shows only vivás where the lecturer is a supervisor or panel examiner. The Candidate Status chart on the right reflects the same breakdown for their assigned group.*

![PhD Dashboard — Lecturer View](./public/screenshots/phd-dashboard-lecturer.png)

---

### 👥 PhD Candidates (My Candidates — Supervisor View)

*The "My Candidates" page shows a personalised list of PhD candidates assigned to the currently logged-in staff member (Sylvia Kaggwa, Lecturer), either as Primary Supervisor, Co-Supervisor, or Examiner. A notification dropdown at the top right shows a recent "Viva Result Issued" alert for John Mukasa with a Pass outcome. Each row in the table shows the Candidate name, Registration Number, Thesis Title (truncated), Programme, the logged-in user's role for that candidate (e.g., "Primary Supervisor", "Co-Supervisor"), the candidate's current Status (e.g., "Viva Scheduled", "Viva Completed"), Thesis version count, Vivá count, and action buttons. Candidates with pending evaluations show a prominent "Evaluate ★" button and a "PENDING EVALUATION" warning badge. A status filter dropdown on the right allows filtering by candidate lifecycle stage.*

![PhD Candidates](./public/screenshots/phd-candidates.png)

---

### 📅 Viva Schedules List

*The Viva Schedules page lists all oral defence sessions in the system. Tab filters at the top let users switch between All Statuses, Scheduled (6), In Progress (0), Completed (2), Postponed (0), and Cancelled (0). Each row in the table shows the Date & Time, Candidate name and registration number, Programme, Venue, an Evaluations progress bar (e.g., "0/3"), the current Status badge, the Outcome (if recorded), and a View button to open the full viva detail. Search and date-range filters are available at the top. The "+ Schedule Viva" button opens the scheduling form.*

![Viva Schedules](./public/screenshots/viva-schedule.png)

---

### 📅 Schedule Viva Form

*The "Schedule Viva" form used by Supervisors and HODs to create a new oral defence appointment. Fields include: Candidate (dropdown — "Select candidate…"), Thesis Version (auto-populated once a candidate is selected), Date, Time, Venue (free text, e.g., "Senate Building, Board Room 1"), and Duration in minutes (defaulting to 90). A yellow information banner at the bottom of the form reminds the user that scheduling the viva will automatically advance the candidate's status to "Viva Scheduled" via a database trigger. Cancel and "Schedule Viva" buttons complete the form.*

![Schedule Viva Form](./public/screenshots/schedule-viva-by-supervisor-or-hod.png)

---

### 👨‍⚖️ Viva Detail — Panel & Examiner Assignment (HOD View)

*The Viva detail page for candidate Ismail Katende (KIU/2023/P106), showing the "Panel & Confirmation" tab. The header displays the viva status badge ("SCHEDULED"), the scheduled date (9 May 2026, 10:00 AM), venue (Faculty Boardroom), duration (90 min), supervisor name (Amos Nansubuga), and thesis title. Three tabs are available: Panel & Confirmation (3), Evaluations (0/3), and Recommendation. The Examination Panel section lists the three assigned examiners: Bernadette Nambi (Chairperson), Cynthia Nambi (Internal Examiner, Slot 1), and Grace Njeri (External Examiner, Slot 3) — all shown as "Confirmed". Each examiner row has a Remove action. The "+ Assign Examiner" button at the top right opens the examiner assignment modal. "Mark Complete" and "Postpone" action buttons appear at the top right of the page header.*

![Viva Detail — Panel Assignment](./public/screenshots/assign-examiners-by-hod.png)

---

### 📊 PhD Reports Overview

*The PhD Reports page provides a system-wide analytics view of all PhD candidates and viva outcomes. A "Pending Actions" alert at the top highlights candidates requiring attention (e.g., Adam Sekitto — KIU/2019/P001, awaiting corrections). Two charts summarise data: the Candidate Status Distribution bar chart (Viva Scheduled: 9 at 82%, Awarded: 1 at 9%, Viva Completed: 1 at 9%) and the Viva Outcomes chart for vivás with recorded results (Pass — Minor Corrections: 1 at 50%, Pass: 1 at 50%). A "Candidates by Programme" table below lists each programme (e.g., PhD in Computer Science by Research), its total candidates (11), number awarded (2), and completion rate (18%). An "All Upcoming Vivás" table at the bottom lists every scheduled defence with candidate, programme, date/time, venue, and panel columns.*

![PhD Reports Overview](./public/screenshots/phd-reports-overview.png)

---

### 📄 PhD Viva Voce Examination Report

*A formatted, printable PhD Viva Voce Examination Report generated by the system and bearing the KIU logo and "CONFIDENTIAL — Academic Registry" watermark. The report is split into two header sections: Candidate Information (Name: John Mukasa, Reg. Number: KIU/2020/1001, Programme: PhD in Computer Science by Research, Supervisor: Sylvia Kaggwa, Thesis Title: "Machine Learning Approaches for Predicting Crop Yields in Sub-Saharan Africa") and Examination Details (Date: 3 May 2026, Time: 9:00 AM, Venue: ICT Building Room 101, Duration: 120 minutes, Status: COMPLETED). Below is the Panel Evaluations table showing each examiner's scores across four criteria — Originality (/25), Methodology (/25), Presentation (/25), and Literature Review (/25) — with a calculated Total (/100). The panel average row at the bottom summarises the overall score (81.7/100).*

![PhD Viva Voce Examination Report](./public/screenshots/phd-report.png)

---

### ⚡ Quickfire Assessments — Main Module

*The Quickfire Assessments page (dark theme) allows lecturers to create and manage quick in-class or take-home assessments without requiring HOD approval. A "Create Assessment" button at the top right opens the creation flow. Three summary cards show: Total Active (1), Total Completed (1), and a "Quickfire Module — Ready for Students" status badge. Below is a searchable list of assessments. Each card shows the Course code (ACC1101), the assessment title ("Fundamentals of Accounting"), the instruction ("Attempt all Questions"), and metadata: duration (60 mins), creation date (5/6/2026), and results visibility (Results Hidden). "Reports" and "Manage" buttons appear on each card.*

![Quickfire Assessments](./public/screenshots/introducing-quickfire-main-module-2.png)

---

### ⚡ Quickfire — Manage Questions

*The Quickfire "Manage" page for an individual assessment (Fundamentals of Accounting, Course: ACC1101). The left panel contains an "Add Question" form with fields for Question Text, Type (dropdown — currently "Multiple Choice"), Marks (currently 1), and an "Options & Correct Answer" section with radio buttons for Option A, B, C, and D (the radio button next to the correct answer is selected). An "Add Question" button submits the new question. Below the form, "Assessment Questions (9)" shows the existing question list. The right Settings panel shows the assessment Status (Accepting Responses), Time Allotted (60 Minutes) with "+5m / +10m" extension buttons, Results Visibility (Hidden), and an "Edit Assessment Settings" link. A purple "Launch Info" card at the bottom right shows the unique Assessment ID (3) and the Spider Tabs UEMS-PHD-VV branding — students enter this ID in the Flutter mobile app to access the assessment.*

![Quickfire — Manage Questions](./public/screenshots/quickfire-manage-set-quetions.png)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed for local development

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/spidertabs/uems.git
   cd uems
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Session Secret
   SESSION_SECRET=your-super-secret-key-here

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

   For **local development**, use the Supabase CLI to run a local instance:

   ```bash
   supabase start
   ```

   This prints local `API URL`, `anon key`, and `service_role key` — copy those into `.env.local`.

4. **Apply the database schema**

   Push the SQL migrations to your local Supabase instance:

   ```bash
   supabase db push
   ```

   Or run the seed scripts directly via the Supabase SQL editor (local or cloud):

   ```sql
   -- Core schema (all sections including PhD Viva Voce)
   \i sql/schema.sql

   -- Organisational seed data (colleges, departments, programmes, staff)
   \i sql/seed.sql

   -- PhD Viva Voce seed data (candidates, schedules, evaluations)
   \i sql/seed_phd_vivavoce.sql

   -- Optional: study units
   \i sql/study_units.sql

   -- Optional: sample questions
   \i sql/questions.sql
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Registration & Authentication

**All user types (lecturers, HODs, admins, exam masters, deans, viva coordinators, and PhD candidates) use a unified authentication system.** Registration creates a user account, and role assignment determines which modules and features they can access. PhD candidates are registered as staff with the appropriate role and have immediate access to the PhD Viva Voce module alongside other staff.

### Default Login Credentials

All accounts share the default password: **`uems@2026`**

| Role | Email | Notes |
|------|-------|-------|
| **Admin** | `admin@uems.ac.ug` | Full system access |
| **Exam Master** | `exammaster@uems.ac.ug` | Print queue management |
| **Dean (SOMAC)** | `dean.somac@uems.ac.ug` | College-level oversight |
| **HOD (CS)** | `hod.cs@uems.ac.ug` | Dept 14 — also PhD supervisor |
| **HOD (Physics)** | `hod.phy@uems.ac.ug` | Dept 19 — also PhD supervisor |
| **Viva Coordinator** | `viva.coord1@uems.ac.ug` | PhD viva scheduling & outcomes |
| **Lecturer (CS)** | `lect.cs1@uems.ac.ug` | Also a viva panel examiner |
| **PhD Candidate (CS)** | `phd.cs001@uems.ac.ug` | Candidate in viva_completed state |

---

## 📁 Project Structure

```
uems/
├── public/
│   ├── static/images/              # KIU logos and branding
│   └── screenshots/                # 📸 Place screenshots here
├── sql/
│   ├── schema.sql                  # Full schema (UEMS + PhD Viva Voce)
│   ├── seed.sql                    # Core organisational data
│   ├── seed_phd_vivavoce.sql       # PhD Viva Voce seed data  ← NEW
│   ├── study_units.sql             # Study unit data
│   └── questions.sql               # Sample questions
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── exam-papers/        # Paper management
│   │   │   ├── question-bank/      # Question CRUD
│   │   │   ├── approvals/          # Approval workflows
│   │   │   ├── print-queue/        # Print management
│   │   │   ├── phd/                # PhD Viva Voce endpoints  ← NEW
│   │   │   │   ├── candidates/
│   │   │   │   ├── thesis/
│   │   │   │   ├── schedules/
│   │   │   │   ├── examiners/
│   │   │   │   ├── evaluations/
│   │   │   │   └── recommendations/
│   │   │   └── ...
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx            # Dashboard home
│   │   │   ├── exam-papers/        # Paper management UI
│   │   │   ├── question-bank/      # Question bank UI
│   │   │   ├── approvals/          # Approval UI
│   │   │   ├── phd/                # PhD Viva Voce UI  ← NEW
│   │   │   │   ├── candidates/
│   │   │   │   ├── schedules/
│   │   │   │   ├── evaluations/
│   │   │   │   └── recommendations/
│   │   │   └── ...
│   │   ├── auth/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/                     # Shadcn UI components
│   ├── lib/
│   │   ├── db.ts                   # Database connection
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── rbac.ts                 # Role-based access control
│   │   ├── auditLogger.ts          # Audit logging
│   │   └── utils.ts                # Helper functions
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── .env.local
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### 📸 Screenshot Files

Place screenshots in `public/screenshots/` with these names:

```
public/screenshots/
├── register.png
├── register_d.png
├── login.png
├── dashboard.png
├── question-bank.png
├── paper-creation.png
├── hierarchical-questions.png
├── paper-preview.png
├── approval-workflow.png
├── print-queue.png
├── notifications.png
├── reports.png
├── user-management.png
├── organizational-structure.png
│
│   ── Infrastructure & Deployment ────────────
├── blueprint.jpg
├── vercel_dashboard.png
├── supabase_database_schema.png
│
│   ── PhD Viva Voce (new) ──────────────────
├── hod-dashboard-managing-interface.png
├── rick-question-bank.png
├── exam-timetable.png
├── course-enrollment.png
├── supervision-roster.png
├── phd-viva-voce-admin-dashboard.png
├── phd-dashboard-lecturer.png
├── phd-candidates.png
├── viva-schedule.png
├── schedule-viva-by-supervisor-or-hod.png
├── assign-examiners-by-hod.png
├── phd-reports-overview.png
├── phd-report.png
├── introducing-quickfire-main-module-2.png
└── quickfire-manage-set-quetions.png
```

**Recommended dimensions**: 1920×1080 or 1440×900 (16:9)

---

## 🗄️ Database Schema

The schema is organised into 15 sections in a single `schema.sql` file.

### Core Tables (UEMS — Sections 1–10)

| Table | Purpose |
|-------|---------|
| `colleges` | Academic colleges / schools (SOMAC, SONAS, CEM, SOL, etc.) |
| `departments` | Departments nested under colleges |
| `programmes` | Academic programmes (BIT, DIT, LLB, MPH, PhD CS, etc.) |
| `staff` | All user accounts — role determined by `role` ENUM |
| `sessions` | PHP/Node session token tracking |
| `courses` | Individual courses with HOD ownership |
| `study_units` | Modules / topics inside a course |
| `questions` | Question bank with Bloom's taxonomy and JSON options |
| `exam_papers` | Exam paper metadata and full approval-state machine |
| `exam_paper_versions` | Full JSON snapshots for version history |
| `exam_paper_programmes` | Paper ↔ Programme many-to-many |
| `exam_paper_questions` | Questions in papers — supports unlimited sub-question nesting |
| `lecturer_permissions` | HOD-granted course-level permissions |
| `workflow_history` | Complete audit trail of every paper status transition |
| `paper_comments` | Threaded feedback on papers |
| `notifications` | User notifications for both modules |
| `audit_logs` | System-wide activity log |

### PhD Viva Voce Tables (Section 11)

| Table | Purpose |
|-------|---------|
| `phd_candidates` | PhD students — links user account to programme, supervisor, and lifecycle status |
| `thesis_submissions` | Uploaded thesis versions (auto-versioned by trigger) |
| `viva_schedules` | Oral defence appointments with venue and status |
| `viva_examiners` | Panel members per viva (chairperson / internal / external) |
| `viva_evaluations` | Per-examiner scored evaluations; `overall_score` is a **generated column** |
| `viva_recommendations` | Binding panel outcome — one per viva |

### Pre-built Views (Section 12)

| View | Used By |
|------|---------|
| `hod_pending_approvals` | HOD approval queue |
| `papers_ready_for_print` | Exam Master dashboard |
| `vw_paper_questions_hierarchy` | Paper preview and printing |
| `vw_viva_schedule_overview` | Viva Coordinator dashboard |
| `lecturer_permissions_summary` | Admin / HOD permissions panel |

### Triggers (Section 13)

| Trigger | Purpose |
|---------|---------|
| `trg_prevent_subquestions_when_disabled` | Blocks sub-question insertion when parent disallows it |
| `trg_marks_after_insert/update/delete` | Auto-recalculates `exam_papers.total_marks` |
| `trg_increment_question_usage` | Increments `questions.usage_count` on paper add |
| `trg_decrement_question_usage` | Decrements on paper remove |
| `trg_candidate_status_on_viva_schedule` | Sets candidate status → `viva_scheduled` on viva insert |
| `trg_candidate_status_on_viva_complete` | Sets candidate status → `viva_completed` when viva completes |
| `trg_thesis_version_increment` | Auto-increments thesis `version` on each re-submission |

### Key Design Decisions

- **Unified schema**: Both UEMS and Viva Voce share `staff`, `programmes`, `departments`, and `colleges` — no duplication
- **Generated column**: `viva_evaluations.overall_score` is always computed from the four criteria scores — never manually writable
- **Soft deletes**: `deleted_at` present on all major tables
- **JSON validation**: `CHECK` constraints on all `JSON` columns (no triggers needed)
- **Unique constraints**: Prevent duplicate panel assignments and duplicate paper-question ordering

---

## 👥 User Roles

### 🎓 Lecturer

- Create exam papers for assigned courses
- Add questions to the question bank (with HOD permission)
- Submit papers for HOD approval
- View feedback and revise accordingly
- Track paper status in real time

### 👔 HOD (Head of Department)

- Create courses and study units
- Create and approve questions
- Grant course permissions to lecturers
- Review and approve all department exam papers
- Serve as PhD supervisor or panel examiner

### 🏛️ Dean

- Oversee college-level exam operations
- Review papers across departments
- Provide high-level feedback
- Optional approval layer for final exams

### 🖨️ Exam Master

- View all approved papers
- Manage the print queue
- Track printing status and quantities
- Mark papers as printed or published

### 🎓 Viva Coordinator *(New)*

- Register and manage PhD candidates
- Log thesis submissions
- Schedule viva sessions and assign examination panels
- Monitor examiner confirmation and evaluation submission status
- Issue binding panel recommendations
- Update candidate lifecycle status

### ⚙️ Admin

- Full system access across both modules
- User and role management
- System configuration
- View all audit logs
- Manage soft-deleted records

---

## 🔌 API Routes

### Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/change-password
```

### Exam Papers

```
GET    /api/exam-papers
POST   /api/exam-papers/create
GET    /api/exam-papers/[paperId]
PUT    /api/exam-papers/[paperId]
DELETE /api/exam-papers/[paperId]
POST   /api/exam-papers/[paperId]/submit
POST   /api/exam-papers/[paperId]/approve
GET    /api/exam-papers/[paperId]/questions
POST   /api/exam-papers/[paperId]/questions
DELETE /api/exam-papers/[paperId]/questions/[questionId]
```

### Question Bank

```
GET    /api/question-bank
POST   /api/question-bank/create
GET    /api/question-bank/[id]
PUT    /api/question-bank/[id]
DELETE /api/question-bank/[id]
```

### Approvals

```
GET    /api/approvals/pending
POST   /api/approvals/[paperId]/approve
POST   /api/approvals/[paperId]/reject
```

### Print Queue

```
GET    /api/print-queue
GET    /api/print-queue/[paperId]
POST   /api/print-queue/[paperId]/start
POST   /api/print-queue/[paperId]/complete
```

### PhD Candidates *(New)*

```
GET    /api/phd/candidates
POST   /api/phd/candidates/create
GET    /api/phd/candidates/[candidateId]
PUT    /api/phd/candidates/[candidateId]
```

### Thesis Submissions *(New)*

```
GET    /api/phd/candidates/[candidateId]/thesis
POST   /api/phd/candidates/[candidateId]/thesis/upload
GET    /api/phd/thesis/[thesisId]
```

### Viva Schedules *(New)*

```
GET    /api/phd/schedules
POST   /api/phd/schedules/create
GET    /api/phd/schedules/[vivaId]
PUT    /api/phd/schedules/[vivaId]
POST   /api/phd/schedules/[vivaId]/complete
POST   /api/phd/schedules/[vivaId]/postpone
```

### Viva Examiners *(New)*

```
GET    /api/phd/schedules/[vivaId]/examiners
POST   /api/phd/schedules/[vivaId]/examiners/assign
PUT    /api/phd/schedules/[vivaId]/examiners/[examinerId]/confirm
DELETE /api/phd/schedules/[vivaId]/examiners/[examinerId]
```

### Viva Evaluations *(New)*

```
GET    /api/phd/schedules/[vivaId]/evaluations
POST   /api/phd/evaluations/create
PUT    /api/phd/evaluations/[evaluationId]
POST   /api/phd/evaluations/[evaluationId]/submit
```

### Viva Recommendations *(New)*

```
GET    /api/phd/schedules/[vivaId]/recommendation
POST   /api/phd/recommendations/create
```

### Notifications

```
GET    /api/notifications
POST   /api/notifications/[id]/read
POST   /api/notifications/mark-all-read
```

---

## 🎯 Development Roadmap

### ✅ Phase 1 (Completed — UEMS Core)

- [x] Database schema design
- [x] Authentication system
- [x] Question bank CRUD
- [x] Exam paper creation with hierarchical questions
- [x] Multi-stage approval workflow
- [x] Print queue management

### ✅ Phase 2 (Completed — PhD Viva Voce Integration)

- [x] Unified database schema (UEMS + Viva Voce)
- [x] PhD candidate lifecycle management
- [x] Thesis submission with auto-versioning
- [x] Viva scheduling and panel management
- [x] Structured examiner evaluation with generated scores
- [x] Panel recommendation and outcome recording
- [x] Status-change triggers (candidate auto-progression)
- [x] Viva coordinator role and permissions
- [x] Notification types for viva events
- [x] Viva schedule overview (coordinator dashboard view)
- [x] Full viva report stored procedure

### 🔄 Phase 3 (In Progress)

- [ ] Bulk operations on exam papers
- [ ] Advanced reporting and analytics dashboard
- [ ] Full-text search and smart filters
- [ ] Email notifications (SMTP integration)
- [ ] PDF export for exam papers and viva reports

### 📅 Phase 4 (Planned)

- [ ] Plagiarism detection for thesis submissions
- [ ] Mobile app (React Native)
- [ ] AI-powered question suggestions
- [ ] External examiner self-service portal
- [ ] Student-facing result notification

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code structure
- Add JSDoc comments for all functions
- Write meaningful commit messages
- Test your changes before submitting

---

## 📄 Licence

This project is licensed under the MIT Licence — see the [LICENCE](LICENCE) file for details.

**Copyright © 2026 Spider Tabs Ltd**

---

## 👨‍💻 Authors

- **Gava Hans** — Lead Developer
- **Ocen Isaac** — Developer
- **Kamuntu David** — Developer
- **Sempuwo Mathew David** — Developer

---

## 🙏 Acknowledgments

- **Kampala International University** for the opportunity
- **Shadcn UI** for the beautiful component library
- **Next.js Team** for the amazing framework
- All contributors and testers

---

## 📧 Contact

For questions, issues, or suggestions:

- **Project Team**: Gava Hans, Ocen Isaac, Sempuwo Mathew David
- **Email**: <spider.tabs@gmail.com>

---

<div align="center">
  <p>Built with ❤️ by <strong>Spider Tabs Ltd</strong> at Kampala International University</p>
  <p>
    <img src="./public/static/images/kiu-logo.png" alt="KIU Logo" width="100">
  </p>
  <p><em>Gava Hans • Ocen Isaac • Kamuntu David • Sempuwo Mathew David</em></p>
  <p><strong>UEMS-PHD-VV v3.1</strong></p>
</div>