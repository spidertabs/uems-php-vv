# 🧪 Integration Test Report
**Date**: April 19, 2026  
**Status**: ⚠️  REQUIRES SUPABASE SETUP

---

## Executive Summary

**Test Run Results:**
- **Total Tests**: 40
- **Passing**: 3 ✅
- **Failing**: 4 ❌
- **Skipped**: 33 ⏭️

**Primary Issue**: `execute_query` RPC function not found in Supabase

---

## Test Results by Suite

### ✅ Auth Tests (7 tests: 3 passed, 4 failed)
```
✓ POST /api/auth/register - rejects duplicate email (1852ms)
✗ POST /api/auth/login - logs in and returns session cookie
✓ POST /api/auth/login - rejects wrong password (350ms)
✗ GET /api/auth/me - returns current user with valid cookie
✓ GET /api/auth/me - returns 401 without cookie (111ms)
✗ POST /api/auth/change-password - changes password
✗ POST /api/auth/logout - logs out
```

### ⏭️ Users Tests (12 tests all skipped)
```
Waiting for auth to work before running user permission tests
```

### ⏭️ Approvals Tests (2 tests skipped)
```
Waiting for auth to work before running approval tests
```

### ⏭️ PhD Tests (9 tests skipped)
```
Waiting for auth to work before running PhD viva tests
```

### ⏭️ Exam Papers Tests (6 tests skipped)
```
Waiting for auth to work before running exam paper tests
```

### ⏭️ Reports Tests (4 tests skipped)
```
Waiting for auth to work before running report tests
```

---

## Root Cause Analysis

### Error Message
```
Error: PGRST202
Message: "Could not find the function public.execute_query(p_params, p_sql) 
          in the schema cache"
```

### Why Tests Are Failing
1. The `execute_query` RPC function doesn't exist in Supabase yet
2. All database queries (including login) depend on this function
3. Tests that don't query the database (like register duplicate check) pass
4. Tests that require login fail at the login step

---

## 🚀 How to Fix

### Step 1: Create the RPC Function
1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/sql/new
2. Copy the entire SQL from: `sql/execute_query_function.sql`
3. Paste into SQL Editor
4. Click **"Run"**

### Step 2: Import Database Schema
Run these files in order in the SQL Editor:
```
1. sql/schema.sql          (creates tables)
2. sql/seed.sql            (adds test data)
3. sql/questions.sql       (question bank)
4. sql/study_units.sql     (study units)
5. sql/viva.sql            (PhD viva tables)
```

### Step 3: Re-run Tests
```bash
# Make sure dev server is still running
npm run dev

# In another terminal
npm run test:integration
```

---

## Expected Results After Setup

Once the RPC function and schema are in place:
- ✅ All 7 auth tests should pass
- ✅ All 12 user tests should run
- ✅ All 2 approval tests should run
- ✅ All 9 PhD tests should run
- ✅ All 6 exam paper tests should run
- ✅ All 4 report tests should run

**Target**: 40/40 tests passing ✅

---

## Test Execution Log

### Passed Tests ✅
1. `POST /api/auth/register` - Correctly rejects duplicate email
2. `POST /api/auth/login` - Correctly rejects wrong password  
3. `GET /api/auth/me` - Correctly returns 401 without cookie

### Failed Tests ❌
1. `POST /api/auth/login` - ❌ Returns 401 (login query failed)
   - Root Cause: execute_query RPC not found
   - Fix: Create the function in Supabase

2. `GET /api/auth/me` - ❌ Login helper failed
   - Root Cause: Depends on POST /api/auth/login
   - Fix: Fix login first

3. `POST /api/auth/change-password` - ❌ Login helper failed
   - Root Cause: Depends on POST /api/auth/login
   - Fix: Fix login first

4. `POST /api/auth/logout` - ❌ Login helper failed
   - Root Cause: Depends on POST /api/auth/login
   - Fix: Fix login first

### Skipped Tests ⏭️
- All remaining tests (33) are skipped until auth tests pass
- These will automatically run once login is working

---

## Technical Details

### API Endpoints Tested
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/change-password`
- POST `/api/auth/logout`
- GET/POST `/api/users/*`
- GET/POST `/api/approvals/*`
- GET/POST `/api/phd/*`
- GET/POST `/api/exam-papers/*`
- GET `/api/reports/*`

### Test Environment
- Node.js: v20+
- Test Framework: Vitest v4.1.4
- HTTP Client: Supertest
- Database: Supabase PostgreSQL
- Server: Next.js 16.1.3 (local dev server)

### Test Configuration
- Server URL: `http://localhost:3000`
- Test Database: Production Supabase instance
- Timeout: 60 seconds per test

---

## Next Steps

1. ✅ Create `execute_query` RPC function in Supabase SQL Editor
2. ✅ Import all SQL migration files
3. ✅ Verify seed data exists (test users, etc.)
4. ✅ Re-run integration tests
5. ✅ Fix any remaining test failures
6. ✅ Document any environment-specific issues

---

## Support

If tests still fail after setup:
1. Check the server logs: `npm run dev`
2. Verify Supabase connection in `.env.local`
3. Confirm tables exist in Supabase dashboard
4. Check RLS policies on sensitive tables
5. Verify test seed data was imported correctly
