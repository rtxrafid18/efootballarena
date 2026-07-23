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
      { property: "og:description", content: "Live scores, standings, brackets and awards." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data, isLoading } = useTournament();

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="text-muted-foreground text-sm">Loading tournament…</div>
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
          <div className="grid gap-3 md:grid-cols-2">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          {recent.length > 0 && (
            <div>
              <SectionTitle title="Latest results" link={{ to: "/matches", label: "All matches" }} />
              <div className="grid gap-3 md:grid-cols-2">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
                ))}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <SectionTitle title="Upcoming" />
              <div className="grid gap-3 md:grid-cols-2">
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

        <aside className="space-y-6">
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
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        {tone === "live" && <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--live)]" />}
        {title}
      </h2>
      {link && (
        <Link to={link.to} className="text-xs text-accent hover:underline">
          {link.label} →
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
    <div className="card-elevated p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-sm font-bold">{emoji} {title}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{subtitle}</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">No data yet</div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                {r.sub && <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>}
              </div>
              <span className="tabular-nums font-bold text-accent">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { to: string; label: string } }) {
  return (
    <div className="card-elevated p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
      {cta && (
        <Link
          to={cta.to}
          className="inline-flex mt-4 items-center rounded-md gold-gradient text-accent-foreground px-4 py-2 text-sm font-semibold"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
