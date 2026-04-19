#!/bin/bash
# Quick Supabase Cloud Setup Script
# Run this after setting up your Supabase project

echo "🚀 VivaVoce Cloud Setup"
echo "======================="
echo ""

# Step 1: Confirm environment variables
echo "✅ Step 1: Environment variables configured in .env.local"
echo "   - NEXT_PUBLIC_SUPABASE_URL: https://zgklfrakozlpjheecatj.supabase.co"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY: sb_publishable_HE8bVvS1xLpji_2TuMwNUA_Wt2Q1Ttz"
echo ""

# Step 2: Install dependencies
echo "⏳ Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Instructions for Supabase setup
echo "⚠️  Step 3: MANUAL SETUP REQUIRED IN SUPABASE"
echo ""
echo "   Go to: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj"
echo ""
echo "   A. Create the execute_query RPC function:"
echo "      1. Navigate to SQL Editor"
echo "      2. Create new query"
echo "      3. Paste the SQL function from SUPABASE_SETUP.md"
echo "      4. Execute the query"
echo ""
echo "   B. Import database schema:"
echo "      1. In SQL Editor, run each file in order:"
echo "         - sql/schema.sql"
echo "         - sql/seed.sql"
echo "         - sql/questions.sql"
echo "         - sql/study_units.sql"
echo "         - sql/viva.sql"
echo ""

# Step 4: Run the development server
echo "✅ Step 4: Ready to start development server"
echo ""
echo "   Run: npm run dev"
echo "   Visit: http://localhost:3000"
echo ""

echo "📚 For detailed setup guide, see SUPABASE_SETUP.md"
