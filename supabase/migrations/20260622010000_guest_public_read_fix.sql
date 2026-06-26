-- ============================================================
-- Guest/anon read fixes
-- Root issue: anon SELECT policies referenced SECURITY DEFINER
-- public.has_role(), but execution is revoked from anon.
-- Fix: make anon-readable SELECT policies independent of has_role.
-- ============================================================

-- 1) TOOLS: allow anon to read only approved tools
DROP POLICY IF EXISTS "Approved tools public read" ON public.tools;
CREATE POLICY "Approved tools public read (anon only)"
  ON public.tools FOR SELECT
  TO anon
  USING (status = 'approved');

-- 2) TOOLS: allow authenticated/admin/editor and submitter to read non-approved
-- (create a separate policy for authenticated users)
DROP POLICY IF EXISTS "Approved tools authenticated read" ON public.tools;
CREATE POLICY "Approved tools authenticated read"
  ON public.tools FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
    OR auth.uid() = submitted_by
  );

-- 3) REVIEWS: ensure anon read is status-only (avoid has_role call for anon)
DROP POLICY IF EXISTS "Approved reviews public read" ON public.reviews;
CREATE POLICY "Approved reviews public read (anon only)"
  ON public.reviews FOR SELECT
  TO anon
  USING (status = 'approved');

DROP POLICY IF EXISTS "Approved reviews authenticated read" ON public.reviews;
CREATE POLICY "Approved reviews authenticated read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
  );

-- 4) BLOG POSTS: ensure anon read is published-only (avoid has_role call for anon)
DROP POLICY IF EXISTS "Published posts public read" ON public.blog_posts;
CREATE POLICY "Published posts public read (anon only)"
  ON public.blog_posts FOR SELECT
  TO anon
  USING (published = true);

DROP POLICY IF EXISTS "Published posts authenticated read" ON public.blog_posts;
CREATE POLICY "Published posts authenticated read"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (
    published = true
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
  );

-- 5) SUBMISSIONS: anon should not be able to SELECT submissions by design,
-- but ensure any existing SELECT policies that reference has_role are scoped.
-- The current schema grants SELECT to authenticated; so we don't change it.
-- (No policy change required.)

-- 6) Ensure RLS is enabled (idempotent)
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

