#!/bin/bash
# 🚀 COMPLETE SUPABASE SETUP FOR INTEGRATION TESTING
# This script provides all the SQL commands you need to run

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   🧪 INTEGRATION TESTING SETUP FOR VIVAVOCE"
echo "════════════════════════════════════════════════════════════════"
echo ""

PROJECT="zgklfrakozlpjheecatj"
DASHBOARD="https://supabase.com/dashboard/project/${PROJECT}"

echo "📊 Your Supabase Project Details:"
echo "   Project ID: $PROJECT"
echo "   Dashboard: $DASHBOARD"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "⚠️  MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "👉 STEP 1: Create the execute_query() RPC Function"
echo "───────────────────────────────────────────────────────────────"
echo ""
echo "1️⃣  Open Supabase SQL Editor:"
echo "   $DASHBOARD/sql/new"
echo ""
echo "2️⃣  Copy the SQL from this file:"
echo "   $(pwd)/CREATE_RPC_FUNCTION.sql"
echo ""
echo "3️⃣  Paste into the SQL Editor"
echo ""
echo "4️⃣  Click the blue 'Run' button"
echo ""
echo "✅  Success: You should see 'CREATE FUNCTION' message"
echo ""

echo "────────────────────────────────────────────────────────────────"
echo "👉 STEP 2: Import Database Schema (5 files in order)"
echo "────────────────────────────────────────────────────────────────"
echo ""

SQL_FILES=(
  "sql/schema.sql"
  "sql/seed.sql"
  "sql/questions.sql"
  "sql/study_units.sql"
  "sql/viva.sql"
)

for i in "${!SQL_FILES[@]}"; do
  num=$((i + 1))
  echo "File $num/5: ${SQL_FILES[$i]}"
  
  if [ -f "${SQL_FILES[$i]}" ]; then
    echo "  ✅ File exists"
    lines=$(wc -l < "${SQL_FILES[$i]}")
    echo "  📝 Lines: $lines"
  else
    echo "  ❌ File NOT found!"
  fi
  echo ""
done

echo "📋 How to import each file:"
echo ""
echo "   For EACH file above:"
echo "   1. Open: $DASHBOARD/sql/new"
echo "   2. Open file from project:"
echo "      $(pwd)/<filename>"
echo "   3. Copy ALL content"
echo "   4. Paste into Supabase SQL Editor"
echo "   5. Click 'Run'"
echo "   6. Verify success message"
echo ""

echo "────────────────────────────────────────────────────────────────"
echo "👉 STEP 3: Verify Setup in Supabase"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "After completing steps 1-2, verify:"
echo ""
echo "1️⃣  Check Tables:"
echo "   $DASHBOARD/editor"
echo "   Should show: users, colleges, departments, programmes, etc"
echo ""
echo "2️⃣  Check Test Users:"
echo "   Click 'users' table"
echo "   Should contain:"
echo "   - admin@uems.ac.ug"
echo "   - hod.cs@uems.ac.ug"
echo "   - lect.cs1@uems.ac.ug"
echo "   - viva.coord1@uems.ac.ug"
echo ""
echo "3️⃣  Check RPC Function:"
echo "   $DASHBOARD/database/functions"
echo "   Should show: public.execute_query"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "🧪 RUN INTEGRATION TESTS (After manual setup complete)"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "Once all manual steps are complete, run:"
echo ""
echo "Terminal 1 (dev server):"
echo "  $ cd $(pwd)"
echo "  $ npm run dev"
echo ""
echo "Wait for 'Ready in XXXms', then..."
echo ""
echo "Terminal 2 (tests):"
echo "  $ cd $(pwd)"
echo "  $ npm run test:integration"
echo ""

echo "Expected Results:"
echo "  ✅ Dev server: http://localhost:3000"
echo "  ✅ Tests: 40 total, 40 passing, 0 failing"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "📚 DOCUMENTATION"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "See these files for more info:"
echo "  - SUPABASE_QUICK_SETUP.md"
echo "  - TEST_REPORT.md"
echo "  - INTEGRATION_TESTING.md"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo ""
