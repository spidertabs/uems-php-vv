# 🧪 Integration Testing - Step-by-Step Setup

Your project files are ready. Follow these steps to complete the integration testing setup:

## ✅ Files You Need

All SQL files are in: `/home/mango/Projects/vivavoce/sql/`

```
sql/execute_query_function.sql   ← RPC Function (MUST CREATE FIRST)
sql/schema.sql                    ← Create tables (1 of 5)
sql/seed.sql                      ← Test data (2 of 5)
sql/questions.sql                 ← Questions (3 of 5)
sql/study_units.sql               ← Study units (4 of 5)
sql/viva.sql                       ← PhD viva (5 of 5)
```

---

## 🚀 Step-by-Step Instructions

### STEP 1: Create RPC Function (5 minutes)

**Location**: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/sql/new

1. Open the Supabase SQL Editor (link above)
2. Open `/home/mango/Projects/vivavoce/sql/execute_query_function.sql`
3. Copy **ALL** the content
4. Paste into Supabase SQL Editor
5. Click the blue **"Run"** button
6. ✅ Should see: `CREATE FUNCTION`

---

### STEP 2: Import Schema Files (10 minutes)

For **EACH** of these files in order:

1. `sql/schema.sql`
2. `sql/seed.sql`
3. `sql/questions.sql`
4. `sql/study_units.sql`
5. `sql/viva.sql`

**For each file**:
1. Open: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/sql/new
2. Open the file from your project
3. Copy **ALL** content
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Wait for success message
7. Move to next file

---

### STEP 3: Verify Setup (2 minutes)

✅ **Verify Tables Exist**:
- Go to: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/editor
- Click "users" table in left sidebar
- Should see these test users:
  - admin@uems.ac.ug
  - hod.cs@uems.ac.ug
  - lect.cs1@uems.ac.ug
  - viva.coord1@uems.ac.ug

✅ **Verify RPC Function**:
- Go to: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/database/functions
- Should see: `public.execute_query`

✅ **Verify Tables Created**:
- Click table selector in editor
- Should show: colleges, departments, users, questions, etc.

---

##🧪 Run Integration Tests

Once all manual steps are complete:

**Terminal 1** (Start dev server):
```bash
cd /home/mango/Projects/vivavoce
npm run dev
```

Wait for message: `✓ Ready in XXXms`

**Terminal 2** (Run tests):
```bash
cd /home/mango/Projects/vivavoce
npm run test:integration
```

---

## ✅ Expected Results

```
 Test Files  1 passed (1)
      Tests  40 passed | 0 failed | 0 skipped (40)
   Start at  00:57:14
   Duration  4.30s
```

If you see: **✅ 40 passed** → Setup complete! 🎉

---

## 🐛 Troubleshooting

### Error: "Could not find the function public.execute_query"
→ STEP 1 didn't work. Verify:
- [ ] execute_query function was created
- [ ] No SQL errors when creating it

### Error: "Relation 'public.users' does not exist"
→ STEP 2 didn't work. Verify:
- [ ] All 5 SQL files were imported in order
- [ ] No SQL errors during import

### Tests still failing after setup
→ Run this in Supabase SQL Editor to debug:
```sql
SELECT COUNT(*) as user_count FROM users;
SELECT * FROM users WHERE email = 'admin@uems.ac.ug';
SELECT public.execute_query('SELECT 1', '[]'::jsonb);
```

---

## 📞 Getting Help

If setup fails:
1. Check `.env.local` has correct Supabase credentials
2. Verify all 6 SQL files completed without errors
3. Check Supabase dashboard for any error messages
4. Try these debug commands in Supabase SQL Editor:
   ```sql
   -- Check function exists
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'execute_query';
   
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' LIMIT 10;
   
   -- Check test data
   SELECT COUNT(*) as user_count FROM users;
   ```
