import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AI Tools Hub" },
      { name: "description", content: "Get in touch with the AI Tools Hub team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-3xl sm:text-5xl font-bold">Get in <span className="text-gradient">touch</span></h1>
      <p className="mt-2 text-muted-foreground">We typically reply within one business day.</p>
      <p className="mt-2 text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> hello@aitoolshub.app</p>

      <form
        className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card p-6"
        onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Message sent — we'll be in touch."); }}
      >
        <input required name="name" placeholder="Your name" maxLength={120} className="w-full h-11 rounded-lg bg-secondary/60 border border-border px-3 text-sm" />
        <input required name="email" type="email" placeholder="Your email" maxLength={255} className="w-full h-11 rounded-lg bg-secondary/60 border border-border px-3 text-sm" />
        <textarea required name="message" placeholder="How can we help?" rows={5} maxLength={2000} className="w-full rounded-lg bg-secondary/60 border border-border p-3 text-sm" />
        <Button type="submit" className="bg-gradient-brand text-white border-0" disabled={sent}>{sent ? "Sent" : "Send message"}</Button>
      </form>
    </div>
  );
}
