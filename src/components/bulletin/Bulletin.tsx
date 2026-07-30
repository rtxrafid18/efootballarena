import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import type { BulletinItem } from "@/lib/bulletin";

const ICON: Record<BulletinItem["kind"], string> = {
  boot: "👟",
  ball: "⭐",
  result: "⚽",
  live: "🔴",
};

export function Bulletin({ items }: { items: BulletinItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="card-elevated overflow-hidden mb-8">
      <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip opacity-60" />
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="h-9 w-9 rounded-lg gold-frame grid place-items-center">
          <Newspaper className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.14em]">
            Tournament Bulletin
          </h2>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
            Live storylines · auto-generated
          </div>
        </div>
      </div>

      <ul className="divide-y divide-border/60 stagger-rank">
        {items.map((item) => {
          const body = (
            <div className="flex items-start gap-3 px-5 py-3.5 transition-colors duration-300 hover:bg-surface-2/60">
              <span
                className={
                  "mt-0.5 grid place-items-center h-7 w-7 shrink-0 rounded-md text-[13px] " +
                  (item.kind === "live"
                    ? "bg-[color-mix(in_oklab,var(--live)_18%,transparent)] live-dot"
                    : item.kind === "ball" || item.kind === "boot"
                      ? "gold-gradient"
                      : "bg-surface-2")
                }
              >
                {ICON[item.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.18em] text-accent/80 font-semibold">
                  {item.tag}
                </div>
                <div className="text-sm font-semibold leading-snug mt-0.5">{item.headline}</div>
                {item.detail && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <li key={item.id}>
              {item.matchId ? (
                <Link to="/matches/$matchId" params={{ matchId: item.matchId }} className="block">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
