import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { topScorers, goldenBall } from "@/lib/tournament";
import { Trophy } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/awards")({
  head: () => ({
    meta: [
      { title: "Awards — eFootball Cup" },
      { name: "description", content: "Golden Boot, Golden Ball, Top Assists and Golden Glove rankings — auto-calculated." },
      { property: "og:title", content: "Awards — eFootball Cup" },
      { property: "og:description", content: "Individual tournament awards." },
    ],
  }),
  component: AwardsPage,
});

function AwardsPage() {
  const { data } = useTournament();
  if (!data) return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-pop">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  const teamById = new Map(data.teams.map((t) => [t.id, t]));

  const scorers = topScorers(data.goals, data.teams);
  const balls = goldenBall(data);
  const assists = [...data.assists].sort((a, b) => b.assists - a.assists);
  const gks = [...data.gks].sort(
    (a, b) => b.clean_sheets - a.clean_sheets || b.saves - a.saves,
  );

  return (
    <AppLayout>
      <PageHeader title="Tournament Awards" subtitle="Auto-calculated from live match data" />

      <div className="grid gap-5 md:grid-cols-2">
        <AwardCard
          title="Golden Boot"
          subtitle="Top scorer · auto from goal events"
          accent="gold"
          emoji="👟"
        >
          <RankList
            rows={scorers.slice(0, 10).map((s) => ({
              name: s.player,
              sub: s.team?.name ?? "",
              value: s.goals,
              unit: "goals",
            }))}
          />
        </AwardCard>

        <AwardCard
          title="Golden Ball"
          subtitle="Best overall · G×4 + A×3 + CS×2 + MVP×5"
          accent="maroon"
          emoji="⭐"
        >
          <RankList
            rows={balls.slice(0, 10).map((s) => ({
              name: s.player,
              sub: s.team?.name ?? "",
              value: s.score,
              unit: "pts",
              breakdown: `${s.goals}G · ${s.assists}A · ${s.clean_sheets}CS · ${s.mvps}MVP`,
            }))}
          />
        </AwardCard>

        <AwardCard title="Top Assists" subtitle="Admin-maintained" accent="gold" emoji="🎯">
          <RankList
            rows={assists.slice(0, 10).map((s) => ({
              name: s.player_name,
              sub: (s.team_id && teamById.get(s.team_id)?.name) || "",
              value: s.assists,
              unit: "assists",
            }))}
          />
        </AwardCard>

        <AwardCard title="Golden Glove" subtitle="Best goalkeeper · admin-maintained" accent="maroon" emoji="🧤">
          <RankList
            rows={gks.slice(0, 10).map((s) => ({
              name: s.player_name,
              sub: (s.team_id && teamById.get(s.team_id)?.name) || "",
              value: s.clean_sheets,
              unit: "CS",
              breakdown: `${s.saves} saves`,
            }))}
          />
        </AwardCard>
      </div>
    </AppLayout>
  );
}

function AwardCard({
  title,
  subtitle,
  emoji,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  accent: "gold" | "maroon";
  children: ReactNode;
}) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-3 ${accent === "gold" ? "gold-gradient text-accent-foreground" : "maroon-gradient text-primary-foreground"}`}>
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-lg leading-tight flex items-center gap-2">
            <Trophy className="h-4 w-4" /> {title}
          </div>
          <div className="text-xs opacity-90">{subtitle}</div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function RankList({
  rows,
}: {
  rows: { name: string; sub: string; value: number; unit: string; breakdown?: string }[];
}) {
  if (rows.length === 0)
    return <div className="text-sm text-muted-foreground text-center py-6">No data yet</div>;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i === 0
                ? "gold-gradient text-accent-foreground"
                : i < 3
                  ? "bg-surface-2 text-accent"
                  : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-sm">{r.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {r.sub}
              {r.breakdown && <span className="ml-2">· {r.breakdown}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-accent tabular-nums">{r.value}</div>
            <div className="text-[10px] uppercase text-muted-foreground">{r.unit}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
