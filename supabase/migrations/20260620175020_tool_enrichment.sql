-- Add enrichment columns to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS key_summary TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS secondary_categories TEXT[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS use_cases TEXT[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS compare_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;
