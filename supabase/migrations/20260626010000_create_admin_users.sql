-- SQL migration to create admin_users table for AI Directory admin panel authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant select access
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.admin_users TO anon;
GRANT ALL ON public.admin_users TO service_role;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Admin users are viewable by anyone" ON public.admin_users FOR SELECT USING (true);

-- Seed existing admin user
INSERT INTO public.admin_users (id, email)
VALUES ('51f74818-f327-4c4b-a246-ba4ffe8770ea', 'amareshkumar7525@gmail.com')
ON CONFLICT (id) DO NOTHING;
