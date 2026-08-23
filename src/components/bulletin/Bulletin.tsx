import { Link } from "@tanstack/react-router";
import { Newspaper, Radio } from "lucide-react";
import type { BulletinItem, BulletinKind } from "@/lib/bulletin";

const ICON: Record<BulletinKind, string> = {
  champion: "🏆",
  boot: "👟",
  ball: "⭐",
  gloves: "🧤",
  hattrick: "🎩",
  upset: "💥",
  standings: "📊",
  preview: "📅",
  result: "⚽",
  live: "🔴",
};

const ACCENT: Record<BulletinKind, string> = {
  champion: "gold-gradient text-accent-foreground",
  boot: "gold-gradient text-accent-foreground",
  ball: "gold-gradient text-accent-foreground",
  gloves: "gold-gradient text-accent-foreground",
  hattrick: "gold-gradient text-accent-foreground",
  upset: "bg-primary/25",
  standings: "bg-surface-2",
  preview: "bg-surface-2",
  result: "bg-surface-2",
  live: "bg-[color-mix(in_oklab,var(--live)_18%,transparent)] live-dot",
};

function Wrap({ item, children }: { item: BulletinItem; children: React.ReactNode }) {
  return item.matchId ? (
    <Link to="/matches/$matchId" params={{ matchId: item.matchId }} className="block">
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
}

export function Bulletin({ items }: { items: BulletinItem[] }) {
  if (items.length === 0) return null;

  const lead = items.find((i) => i.lead) ?? items[0];
  const rest = items.filter((i) => i.id !== lead.id);

  return (
    <section className="card-elevated overflow-hidden mb-8">
      <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip opacity-60" />

      {/* masthead */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gold-frame grid place-items-center">
            <Newspaper className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.14em]">
              The Matchday Post
            </h2>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
              Tournament newsfeed
            </div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/90">
          <Radio className="h-3 w-3" /> Updating live
        </span>
      </div>

      {/* lead story */}
      <Wrap item={lead}>
        <article className="relative px-5 py-6 border-b border-border/60 overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none text-[9rem] leading-none font-display font-black select-none -right-6 top-0 text-accent">
            {ICON[lead.kind]}
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full gold-gradient text-accent-foreground text-[9px] font-extrabold uppercase tracking-[0.16em]">
                {lead.kind === "live" ? "Breaking" : "Top story"}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {lead.tag}
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold leading-tight tracking-tight group-hover:text-accent transition-colors duration-300">
              {lead.headline}
            </h3>
            {lead.detail && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{lead.detail}</p>
            )}
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-3">
              {lead.byline ?? "eFootball Wire"}
            </div>
          </div>
        </article>
      </Wrap>

      {/* feed */}
      <ul className="divide-y divide-border/60 stagger-rank">
        {rest.map((item) => (
          <li key={item.id}>
            <Wrap item={item}>
              <article className="flex items-start gap-3 px-5 py-4 transition-colors duration-300 hover:bg-surface-2/60 group">
                <span
                  className={
                    "mt-0.5 grid place-items-center h-8 w-8 shrink-0 rounded-lg text-[14px] " +
                    ACCENT[item.kind]
                  }
                >
                  {ICON[item.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-accent/90">
                      {item.tag}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
                      {item.byline ?? "eFootball Wire"}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold leading-snug mt-1 group-hover:text-accent transition-colors duration-300">
                    {item.headline}
                  </h4>
                  {item.detail && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.detail}</p>
                  )}
                </div>
              </article>
            </Wrap>
          </li>
        ))}
      </ul>
    </section>
  );
}
