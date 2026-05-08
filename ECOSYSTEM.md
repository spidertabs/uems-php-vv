# 🏗️ UEMS Ecosystem — Architecture, Backend & Applications

> **Spider Tabs Ltd · Kampala International University · 2026**

This document describes the full **UEMS-PHD-VV** ecosystem — the technology decisions behind the backend and hosting, and the three distinct applications that together serve every user in the university's examination lifecycle.

---

## 🌐 Why Next.js + Vercel + Supabase?

The UEMS-PHD-VV platform is a web-first system built for university-wide deployment. Every technology choice was made to reduce operational overhead for KIU's IT team while delivering a production-grade, scalable system.

### Next.js (App Router, 14+)

Next.js was chosen as the core framework for three reasons:

1. **Full-stack in one project.** The frontend pages and all `/api/*` routes live in a single repository. There is no separate Express/Django server to deploy, maintain, or version independently. A lecturer approving an exam paper and the API endpoint that processes that approval are in the same codebase, reviewed in the same pull request.

2. **React Server Components + Streaming.** Heavy dashboard pages — the PhD Reports overview, the Viva Schedule list — render on the server and stream HTML to the browser. The user sees a populated interface almost immediately, without waiting for a full client-side JavaScript bundle to load and then fetch data.

3. **TypeScript end-to-end.** Database query results, API response types, and UI prop types all share the same type definitions from `src/types/index.ts`. A schema change surfaces as a TypeScript error across every layer before it ever reaches production.

### Vercel (Hosting)

Vercel is the natural deployment target for Next.js — it was built by the same team. The practical advantages for KIU:

- **Zero-config deployment.** Pushing to the `main` branch on GitHub triggers an automatic build and deploy. The IT team does not need to manage servers, configure Nginx, or handle SSL certificates.
- **Edge Network.** Static assets and server-rendered pages are cached at Vercel's global edge locations. Students in Kampala connecting to the platform get fast response times without KIU needing to provision CDN infrastructure.
- **Preview Deployments.** Every pull request gets its own isolated preview URL. A feature branch for the Quickfire module can be tested by the team at `https://uems-quickfire-branch.vercel.app` before it touches production.
- **Serverless Functions.** Each `/api/*` route runs as an isolated serverless function. There is no long-running server process to monitor or restart.

### Supabase (PostgreSQL Database)

The database is hosted on **Supabase**, which provides a managed PostgreSQL 15 instance with a generous free tier and a production-ready Pro plan. This was chosen over a raw MySQL/XAMPP setup for the following reasons:

| Concern | Supabase Advantage |
|---|---|
| **Security** | Row-Level Security (RLS) is enforced at the database layer — not just in application code. A misconfigured API route cannot accidentally expose another student's records. |
| **Real-time** | Supabase's Realtime engine broadcasts database changes over WebSockets. The Quickfire assessment results and PhD candidate status updates push to connected clients without polling. |
| **Auth integration** | Supabase Auth provides email/password and future OAuth (Google Workspace SSO for KIU) without a separate auth server. |
| **Storage** | Thesis PDF uploads are stored in Supabase Storage, with signed URLs for secure download — no separate S3 bucket to configure. |
| **Developer experience** | The Supabase dashboard provides a visual table editor, query runner, log inspector, and RLS policy builder — significantly reducing DBA overhead. |
| **Mobile SDK** | The Flutter mobile apps (UEMS Mobile and Quickfire Exam Portal) connect directly to Supabase using the official `supabase_flutter` package, sharing the same RLS-protected database as the web app. |

> **Local development note:** The web application's `.env.local` still supports a local MySQL connection via `mysql2/promise` for developers who prefer XAMPP. The Supabase connection is the production default; MySQL is the local fallback. Both are supported by the same raw-SQL query layer — no ORM means no migration headaches switching between drivers.

---

## 📦 The Three Applications

The UEMS ecosystem is split into three purpose-built applications. This was a deliberate architectural decision: a single monolithic app serving students, administrators, and exam invigilators simultaneously would be bloated and hard to secure. Each application is scoped to its users' actual needs.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + RLS)                  │
│              Single database, shared across all apps             │
└──────────────┬──────────────────┬──────────────────────────────┘
               │                  │                       │
               ▼                  ▼                       ▼
  ┌────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
  │  UEMS-PHD-VV Web   │  │  UEMS Mobile     │  │  Quickfire Exam      │
  │  (Next.js, Vercel) │  │  (Flutter)       │  │  Portal (Flutter)    │
  │                    │  │                  │  │                      │
  │  Administrators    │  │  Students        │  │  Students (Kiosk)    │
  │  HODs, Lecturers   │  │  PhD Candidates  │  │  Lecturers           │
  │  Viva Coordinators │  │                  │  │                      │
  └────────────────────┘  └──────────────────┘  └──────────────────────┘
```

### 1. UEMS-PHD-VV Web — The Administration Suite

**Hosted on Vercel · Built with Next.js 14+ · Primary users: Staff**

This is the command centre. It is explicitly *not* a student-facing application — it is the tool that lecturers, HODs, viva coordinators, and administrators use to run the university's examination operations.

Common features that student portals typically include — timetable views, result feeds, course enrollment — have been **deliberately removed** from this application. This keeps the interface focused and fast for the staff users who spend hours in it every day, and means the codebase does not carry dead weight.

**What it does that the other apps do not:**

- Full exam paper creation workflow with hierarchical question builder and real-time preview
- Multi-stage HOD approval pipeline (`Draft → Submit → HOD Review → Ready for Print → Printed → Published`)
- Print queue management for the Exam Master
- PhD candidate lifecycle administration: register candidates, log thesis submissions, schedule vivás, assign examination panels, record evaluations and issue recommendations
- Quickfire Assessment creation: build MCQ/essay assessments for students without requiring HOD approval; manage timing, results visibility, and live student participation
- System-wide reporting: candidate status distribution, viva outcomes, programme completion rates, pending actions
- User, role, and permission management
- Audit logs and workflow history

**Why a separate web app for administration?**

University staff work on desktop computers with large screens. A web application is the right delivery mechanism — no app store approval delays, no device compatibility issues, instant deployment of updates. Vercel's serverless architecture means the system scales automatically during exam season peaks without KIU needing to provision extra server capacity.

---

### 2. UEMS Mobile — The Student Companion

**Built with Flutter 3.19+ · Backend: Supabase · Primary users: Students & PhD Candidates**

UEMS Mobile is a lightweight Flutter application that gives students access to the services they need on the go — without exposing any administrative functionality.

The application is intentionally minimal. It does not replicate the web app. It surfaces exactly the features students care about: when is my exam, where is it, what courses am I enrolled in, what is my viva status.

**Core features:**

| Feature | Who uses it |
|---|---|
| Exam Timetable | All students — real-time exam dates, venues, seat assignments |
| Course Enrollment | All students — register for courses each semester |
| Academic Reports | All students — performance reports and academic status |
| PhD Candidate Portal | PhD students — candidacy tracking, thesis version history, upcoming viva schedule |
| Push Notifications | All — alerts for exam changes, university announcements, viva updates |

**Architecture decisions:**

- **Supabase Flutter SDK** handles auth and data. Students sign in with their UEMS credentials (the same account used by staff on the web app — unified auth across the ecosystem).
- **Row-Level Security** is the security boundary. The mobile app uses the Supabase `anon` key (a publishable, non-secret key). All data access is controlled by RLS policies on the database — a student's query for `exam_timetable` only returns rows matching their `student_id`. The anon key cannot bypass RLS.
- **Graceful fallback.** If a backend table is missing or blocked by RLS during development, the data service falls back to realistic demo data. The app is usable and testable before the full schema is wired up.
- **Material 3 + Google Fonts (Inter).** Clean, familiar design that feels native on Android and iOS without custom design system overhead.

---

### 3. Quickfire Exam Portal — The Hardened Assessment Engine

**Built with Flutter 3.x · Backend: Supabase · Primary users: Students (in exam conditions)**

Quickfire is a purpose-built, security-hardened examination environment. It is the application students open when sitting a Quickfire assessment — a timed, invigilated, MCQ or essay-based test created by their lecturer directly in the UEMS web app.

This application exists as a separate app (not a screen inside UEMS Mobile) because its requirements are fundamentally different from a companion portal:

- It must enforce **Kiosk Mode** — fullscreen, no window switching, no back-button escape
- It must **lock the session** on any security violation and require supervisor re-entry
- It must **work offline** and sync on reconnect
- It must **persist lockdown state** across app restarts

Bundling these behaviours into UEMS Mobile would compromise both apps. UEMS Mobile would become unnecessarily complex and harder to maintain; Quickfire's security posture would be weakened by sharing a codebase with a general-purpose student portal.

**Security protocol (UEMS "Ironclad" Standard):**

| Layer | Mechanism |
|---|---|
| Kiosk Mode | Fullscreen enforcement + Always-On-Top via `window_manager` (Linux/Desktop) |
| Focus Loss | Immediate session lock if the app loses window focus |
| Minimization | Minimization attempt = security violation |
| Back-Button | `PopScope` intercepts all exit attempts with a formal confirmation dialog |
| Lockdown | High-visibility overlay; session locked until supervisor enters 4-digit PIN |
| Restart resistance | Lockdown state persisted to local storage — survives app termination |
| Data integrity | Answer auto-save via debounced background sync queue |
| Offline | Local cache + automatic sync on reconnection |
| Backend | Supabase RLS — students can only read/write their own submission records |

**Platform targets:**

Quickfire runs on **Linux Desktop** (the primary target — university computer labs run Ubuntu), **Android**, **iOS**, and **Web**. Security and lockdown protocols behave consistently across all targets via a unified `fullscreen.dart` bridge that dispatches to platform-specific implementations.

**How it connects to the web app:**

A lecturer creates a Quickfire assessment in the UEMS-PHD-VV web interface, sets the time limit and results visibility, and the assessment becomes live. Students open the Quickfire Flutter app, authenticate with their UEMS credentials, and see the assessment in their Tasks hub. Submissions flow back to Supabase where the lecturer can view results and export PDF reports — all from the web app.

---

## 🔐 Shared Authentication

All three applications share a single authentication system backed by Supabase Auth. A user's email and password work identically across the web app, UEMS Mobile, and Quickfire. Role assignment (student, lecturer, HOD, viva coordinator, admin) is stored on the `profiles` table and enforced by RLS policies — each application's queries automatically return only the data appropriate to the signed-in user's role.

---

## 📡 Data Flow Summary

```
Lecturer (Web App)
  → Creates Quickfire assessment
  → Supabase: inserts into quickfire_assessments

Student (Quickfire Flutter App)
  → Authenticates via Supabase Auth
  → Reads assessment (RLS: only their enrolled courses)
  → Submits answers (RLS: only their own submission rows)
  → Answers cached locally during offline periods
  → Synced to Supabase on reconnect

Lecturer (Web App)
  → Views results, exports PDF report
  → Supabase: reads all submissions for their assessments (RLS: own courses only)

PhD Candidate (UEMS Mobile)
  → Views viva schedule set by coordinator in Web App
  → Supabase: reads viva_schedules where candidate_id = their id (RLS)
  → Receives push notification when schedule changes
```

---

*Built with ❤️ by **Spider Tabs Ltd** for Kampala International University*
*Gava Hans · Ocen Isaac · Kamuntu David · Sempuwo Mathew David*