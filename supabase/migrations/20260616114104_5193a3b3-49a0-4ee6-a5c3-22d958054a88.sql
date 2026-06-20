
-- Tighten public-insert policies with minimal content checks
DROP POLICY IF EXISTS "Anyone can submit" ON public.submissions;
CREATE POLICY "Anyone can submit" ON public.submissions FOR INSERT
  WITH CHECK (length(name) > 0 AND length(website_url) > 5);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletters;
CREATE POLICY "Anyone can subscribe" ON public.newsletters FOR INSERT
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

DROP POLICY IF EXISTS "Anyone can log events" ON public.analytics_events;
CREATE POLICY "Anyone can log events" ON public.analytics_events FOR INSERT
  WITH CHECK (length(event_type) > 0 AND length(event_type) < 64);

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
