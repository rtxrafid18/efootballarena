import type { TournamentData, Team } from "@/lib/tournament";
import { topScorers, goldenBall, stageLabel } from "@/lib/tournament";

export type BulletinItem = {
  id: string;
  kind: "boot" | "ball" | "result" | "live";
  tag: string;
  headline: string;
  detail?: string;
  matchId?: string;
};

function nameOf(t: Team | null | undefined) {
  return t?.name ?? "TBD";
}

export function buildBulletin(data: TournamentData): BulletinItem[] {
  const items: BulletinItem[] = [];
  const teamById = new Map(data.teams.map((t) => [t.id, t]));

  /* --- Golden Boot race --- */
  const scorers = topScorers(data.goals, data.teams);
  if (scorers.length > 0) {
    const [lead, ...rest] = scorers;
    const chaser = rest.find((r) => r.goals < lead.goals);
    const tied = rest.filter((r) => r.goals === lead.goals);
    items.push({
      id: "boot",
      kind: "boot",
      tag: "Golden Boot",
      headline:
        tied.length > 0
          ? `${lead.player} & ${tied.length} other${tied.length > 1 ? "s" : ""} share the lead on ${lead.goals} goals`
          : `${lead.player} leads the scoring charts with ${lead.goals} goal${lead.goals === 1 ? "" : "s"}`,
      detail: chaser
        ? `${nameOf(lead.team)} · ${chaser.player} is closest on ${chaser.goals}`
        : nameOf(lead.team),
    });
  }

  /* --- Golden Ball race --- */
  const balls = goldenBall(data);
  if (balls.length > 0) {
    const [lead, second] = balls;
    const gap = second ? lead.score - second.score : null;
    items.push({
      id: "ball",
      kind: "ball",
      tag: "Golden Ball",
      headline:
        gap === null
          ? `${lead.player} is the only name on the Golden Ball board (${lead.score} pts)`
          : gap === 0
            ? `${lead.player} and ${second.player} are level at the top on ${lead.score} pts`
            : `${lead.player} is ahead in the Golden Ball race on ${lead.score} pts`,
      detail:
        `${lead.goals}G · ${lead.assists}A · ${lead.clean_sheets}CS · ${lead.mvps}MVP` +
        (gap && gap > 0 ? ` — ${gap} pts clear of ${second.player}` : ""),
    });
  }

  /* --- Live matches --- */
  for (const m of data.matches.filter((x) => x.status === "live")) {
    const h = teamById.get(m.home_team_id ?? "");
    const a = teamById.get(m.away_team_id ?? "");
    items.push({
      id: `live-${m.id}`,
      kind: "live",
      tag: "Live",
      matchId: m.id,
      headline: `${nameOf(h)} ${m.home_score}-${m.away_score} ${nameOf(a)} is under way`,
      detail: stageLabel[m.stage],
    });
  }

  /* --- Recently finished results, with a hero storyline --- */
  const finished = data.matches.filter((m) => m.status === "finished").slice(-6).reverse();
  for (const m of finished) {
    const h = teamById.get(m.home_team_id ?? "");
    const a = teamById.get(m.away_team_id ?? "");
    const matchGoals = data.goals.filter((g) => g.match_id === m.id);

    // hero = top scorer of the winning side in this match
    const counts = new Map<string, { name: string; team_id: string; n: number }>();
    for (const g of matchGoals) {
      const cur = counts.get(`${g.scorer_name}::${g.team_id}`) ?? {
        name: g.scorer_name,
        team_id: g.team_id,
        n: 0,
      };
      cur.n += 1;
      counts.set(`${g.scorer_name}::${g.team_id}`, cur);
    }

    const drawn = m.home_score === m.away_score;
    const pensDecided =
      drawn && m.home_pens !== null && m.away_pens !== null && m.home_pens !== m.away_pens;
    const winnerId = pensDecided
      ? (m.home_pens ?? 0) > (m.away_pens ?? 0)
        ? m.home_team_id
        : m.away_team_id
      : drawn
        ? null
        : m.home_score > m.away_score
          ? m.home_team_id
          : m.away_team_id;
    const winner = winnerId ? teamById.get(winnerId) : null;

    const hero =
      Array.from(counts.values())
        .filter((c) => !winnerId || c.team_id === winnerId)
        .sort((x, y) => y.n - x.n)[0] ??
      Array.from(counts.values()).sort((x, y) => y.n - x.n)[0];

    const scoreline = `${nameOf(h)} ${m.home_score}-${m.away_score} ${nameOf(a)}${
      pensDecided ? ` (${m.home_pens}-${m.away_pens} pens)` : ""
    }`;

    let headline: string;
    if (hero && winner && hero.n >= 1) {
      const verb = m.stage === "group" ? "in" : "through";
      const stagePart =
        m.stage === "group"
          ? `${verb} the group stage`
          : `${verb} from the ${stageLabel[m.stage].toLowerCase()}`;
      headline =
        hero.n > 1
          ? `${hero.name}'s ${hero.n} goals help ${winner.name} ${stagePart}`
          : `${hero.name} fires ${winner.name} ${stagePart}`;
    } else if (winner) {
      headline = `${winner.name} get the job done${m.stage === "group" ? "" : ` in the ${stageLabel[m.stage].toLowerCase()}`}`;
    } else {
      headline = `${nameOf(h)} and ${nameOf(a)} share the spoils`;
    }

    const mvpPart = m.mvp_player_name ? ` · MVP ${m.mvp_player_name}` : "";
    items.push({
      id: `res-${m.id}`,
      kind: "result",
      tag: stageLabel[m.stage],
      matchId: m.id,
      headline,
      detail: `${scoreline}${mvpPart}`,
    });
  }

  return items;
}
