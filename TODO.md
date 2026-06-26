- [ ] Read/identify Supabase RLS policies impacting anon reads (tools/categories)
- [x] Modify RLS tools SELECT policy to avoid `public.has_role` for anon path (or gate `has_role` with `auth.uid() IS NOT NULL`)

- [ ] Modify RLS reviews/blog/... SELECT policies similarly if they reference `public.has_role` in anon-readable clauses

- [ ] Add console logs when guest reads are blocked (capture Supabase errors in public query wrappers)
- [ ] Ensure /profile and /submissions routes (if exist) are under \_authenticated only
- [ ] Add/adjust test cases for guest browsing
