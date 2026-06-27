-- Fix RLS policies broken by removal of has_role function.
-- Migration 20260626000000 dropped has_role CASCADE, which removed
-- all policies referencing it, including the tools FOR ALL policy
-- and the authenticated SELECT policy on tools.

-- ============================================================
-- HOTFIX: contact_messages policies were also broken (referenced has_role)
-- Re-create them using admin_users lookup
-- ============================================================
DROP POLICY IF EXISTS "Admins can select contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;

CREATE POLICY "Admins can select contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- ============================================================
-- FIX: tools table RLS policies
-- ============================================================

-- Recreate SELECT policy for authenticated users (dropped by CASCADE)
DROP POLICY IF EXISTS "Approved tools authenticated read" ON public.tools;

CREATE POLICY "Approved tools authenticated read" ON public.tools
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    OR auth.uid() = submitted_by
  );

-- Recreate INSERT policy for admin users (was part of "Editors manage tools" FOR ALL, dropped by CASCADE)
DROP POLICY IF EXISTS "Admin users can insert tools" ON public.tools;

CREATE POLICY "Admin users can insert tools" ON public.tools
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Recreate UPDATE policy for admin users
DROP POLICY IF EXISTS "Admin users can update tools" ON public.tools;

CREATE POLICY "Admin users can update tools" ON public.tools
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Recreate DELETE policy for admin users
DROP POLICY IF EXISTS "Admin users can delete tools" ON public.tools;

CREATE POLICY "Admin users can delete tools" ON public.tools
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- ============================================================
-- FIX: other tables that lost policies due to has_role CASCADE
-- ============================================================

-- categories
DROP POLICY IF EXISTS "Editors manage categories" ON public.categories;

CREATE POLICY "Admin users manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- tool_features
DROP POLICY IF EXISTS "Editors manage features" ON public.tool_features;

CREATE POLICY "Admin users manage features" ON public.tool_features
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- tool_tags
DROP POLICY IF EXISTS "Editors manage tags" ON public.tool_tags;

CREATE POLICY "Admin users manage tags" ON public.tool_tags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- tool_screenshots
DROP POLICY IF EXISTS "Editors manage screenshots" ON public.tool_screenshots;

CREATE POLICY "Admin users manage screenshots" ON public.tool_screenshots
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- reviews
DROP POLICY IF EXISTS "Approved reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "Approved reviews authenticated read" ON public.reviews;
DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Editors moderate reviews" ON public.reviews;

CREATE POLICY "Approved reviews public read" ON public.reviews
  FOR SELECT TO anon
  USING (status = 'approved');

CREATE POLICY "Approved reviews authenticated read" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Users delete own reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin users moderate reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- tool_comparisons
DROP POLICY IF EXISTS "Editors manage comparisons" ON public.tool_comparisons;

CREATE POLICY "Admin users manage comparisons" ON public.tool_comparisons
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- newsletters
DROP POLICY IF EXISTS "Admins view subscribers" ON public.newsletters;

CREATE POLICY "Admin users view subscribers" ON public.newsletters
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- analytics_events
DROP POLICY IF EXISTS "Admins view analytics" ON public.analytics_events;

CREATE POLICY "Admin users view analytics" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
