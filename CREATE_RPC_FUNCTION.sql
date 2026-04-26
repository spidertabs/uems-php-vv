-- ============================================================
-- SUPABASE RPC FUNCTION: execute_query
-- Purpose: Execute parameterized SQL queries from the app
-- 
-- ⚠️ COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/zgklfrakozlpjheecatj/sql/new
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_query(
  p_sql    TEXT,
  p_params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  n        INTEGER;
BEGIN
  n := COALESCE(jsonb_array_length(p_params), 0);

  IF n = 0 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result;

  ELSIF n = 1 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0);

  ELSIF n = 2 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1);

  ELSIF n = 3 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2);

  ELSIF n = 4 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3);

  ELSIF n = 5 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4);

  ELSIF n = 6 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4), (p_params->>5);

  ELSIF n = 7 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4), (p_params->>5), (p_params->>6);

  ELSIF n = 8 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4), (p_params->>5), (p_params->>6), (p_params->>7);

  ELSIF n = 9 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4), (p_params->>5), (p_params->>6), (p_params->>7),
          (p_params->>8);

  ELSIF n = 10 THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]'') FROM (%s) t', p_sql
    ) INTO v_result
    USING (p_params->>0), (p_params->>1), (p_params->>2), (p_params->>3),
          (p_params->>4), (p_params->>5), (p_params->>6), (p_params->>7),
          (p_params->>8), (p_params->>9);

  ELSE
    RAISE EXCEPTION 'execute_query supports up to 10 parameters, got %', n;
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'execute_query [%]: %', SQLSTATE, SQLERRM;
END;
$$;

-- Allow both the anonymous and authenticated Supabase roles to call this function
GRANT EXECUTE ON FUNCTION public.execute_query(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_query(TEXT, JSONB) TO authenticated;

-- ============================================================
-- SUPABASE RPC FUNCTION: execute_write
-- Purpose: Execute parameterized UPDATE/DELETE/INSERT statements
-- 
-- ⚠️ ADD THIS TO YOUR SUPABASE SQL EDITOR
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_write(
  p_sql    TEXT,
  p_params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  n := COALESCE(jsonb_array_length(p_params), 0);

  IF n = 0 THEN
    EXECUTE p_sql;

  ELSIF n = 1 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT;

  ELSIF n = 2 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT;

  ELSIF n = 3 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT;

  ELSIF n = 4 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT;

  ELSIF n = 5 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT;

  ELSIF n = 6 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT, (p_params->>5)::TEXT;

  ELSIF n = 7 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT, (p_params->>5)::TEXT,
          (p_params->>6)::TEXT;

  ELSIF n = 8 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT, (p_params->>5)::TEXT,
          (p_params->>6)::TEXT, (p_params->>7)::TEXT;

  ELSIF n = 9 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT, (p_params->>5)::TEXT,
          (p_params->>6)::TEXT, (p_params->>7)::TEXT, (p_params->>8)::TEXT;

  ELSIF n = 10 THEN
    EXECUTE p_sql
    USING (p_params->>0)::TEXT, (p_params->>1)::TEXT, (p_params->>2)::TEXT,
          (p_params->>3)::TEXT, (p_params->>4)::TEXT, (p_params->>5)::TEXT,
          (p_params->>6)::TEXT, (p_params->>7)::TEXT, (p_params->>8)::TEXT,
          (p_params->>9)::TEXT;

  ELSE
    RAISE EXCEPTION 'execute_write supports up to 10 parameters, got %', n;
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'execute_write [%]: %', SQLSTATE, SQLERRM;
END;
$$;

-- Allow both the anonymous and authenticated Supabase roles to call this function
GRANT EXECUTE ON FUNCTION public.execute_write(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_write(TEXT, JSONB) TO authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to test if the functions work:
-- ============================================================
-- SELECT public.execute_query('SELECT version()', '[]'::jsonb);
-- SELECT public.execute_write('UPDATE staff SET last_login = NOW() WHERE id = $1', '["1"]'::jsonb);
