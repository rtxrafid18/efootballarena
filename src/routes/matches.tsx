import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { MatchCard } from "@/components/match/MatchCard";
import { stageLabel, type MatchStage } from "@/lib/tournament";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — eFootball Cup" },
      { name: "description", content: "All tournament matches with live scores and goal timelines." },
      { property: "og:title", content: "Matches — eFootball Cup" },
      { property: "og:description", content: "All tournament matches, live and finished." },
    ],
  }),
  component: MatchesPage,
});

const FILTERS: { key: "all" | "live" | "finished" | "scheduled"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Finished" },
  { key: "scheduled", label: "Upcoming" },
];

function MatchesPage() {
  const { data } = useTournament();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  if (!data) return <AppLayout><div className="text-muted-foreground">Loading…</div></AppLayout>;

  const matches = data.matches.filter((m) => filter === "all" || m.status === filter);

  // group by stage
  const byStage = new Map<MatchStage, typeof matches>();
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }

  return (
    <AppLayout>
      <PageHeader title="Match Center" subtitle="Live, finished and upcoming fixtures" />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
              filter === f.key
                ? "bg-accent text-accent-foreground border-transparent"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted-foreground text-sm">
          No matches to show.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byStage.entries()).map(([stage, list]) => (
            <section key={stage}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {stageLabel[stage]}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
