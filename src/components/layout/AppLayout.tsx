import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trophy, ShieldHalf, LayoutGrid, Swords, Award, Settings } from "lucide-react";
import { GoalCelebration } from "@/components/match/GoalCelebration";
import { LiveTicker } from "@/components/match/LiveTicker";

const nav = [
  { to: "/", label: "Home", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Swords },
  { to: "/groups", label: "Groups", icon: LayoutGrid },
  { to: "/knockout", label: "Knockout", icon: ShieldHalf },
  { to: "/awards", label: "Awards", icon: Award },
  { to: "/admin", label: "Admin", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="sticky top-0 z-30 glass border-b border-border/80">
        <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip opacity-80" />
        <div className="absolute inset-0 pitch-stripes opacity-40 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl gold-frame flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
              <span className="ball-spin text-lg" aria-hidden>
                ⚽
              </span>
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] font-extrabold tracking-[0.14em] uppercase gold-shimmer-text">
                eFootball Cup
              </div>
              <div className="eyebrow mt-1.5 opacity-70">World Tournament</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {nav.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "relative px-3.5 py-2 rounded-lg font-display text-[12px] font-bold uppercase tracking-[0.12em] transition-colors duration-300",
                    active
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/70",
                  )}
                >
                  {n.label}
                  <span
                    className={cn(
                      "absolute left-3 right-3 -bottom-[3px] h-[2px] rounded-full bg-gradient-to-r from-accent to-accent/20 origin-left transition-transform duration-500 ease-out",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <LiveTicker />

      <main key={pathname} className="flex-1 w-full max-w-6xl mx-auto px-4 py-7 pb-28 md:pb-10 reveal-fade">
        {children}
      </main>

      <footer className="relative mt-10 border-t border-border/70 pb-20 md:pb-0">
        <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip opacity-60" />
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-display uppercase tracking-[0.22em] font-bold text-accent/90">
            <span className="trophy-glow">🏆</span> eFootball · Road to Glory
          </div>
          <div className="text-muted-foreground tracking-wide">One Ball · One Dream · One Cup</div>
          <div className="text-accent/60 tracking-[0.4em]">★★★</div>
        </div>
      </footer>

      <GoalCelebration />

      {/* Mobile bottom dock */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 bg-gradient-to-t from-background via-background/85 to-transparent">
        <div className="dock-bar grid grid-cols-6 gap-0.5 p-1.5">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn("dock-item", active && "dock-item-active")}
              >
                <Icon
                  className={cn(
                    "h-[19px] w-[19px] transition-transform duration-500 ease-out",
                    active && "scale-110",
                  )}
                />
                <span className="text-[9px] font-bold uppercase tracking-[0.06em] leading-none">
                  {n.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="wc-banner mb-7 p-6 md:p-9 reveal">
      <div className="absolute inset-0 confetti-dots opacity-40 pointer-events-none" aria-hidden />
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-2.5">
            <span className="inline-block h-[2px] w-7 bg-accent/70 rounded-full" />
            FIFA eFootball · Matchday
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-2.5 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="absolute inset-x-0 bottom-0 hairline opacity-70" />
    </div>
  );
}
