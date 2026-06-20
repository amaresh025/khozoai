import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const path = location?.pathname;

    try {
      console.log("[_authenticated] beforeLoad start", { path });

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("[_authenticated] getSession result", {
        path,
        hasSession: !!sessionData?.session,
        hasUser: !!sessionData?.session?.user,
        userId: sessionData?.session?.user?.id,
        sessionError,
      });

      if (!sessionError && sessionData?.session?.user) {
        console.log("[_authenticated] session found -> user found", {
          path,
          userId: sessionData.session.user.id,
        });
        return { user: sessionData.session.user };
      }

      console.log("[_authenticated] session not found yet, falling back to getUser()", {
        path,
        sessionError,
      });

      const { data, error } = await supabase.auth.getUser();
      console.log("[_authenticated] getUser result", {
        path,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        error,
      });

      if (error || !data.user) {
        console.log("[_authenticated] redirecting to /auth", {
          path,
          error,
          hasUser: !!data?.user,
        });
        throw redirect({ to: "/auth", search: {} as any });
      }

      console.log("[_authenticated] user found via getUser, allowing", {
        path,
        userId: data.user.id,
      });
      return { user: data.user };
    } catch (e) {
      console.error("[_authenticated] beforeLoad auth check failed -> redirecting to /auth", {
        path,
        error: e,
      });
      throw redirect({ to: "/auth", search: {} as any });
    }
  },
  component: () => <Outlet />,
});
