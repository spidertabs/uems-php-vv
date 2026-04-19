# Supabase Setup Guide

## ✅ Credentials Set Up
Your `.env.local` has been updated with:
- **Supabase URL**: https://zgklfrakozlpjheecatj.supabase.co
- **Anon Key**: `sb_publishable_HE8bVvS1xLpji_2TuMwNUA_Wt2Q1Ttz`

## 🔧 Required: Create SQL Function in Supabase

The app uses an RPC function called `execute_query` to run parameterised SQL.
The corrected function is in **[sql/execute_query_function.sql](sql/execute_query_function.sql)**.

### Steps:
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/sql/new)
2. Copy the **entire contents** of `sql/execute_query_function.sql`
3. Paste and click **"Run"**

> ⚠️ The old one-liner version shown below is **broken** for multi-row queries.
> Always use the version from `sql/execute_query_function.sql`.

## 📊 Database Schema

Your database tables should match the schema in:
- [sql/schema.sql](sql/schema.sql)
- [sql/seed.sql](sql/seed.sql)
- [sql/questions.sql](sql/questions.sql)
- [sql/study_units.sql](sql/study_units.sql)
- [sql/viva.sql](sql/viva.sql)

### Run migrations in Supabase:
1. Go to SQL Editor in Supabase
2. Run each SQL file from `./sql/` directory in order:
   - schema.sql (creates tables)
   - seed.sql (adds initial data)
   - questions.sql
   - study_units.sql
   - viva.sql

## 🚀 Run Your Project

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## 🔐 Authentication
- Credentials are stored in Supabase `users` table
- Sessions are managed in `sessions` table
- Use JWT tokens for API authentication

## ⚠️ Important Notes

- **RLS Policies**: Enable Row Level Security (RLS) on sensitive tables
- **Service Role Key**: Keep the service role key private (already in `.env.local`)
- **Anon Key**: Safe to expose (used in frontend)

## 🐛 Testing Connection

The app will automatically test the database connection on startup. Check the terminal for:
```
✅ Database connection successful
```

## 📝 Troubleshooting

### "Missing Supabase environment variables"
- Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "RPC function execute_query not found"
- Create the SQL function in Supabase following the steps above

### Connection timeout
- Check firewall rules in Supabase project settings
- Ensure your IP is whitelisted
