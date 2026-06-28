-- Migration to add AI integration metadata and SEO fields to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS import_source TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS ai_last_updated TIMESTAMPTZ;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS import_status TEXT;

-- SEO columns
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS seo_image TEXT;
