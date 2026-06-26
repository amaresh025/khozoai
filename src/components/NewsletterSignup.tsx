import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(255) });

export function NewsletterSignup({ source = "homepage" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("newsletters")
        .select("id")
        .eq("email", parsed.data.email)
        .maybeSingle();
      if (existing) {
        toast.message("You're already subscribed.");
        setEmail("");
        return;
      }
      const { error } = await supabase
        .from("newsletters")
        .insert({ email: parsed.data.email, source });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          toast.message("You're already subscribed.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
        return;
      }
      toast.success("You're in! Check your inbox.");
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-11 rounded-full bg-background/80 border border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-gradient-brand text-white border-0 hover:opacity-90 px-6"
      >
        {loading ? "..." : "Subscribe"}
      </Button>
    </form>
  );
}
