import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { MatchCard } from "@/components/match/MatchCard";
import { topScorers, goldenBall } from "@/lib/tournament";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "eFootball Cup — Live Tournament Center" },
      { name: "description", content: "Live scores, group standings, brackets and player awards for the eFootball tournament." },
      { property: "og:title", content: "eFootball Cup — Live Tournament Center" },
      { property: "og:description", content: "Live scores, group standings, brackets and player awards for the eFootball tournament." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data, isLoading } = useTournament();

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-flip">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const live = data.matches.filter((m) => m.status === "live");
  const recent = data.matches
    .filter((m) => m.status === "finished")
    .slice(-4)
    .reverse();
  const upcoming = data.matches.filter((m) => m.status === "scheduled").slice(0, 4);
  const scorers = topScorers(data.goals, data.teams).slice(0, 5);
  const balls = goldenBall(data).slice(0, 5);

  return (
    <AppLayout>
      <PageHeader
        title={data.settings.tournament_name}
        subtitle={
          data.settings.tournament_format === "groups"
            ? "48 Teams · 12 Groups · Knockout"
            : "Direct Knockout · Round of 32"
        }
      />

      {live.length > 0 && (
        <section className="mb-8">
          <SectionTitle title="Live now" tone="live" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-flip">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        <section className="lg:col-span-2 space-y-8">
          {recent.length > 0 && (
            <div>
              <SectionTitle title="Latest results" link={{ to: "/matches", label: "All matches" }} />
              <div className="grid gap-3.5 md:grid-cols-2 stagger-flip">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
                ))}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <SectionTitle title="Upcoming" />
              <div className="grid gap-3.5 md:grid-cols-2 stagger-flip">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} compact />
                ))}
              </div>
            </div>
          )}
          {data.matches.length === 0 && (
            <EmptyState
              title="No matches yet"
              body="Head to the Admin panel to add teams and schedule your first match."
              cta={{ to: "/admin", label: "Open Admin" }}
            />
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <LeaderCard
            title="Golden Boot"
            subtitle="Top scorers"
            emoji="👟"
            rows={scorers.map((s) => ({
              name: s.player,
              sub: s.team?.name ?? "",
              value: s.goals,
            }))}
          />
          <LeaderCard
            title="Golden Ball"
            subtitle="Best overall player"
            emoji="⭐"
            rows={balls.map((s) => ({
              name: s.player,
              sub: s.team?.name ?? "",
              value: s.score,
            }))}
          />
        </aside>
      </div>
    </AppLayout>
  );
}

function SectionTitle({
  title,
  tone,
  link,
}: {
  title: string;
  tone?: "live";
  link?: { to: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="section-title text-foreground">
        {tone === "live" && (
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--live)]" />
        )}
        {title}
      </h2>
      {link && (
        <Link
          to={link.to}
          className="group text-[11px] font-semibold uppercase tracking-[0.15em] text-accent/90 hover:text-accent transition-colors"
        >
          {link.label}
          <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

function LeaderCard({
  title,
  subtitle,
  emoji,
  rows,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  rows: { name: string; sub: string; value: number }[];
}) {
  return (
    <div className="card-elevated lift p-5 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip opacity-50" />
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg gold-frame flex items-center justify-center text-base">
          {emoji}
        </div>
        <div>
          <div className="font-display text-sm font-extrabold uppercase tracking-[0.12em]">
            {title}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">No data yet</div>
      ) : (
        <ol className="stagger-rank space-y-1">
          {rows.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-sm rounded-lg px-2 py-2 -mx-2 transition-colors duration-300 hover:bg-surface-2/70"
            >
              <span
                className={
                  "grid place-items-center h-6 w-6 rounded-md text-[11px] font-bold tabular-nums " +
                  (i === 0
                    ? "gold-gradient text-accent-foreground"
                    : "bg-surface-2 text-muted-foreground")
                }
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold">{r.name}</div>
                {r.sub && (
                  <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                )}
              </div>
              <span className="font-display tabular-nums font-extrabold text-accent text-base">
                {r.value}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { to: string; label: string } }) {
  return (
    <div className="stadium-panel p-10 text-center reveal">
      <div className="text-3xl mb-3 float-y">⚽</div>
      <div className="font-display text-lg font-extrabold uppercase tracking-[0.1em]">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
      {cta && (
        <Link
          to={cta.to}
          className="btn-gold mt-5"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
