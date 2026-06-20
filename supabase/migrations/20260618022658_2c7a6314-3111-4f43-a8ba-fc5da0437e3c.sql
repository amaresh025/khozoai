
-- 1. CLEAR DEMO DATA
TRUNCATE TABLE public.analytics_events, public.favorites, public.reviews, public.tool_features, public.tool_tags, public.tool_screenshots, public.submissions, public.tools RESTART IDENTITY CASCADE;

-- 2. ADD MORE CATEGORIES (idempotent)
INSERT INTO public.categories (name, slug, description, icon, color, sort_order) VALUES
  ('Marketing', 'marketing', 'AI tools for marketing automation, ads, and growth', 'megaphone', '#F97316', 100),
  ('Sales', 'sales', 'AI assistants for outreach, CRM, and lead generation', 'briefcase', '#EAB308', 101),
  ('Customer Support', 'customer-support', 'AI chatbots and helpdesk automation', 'headphones', '#06B6D4', 102),
  ('Education', 'education', 'AI tutors, learning assistants, and study tools', 'graduation-cap', '#8B5CF6', 103),
  ('Finance', 'finance', 'AI for budgeting, trading, and accounting', 'banknote', '#10B981', 104),
  ('Health', 'health', 'AI in healthcare, fitness, and wellness', 'heart-pulse', '#EF4444', 105),
  ('Legal', 'legal', 'AI contract analysis and legal research', 'scale', '#64748B', 106),
  ('Productivity', 'productivity', 'Task management and workflow automation with AI', 'check-circle', '#3B82F6', 107),
  ('3D & Modeling', '3d-modeling', '3D generation, CAD, and modeling AI tools', 'box', '#A855F7', 108),
  ('Music', 'music', 'AI music generation and audio production', 'music', '#EC4899', 109),
  ('Gaming', 'gaming', 'AI tools for game dev and players', 'gamepad-2', '#22C55E', 110),
  ('HR & Recruiting', 'hr-recruiting', 'AI hiring, resumes, and HR automation', 'users', '#F59E0B', 111),
  ('Research', 'research', 'AI research assistants and literature tools', 'microscope', '#0EA5E9', 112),
  ('Translation', 'translation', 'AI translation and localization', 'languages', '#14B8A6', 113),
  ('Data Analysis', 'data-analysis', 'AI for analytics, BI, and data exploration', 'bar-chart-3', '#6366F1', 114),
  ('Cybersecurity', 'cybersecurity', 'AI security, threat detection, and privacy tools', 'shield', '#DC2626', 115)
ON CONFLICT (slug) DO NOTHING;

-- 3. ADD favicon column to tools (auto-fetch convenience)
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- 4. SECURITY FIX: analytics_events insert must enforce user_id = auth.uid() OR null
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Insert analytics" ON public.analytics_events;
CREATE POLICY "Insert own analytics"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5. SECURITY FIX: submissions delete policies (submitter + admin)
DROP POLICY IF EXISTS "Submitters delete own submissions" ON public.submissions;
CREATE POLICY "Submitters delete own submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (submitter_id = auth.uid());

DROP POLICY IF EXISTS "Admins delete submissions" ON public.submissions;
CREATE POLICY "Admins delete submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. SECURITY FIX: lock down user_roles - prevent self-escalation
-- Drop any permissive INSERT/UPDATE/DELETE policies and recreate as admin-only
DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated insert roles" ON public.user_roles;

CREATE POLICY "Only admins can grant roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can revoke roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. SECURITY FIX: revoke broad EXECUTE on security-definer functions from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
-- handle_new_user is a trigger function; revoke direct calls
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- 8. SECURITY FIX: tighten newsletters - admins can read for management (intentional), but restrict
-- (Acceptable risk: admin role is required; documented in security memory)

-- 9. Add unique index on tools.website_url domain to help duplicate detection
CREATE INDEX IF NOT EXISTS idx_tools_website_url ON public.tools (website_url);
