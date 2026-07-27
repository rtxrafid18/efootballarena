import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { groupStandings } from "@/lib/tournament";
import { TeamBadge } from "@/components/team/TeamBadge";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups — eFootball Cup" },
      { name: "description", content: "12-group standings with points, goal difference and qualification." },
      { property: "og:title", content: "Groups — eFootball Cup" },
      { property: "og:description", content: "Live group standings for the tournament." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { data } = useTournament();
  if (!data) return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  if (data.settings.tournament_format !== "groups") {
    return (
      <AppLayout>
        <PageHeader title="Groups" />
        <div className="card-elevated p-8 text-center text-muted-foreground text-sm">
          Group stage is disabled in Direct Knockout mode. Switch format in Admin.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Group Stage" subtitle="Top 2 from each group advance" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger">
        {data.groups.map((g) => {
          const standings = groupStandings(g.id, data);
          return (
            <div key={g.id} className="card-elevated lift overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-border bg-surface-2">
                <div className="font-bold">Group {g.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {standings.length} teams
                </div>
              </div>
              {standings.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">No teams assigned</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 w-6">#</th>
                      <th className="text-left px-2 py-2">Team</th>
                      <th className="px-1 py-2 text-center">P</th>
                      <th className="px-1 py-2 text-center">GD</th>
                      <th className="px-2 py-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr
                        key={s.team.id}
                        className={
                          i < 2
                            ? "border-t border-border/60 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)]"
                            : "border-t border-border/60"
                        }
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-2 py-2"><TeamBadge team={s.team} size="sm" /></td>
                        <td className="px-1 py-2 text-center tabular-nums">{s.played}</td>
                        <td className="px-1 py-2 text-center tabular-nums">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                        <td className="px-2 py-2 text-center font-bold text-accent tabular-nums">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
