# PhD Lecturer Management System - Implementation Summary

## Overview
This document outlines the new PhD candidate management system for lecturers. Lecturers can now view their assigned PhD candidates and submit evaluations.

---

## 1. RBAC Permissions Added

**File**: `src/lib/rbac.ts`

Added the following permissions to the `lecturer` role:

```typescript
// PhD Management
'view_assigned_candidates',
'view_candidate_details',
'add_candidate_evaluations',
'edit_own_evaluations',
'view_candidate_evaluations',
'submit_viva_recommendations',
```

These permissions allow lecturers to:
- View candidates they supervise
- Add evaluations for viva examinations
- Edit their own submitted evaluations
- Submit viva recommendations

---

## 2. Navigation Updates

**File**: `src/data/headerNavLinks.ts`

Added navigation entry for lecturers:

```typescript
{
  title: '🎓 PhD Candidates',
  href: '/phd/my-candidates',
  roles: ['lecturer'],
}
```

The navigation link appears only for lecturers and directs them to their assigned candidates page.

---

## 3. API Routes Created

### 3.1 Get Assigned Candidates
**Route**: `GET /api/phd/my-candidates`

**File**: `src/app/api/phd/my-candidates/route.ts`

**Functionality**:
- Returns all PhD candidates assigned to the current lecturer
- Filters candidates where lecturer is supervisor or co-supervisor
- Includes counts of upcoming vivas and pending evaluations
- Supports pagination and status filtering
- Permission check: `view_assigned_candidates`

**Query Parameters**:
- `status`: Filter by candidate status (optional)
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "registration_number": "PHD/2024/001",
      "thesis_title": "...",
      "candidate_name": "...",
      "candidate_email": "...",
      "programme_name": "...",
      "status": "enrolled",
      "upcoming_vivas": 1,
      "pending_evaluations": 0,
      "enrolment_year": 2024,
      "updated_at": "2024-04-21T..."
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 3.2 Create/Update Evaluations
**Route**: `POST /api/phd/my-evaluations`

**File**: `src/app/api/phd/my-evaluations/route.ts`

**Functionality**:
- Creates or updates evaluation for a viva
- Verifies lecturer is authorized (supervisor of candidate)
- Validates scores are between 0-25 for each criterion
- Permission check: `add_candidate_evaluations`

**Request Body**:
```json
{
  "viva_id": 1,
  "originality_score": 20,
  "methodology_score": 22,
  "presentation_score": 18,
  "literature_score": 21,
  "strengths": "Excellent research design...",
  "weaknesses": "Some limitations...",
  "recommended_corrections": "Consider...",
  "general_comments": "..."
}
```

**Security**:
- Verifies viva exists for candidate
- Verifies lecturer is assigned as examiner
- Verifies lecturer is supervisor/co-supervisor of candidate
- Returns 403 Forbidden if unauthorized

---

### 3.3 Get Candidate Details (Updated)
**Route**: `GET /api/phd/candidates/[candidateId]`

**File**: `src/app/api/phd/candidates/[candidateId]/route.ts` (UPDATED)

**Changes**:
- Added `lecturer` to allowed roles
- Added permission check for lecturers
- Lecturers can only view candidates they supervise/co-supervise

**Permission Check**:
```typescript
if (user.role === 'lecturer') {
  // Must have 'view_candidate_details' permission
  // Must be supervisor or co-supervisor
}
```

---

## 4. UI Pages Created

### 4.1 My Candidates List Page
**Page**: `src/app/(dashboard)/phd/my-candidates/page.tsx`

**Features**:
- Displays all assigned PhD candidates in a table
- Shows candidate details: registration number, name, email, programme, thesis title
- Real-time status badges with color coding
- Upcoming vivas count
- Pagination support (10 items per page)
- Status filtering dropdown
- Statistics cards showing:
  - Total candidates count
  - Active vivas count
  - Pending evaluations count
  - Enrolled candidates count

**Navigation**:
- "View" link for each candidate leads to candidate detail page
- Back button to navigate within app

---

### 4.2 PhD Layout
**File**: `src/app/(dashboard)/phd/layout.tsx`

**Features**:
- Authorization wrapper for PhD section
- Verifies user has PhD-related roles
- Shows loading state during auth check
- Shows error if user not authorized

---

## 5. Database Schema Requirements

The system assumes the following database tables exist:

1. **phd_candidates**
   - `id` (PK)
   - `user_id` (FK to staff)
   - `registration_number`
   - `thesis_title`
   - `programme_id` (FK)
   - `supervisor_id` (FK to staff)
   - `co_supervisor_id` (FK to staff, nullable)
   - `status` (ENUM: enrolled, thesis_submitted, viva_scheduled, viva_completed...)
   - `deleted_at`

2. **viva_schedules**
   - `id` (PK)
   - `candidate_id` (FK)
   - `scheduled_date`
   - `scheduled_time`
   - `venue`
   - `status` (ENUM: scheduled, in_progress, completed...)

3. **viva_examiners**
   - `id` (PK)
   - `viva_id` (FK)
   - `examiner_id` (FK to staff)
   - `role` (chairperson, internal_examiner, external_examiner)

4. **viva_evaluations**
   - `id` (PK)
   - `viva_id` (FK)
   - `examiner_id` (FK)
   - `originality_score`
   - `methodology_score`
   - `presentation_score`
   - `literature_score`
   - `strengths`
   - `weaknesses`
   - `recommended_corrections`
   - `general_comments`
   - `created_at`
   - `updated_at`

---

## 6. User Workflows

### Workflow 1: View Assigned Candidates
1. Lecturer logs in
2. Clicks "🎓 PhD Candidates" in navigation
3. Sees list of all candidates they supervise
4. Can filter by status
5. Can paginate through results
6. Can click "View" to see candidate details

### Workflow 2: Add Evaluation
1. Lecturer clicks "View" on a candidate
2. Views candidate details on right sidebar
3. Sees "Add Evaluation" form
4. Selects viva from dropdown (only shows upcoming vivas)
5. Fills in evaluation criteria scores (0-25 each)
6. Adds strengths, weaknesses, recommendations
7. Clicks "Submit Evaluation"
8. Success message appears

### Workflow 3: Update Evaluation
1. Lecturer navigates to candidate
2. Selects viva again
3. Form pre-fills with existing evaluation data
4. Modifies scores/comments
5. Clicks "Submit Evaluation"
6. Evaluation is updated

---

## 7. Security Considerations

### Authorization Checks
- ✅ Lecturers can only view their own assigned candidates
- ✅ Lecturers can only add evaluations for candidates they supervise
- ✅ Lecturers can only edit their own evaluations
- ✅ Score validation (0-25 for each criterion)
- ✅ Viva existence verification
- ✅ Examiner role verification

### Permission Gates
- All endpoints check for appropriate permissions
- Lecturer role requires specific PhD permissions
- Role-based navigation in UI

---

## 8. How to Use

### For Lecturers:

1. **Access PhD Candidates**
   ```
   Visit: http://yourapp.com/phd/my-candidates
   ```

2. **View a Candidate**
   ```
   Click "View" on any candidate in the list
   ```

3. **Add/Edit Evaluation**
   ```
   - Select viva from dropdown
   - Fill in evaluation criteria (optional, but recommended)
   - Add detailed feedback
   - Click "Submit Evaluation"
   ```

### For Administrators:

The existing PhD admin dashboard at `/phd` remains unchanged and provides full PhD management capabilities for administrators.

---

## 9. Future Enhancements

Possible future improvements:

1. **Email Notifications**
   - Notify lecturers when new vivas are scheduled
   - Remind of pending evaluations
   - Confirm evaluation submissions

2. **Evaluation Templates**
   - Pre-defined evaluation templates
   - Quick selection of common phrases
   - Rubric guidance

3. **Batch Operations**
   - Bulk export evaluations
   - Generate evaluation reports

4. **Real-time Collaboration**
   - View other examiners' evaluations (after completion)
   - Compare scores and comments
   - Discussion threads

5. **Mobile App**
   - Mobile-responsive evaluation form
   - Offline capability

---

## 10. Testing Checklist

- [ ] Lecturer can view assigned candidates list
- [ ] Can filter by status
- [ ] Pagination works correctly
- [ ] Can click View to see candidate details
- [ ] Cannot view candidates not assigned to them
- [ ] Can see upcoming vivas for candidate
- [ ] Can add evaluation scores
- [ ] Scores validate (0-25 range)
- [ ] Cannot add evaluations for candidates not supervised
- [ ] Can update existing evaluations
- [ ] Success/error messages display
- [ ] Admin dashboard still works normally
- [ ] Navigation shows PhD link only for lecturers

---

## 11. File Structure

```
src/
├── lib/
│   └── rbac.ts (MODIFIED - added lecturer PhD permissions)
├── data/
│   └── headerNavLinks.ts (MODIFIED - added PhD nav for lecturers)
├── app/
│   ├── api/
│   │   └── phd/
│   │       ├── my-candidates/
│   │       │   └── route.ts (NEW)
│   │       ├── my-evaluations/
│   │       │   └── route.ts (NEW)
│   │       └── candidates/
│   │           └── [candidateId]/
│   │               └── route.ts (MODIFIED - added lecturer access)
│   └── (dashboard)/
│       └── phd/
│           ├── layout.tsx (MODIFIED - added authorization)
│           └── my-candidates/
│               └── page.tsx (NEW)
```

---

## 12. Contributing

When modifying this system:

1. Update both API and UI components
2. Ensure permission checks are in place
3. Test with lecturer role
4. Test with different candidate assignments
5. Verify authorization checks work

---

**Last Updated**: April 21, 2024
**Version**: 1.0
**Status**: Ready for User Testing
