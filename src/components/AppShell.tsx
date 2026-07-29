import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Sparkles,
  ClipboardCheck,
  LifeBuoy,
  MessageCircle,
  HeartPulse,
  Settings as SettingsIcon,
  Menu,
  Bell,
  X,
  HelpCircle,
} from "lucide-react";
import { brand, demoUser, footerText } from "@/lib/brand";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "My Classes", icon: Users },
  { to: "/students", label: "Student Profiles", icon: UserRound },
  { to: "/planner", label: "Lesson Planner", icon: Sparkles },
  { to: "/crisis", label: "Crisis Guidance", icon: HeartPulse },
  { to: "/family", label: "Family Messages", icon: MessageCircle },
  { to: "/evidence", label: "Evidence Log", icon: ClipboardCheck },
  { to: "/help", label: "Help & Info", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const mobileNavItems = [
  navItems[0],
  navItems[2],
  navItems[3],
  navItems[4],
  navItems[6],
] as const;


function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
            "aria-current": "page",
          }}
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          SB
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-sidebar-foreground">{brand.name}</span>
          <span className="text-[11px] text-sidebar-foreground/70">{brand.tagline}</span>
        </span>
      </Link>
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl bg-sidebar-accent/70 p-3 text-[11px] leading-relaxed text-sidebar-foreground/80">
        Demo mode. All students are synthetic. Adjustments are AI-generated and must be
        reviewed by a qualified teacher before use.
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [today, setToday] = useState("");

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] bg-sidebar shadow-warm-lg">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-sidebar-foreground"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {demoUser.schoolName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {today || "\u00a0"} · {demoUser.state}
              </p>
            </div>
            <button
              aria-label="Notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell size={20} aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-card px-2 py-1.5 shadow-warm-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {demoUser.initials}
              </span>
              <span className="hidden pr-1 text-sm font-medium sm:block">
                {demoUser.fullName}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {action}
          </div>
          {children}
        </main>

        <footer className="border-t border-border/70 px-4 py-4 sm:px-6">
          <p className="mx-auto max-w-[1280px] text-center text-xs text-muted-foreground lg:text-left">
            {footerText}
          </p>
        </footer>
      </div>

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {mobileNavItems.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-muted-foreground"
                activeProps={{ className: "text-primary", "aria-current": "page" }}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="truncate">{label.replace("Student ", "")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        to="/help"
        aria-label="Help and information"
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm-lg transition-colors hover:bg-primary-light lg:bottom-6",
        )}
      >
        <HelpCircle size={22} aria-hidden="true" />
      </Link>
    </div>
  );
}
