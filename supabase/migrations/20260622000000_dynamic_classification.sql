-- ============================================================
-- Dynamic Classification System Migration
-- Adds capabilities, use_cases, industries, best_for, not_good_for
-- to tools table with GIN indexes for fast array queries.
-- ============================================================

-- 1. Add new columns to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS capabilities TEXT[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS industries TEXT[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS best_for TEXT[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS not_good_for TEXT[];

-- 2. Create GIN indexes for fast array containment queries
CREATE INDEX IF NOT EXISTS tools_capabilities_idx ON public.tools USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS tools_industries_idx ON public.tools USING GIN (industries);
CREATE INDEX IF NOT EXISTS tools_use_cases_idx ON public.tools USING GIN (use_cases);
CREATE INDEX IF NOT EXISTS tools_best_for_idx ON public.tools USING GIN (best_for);

-- 3. Dynamic category function: returns capability -> tool count
CREATE OR REPLACE FUNCTION public.dynamic_categories()
RETURNS TABLE(capability TEXT, tool_count BIGINT)
LANGUAGE SQL STABLE
AS $$
  SELECT unnest(capabilities) AS capability, COUNT(*) AS tool_count
  FROM public.tools
  WHERE status = 'approved' AND capabilities IS NOT NULL AND array_length(capabilities, 1) > 0
  GROUP BY capability
  ORDER BY tool_count DESC;
$$;

-- 4. Dynamic use case function: returns use_case -> tool count
CREATE OR REPLACE FUNCTION public.dynamic_use_cases()
RETURNS TABLE(use_case TEXT, tool_count BIGINT)
LANGUAGE SQL STABLE
AS $$
  SELECT unnest(use_cases) AS use_case, COUNT(*) AS tool_count
  FROM public.tools
  WHERE status = 'approved' AND use_cases IS NOT NULL AND array_length(use_cases, 1) > 0
  GROUP BY use_case
  ORDER BY tool_count DESC;
$$;

-- 5. Dynamic industry function: returns industry -> tool count
CREATE OR REPLACE FUNCTION public.dynamic_industries()
RETURNS TABLE(industry TEXT, tool_count BIGINT)
LANGUAGE SQL STABLE
AS $$
  SELECT unnest(industries) AS industry, COUNT(*) AS tool_count
  FROM public.tools
  WHERE status = 'approved' AND industries IS NOT NULL AND array_length(industries, 1) > 0
  GROUP BY industry
  ORDER BY tool_count DESC;
$$;

-- 6. Tool count by any array column (flexible function)
CREATE OR REPLACE FUNCTION public.tag_counts(_column_name TEXT, _table_name TEXT DEFAULT 'tools')
RETURNS TABLE(tag TEXT, count BIGINT)
LANGUAGE SQL STABLE
AS $$
  EXECUTE format(
    'SELECT unnest(%I) AS tag, COUNT(*) AS count FROM public.%I WHERE status = ''approved'' AND %I IS NOT NULL AND array_length(%I, 1) > 0 GROUP BY tag ORDER BY count DESC',
    _column_name, _table_name, _column_name, _column_name
  );
$$;

-- 7. Backward compatibility: set category_id from primary capability
-- This maps capability names to existing category slugs
UPDATE public.tools t
SET category_id = c.id
FROM public.categories c
WHERE t.category_id IS NULL
  AND t.capabilities IS NOT NULL
  AND array_length(t.capabilities, 1) > 0
  AND (
    (c.slug = 'research' AND t.capabilities[1] ILIKE '%research%')
    OR (c.slug = 'productivity' AND t.capabilities[1] ILIKE '%productivity%')
    OR (c.slug = 'translation' AND t.capabilities[1] ILIKE '%translation%')
    OR (c.slug = 'data-analysis' AND t.capabilities[1] ILIKE '%data analysis%')
    OR (c.slug = 'cybersecurity' AND t.capabilities[1] ILIKE '%security%')
    OR (c.slug = 'education' AND t.capabilities[1] ILIKE '%education%')
    OR (c.slug = 'marketing' AND t.capabilities[1] ILIKE '%seo%' OR t.capabilities[1] ILIKE '%marketing%')
  );

-- 8. Add RLS policies for the new functions (public read)
GRANT EXECUTE ON FUNCTION public.dynamic_categories() TO anon;
GRANT EXECUTE ON FUNCTION public.dynamic_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dynamic_use_cases() TO anon;
GRANT EXECUTE ON FUNCTION public.dynamic_use_cases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dynamic_industries() TO anon;
GRANT EXECUTE ON FUNCTION public.dynamic_industries() TO authenticated;
