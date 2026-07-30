import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { brand, footerText } from "@/lib/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account | SameBasis" },
      {
        name: "description",
        content:
          "Create a SameBasis teaching account in seconds. No email verification required for trial accounts.",
      },
      { property: "og:title", content: "Sign in to SameBasis" },
      {
        property: "og:description",
        content:
          "Instant access to the inclusive teaching adjustment generator. No verification steps for trial accounts.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        toast.success("Account created. Setting up your classroom…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(
        message.includes("Invalid login")
          ? "That email and password combination doesn't match an account."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in didn't complete. Try email and password instead.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-4 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SB
          </span>
          <span className="text-base font-semibold text-foreground">{brand.name}</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
        <div className="rounded-xl bg-card p-6 shadow-warm-md sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "signup" ? "Create your teaching account" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Your own classroom, pre-populated with six synthetic student profiles."
              : "Pick up where you left off."}
          </p>

          <div
            className="mt-5 flex gap-3 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-foreground"
            role="note"
          >
            <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <span className="font-semibold">Privacy note:</span> You can use temporary email
              addresses, e.g. test@mail.com, for instant testing with no verification steps
              required. Just note that different account types require separate email addresses.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Your name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Teacher Testing"
                  className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="test@mail.com"
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-70"
            >
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {mode === "signup" ? "Create account and start" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Every account gets its own private classroom. Student profiles in this trial are
          synthetic — never enter real student information.
        </p>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">{footerText}</footer>
    </div>
  );
}
