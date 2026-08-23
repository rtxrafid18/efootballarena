import type { TournamentData, Team, Match } from "@/lib/tournament";
import { topScorers, goldenBall, stageLabel } from "@/lib/tournament";

export type BulletinKind =
  | "champion"
  | "boot"
  | "ball"
  | "result"
  | "live"
  | "upset"
  | "hattrick"
  | "gloves"
  | "standings"
  | "preview";

export type BulletinItem = {
  id: string;
  kind: BulletinKind;
  tag: string;
  headline: string;
  detail?: string;
  matchId?: string;
  lead?: boolean;
  byline?: string;
};

/* ---------- deterministic pseudo-random helpers ---------- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Stable "random" pick — same seed always yields the same variant. */
function pick<T>(seed: string, list: T[]): T {
  return list[hash(seed) % list.length];
}

const BYLINES = [
  "eFootball Wire",
  "Matchday Desk",
  "Pitchside Report",
  "Tournament Centre",
  "Stadium Correspondent",
  "Global Football Desk",
];

function nameOf(t: Team | null | undefined) {
  return t?.name ?? "TBD";
}

function stageNoun(stage: Match["stage"]) {
  switch (stage) {
    case "group":
      return "group stage";
    case "r32":
      return "round of 32";
    case "r16":
      return "round of 16";
    case "qf":
      return "quarter-finals";
    case "sf":
      return "semi-finals";
    case "3rd":
      return "third-place play-off";
    case "final":
      return "final";
  }
}

function nextRoundNoun(stage: Match["stage"]) {
  switch (stage) {
    case "group":
      return "the knockout rounds";
    case "r32":
      return "the round of 16";
    case "r16":
      return "the quarter-finals";
    case "qf":
      return "the semi-finals";
    case "sf":
      return "the final";
    default:
      return "the next round";
  }
}

/* ---------- builder ---------- */

export function buildBulletin(data: TournamentData): BulletinItem[] {
  const items: BulletinItem[] = [];
  const teamById = new Map(data.teams.map((t) => [t.id, t]));
  const push = (item: BulletinItem) =>
    items.push({ byline: pick(item.id + "by", BYLINES), ...item });

  /* ===== 1. Champions ===== */
  const final = data.matches.find((m) => m.stage === "final" && m.status === "finished");
  if (final) {
    const h = teamById.get(final.home_team_id ?? "");
    const a = teamById.get(final.away_team_id ?? "");
    const pens =
      final.home_score === final.away_score &&
      final.home_pens !== null &&
      final.away_pens !== null;
    const winner = pens
      ? (final.home_pens ?? 0) > (final.away_pens ?? 0)
        ? h
        : a
      : final.home_score > final.away_score
        ? h
        : final.home_score < final.away_score
          ? a
          : null;
    const loser = winner && winner.id === h?.id ? a : h;
    if (winner) {
      push({
        id: `champ-${final.id}`,
        kind: "champion",
        tag: "Champions",
        lead: true,
        matchId: final.id,
        headline: pick(`champ-${final.id}`, [
          `${winner.name} are world champions`,
          `Glory for ${winner.name} — the trophy is theirs`,
          `${winner.name} conquer the world`,
          `Crowned: ${winner.name} lift the cup`,
          `${winner.name} write their name on the trophy`,
        ]),
        detail: pens
          ? `${nameOf(h)} ${final.home_score}-${final.away_score} ${nameOf(a)} · won ${final.home_pens}-${final.away_pens} on penalties against ${nameOf(loser)}`
          : `Beat ${nameOf(loser)} ${Math.max(final.home_score, final.away_score)}-${Math.min(final.home_score, final.away_score)} in the final${final.mvp_player_name ? ` · Final MVP ${final.mvp_player_name}` : ""}`,
      });
    }
  }

  /* ===== 2. Live matches ===== */
  for (const m of data.matches.filter((x) => x.status === "live")) {
    const h = teamById.get(m.home_team_id ?? "");
    const a = teamById.get(m.away_team_id ?? "");
    const diff = m.home_score - m.away_score;
    const leader = diff > 0 ? h : diff < 0 ? a : null;
    push({
      id: `live-${m.id}`,
      kind: "live",
      tag: "Live",
      matchId: m.id,
      lead: !final,
      headline: leader
        ? pick(`live-${m.id}-${m.home_score}-${m.away_score}`, [
            `${leader.name} lead as the ${stageNoun(m.stage)} tie unfolds`,
            `${leader.name} in front — ${nameOf(h)} ${m.home_score}-${m.away_score} ${nameOf(a)}`,
            `${leader.name} turning the screw against ${nameOf(leader.id === h?.id ? a : h)}`,
            `Advantage ${leader.name} in a tense ${stageNoun(m.stage)} clash`,
          ])
        : pick(`live-${m.id}-lvl`, [
            `Nothing between ${nameOf(h)} and ${nameOf(a)} so far`,
            `${nameOf(h)} and ${nameOf(a)} locked together in a gripping tie`,
            `All square as ${nameOf(h)} host ${nameOf(a)}`,
          ]),
      detail: `${stageLabel[m.stage]} · ${nameOf(h)} ${m.home_score}-${m.away_score} ${nameOf(a)} · in play`,
    });
  }

  /* ===== 3. Hat-tricks & standout individual displays ===== */
  const finishedAll = data.matches.filter((m) => m.status === "finished");
  for (const m of finishedAll.slice(-10)) {
    const counts = new Map<string, number>();
    for (const g of data.goals.filter((x) => x.match_id === m.id)) {
      counts.set(g.scorer_name, (counts.get(g.scorer_name) ?? 0) + 1);
    }
    for (const [player, n] of counts) {
      if (n >= 3) {
        push({
          id: `ht-${m.id}-${player}`,
          kind: "hattrick",
          tag: n >= 4 ? "Masterclass" : "Hat-trick",
          matchId: m.id,
          headline: pick(`ht-${m.id}-${player}`, [
            `${player} helps himself to ${n} in the ${stageNoun(m.stage)}`,
            `Matchball for ${player} after a ruthless ${n}-goal display`,
            `${player} runs riot with ${n} goals`,
            `${n} goals, one man: ${player} steals the show`,
          ]),
          detail: `${nameOf(teamById.get(m.home_team_id ?? ""))} ${m.home_score}-${m.away_score} ${nameOf(teamById.get(m.away_team_id ?? ""))}`,
        });
      }
    }
  }

  /* ===== 4. Recent results with varied storylines ===== */
  const finished = finishedAll.slice(-8).reverse();
  for (const m of finished) {
    const h = teamById.get(m.home_team_id ?? "");
    const a = teamById.get(m.away_team_id ?? "");
    if (final && m.id === final.id) continue;
    const matchGoals = data.goals.filter((g) => g.match_id === m.id);

    const counts = new Map<string, { name: string; team_id: string; n: number }>();
    for (const g of matchGoals) {
      const key = `${g.scorer_name}::${g.team_id}`;
      const cur = counts.get(key) ?? { name: g.scorer_name, team_id: g.team_id, n: 0 };
      cur.n += 1;
      counts.set(key, cur);
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
    const loser = winnerId
      ? teamById.get((winnerId === m.home_team_id ? m.away_team_id : m.home_team_id) ?? "")
      : null;

    const hero =
      Array.from(counts.values())
        .filter((c) => !winnerId || c.team_id === winnerId)
        .sort((x, y) => y.n - x.n)[0] ??
      Array.from(counts.values()).sort((x, y) => y.n - x.n)[0];

    const margin = Math.abs(m.home_score - m.away_score);
    const total = m.home_score + m.away_score;
    const clean = winner && Math.min(m.home_score, m.away_score) === 0 && !drawn;
    const seed = `res-${m.id}-${m.home_score}-${m.away_score}`;

    let tag = stageLabel[m.stage];
    let headline: string;

    if (pensDecided && winner) {
      tag = "Shoot-out drama";
      headline = pick(seed + "pen", [
        `${winner.name} hold their nerve from twelve yards`,
        `Penalty heartbreak for ${nameOf(loser)} as ${winner.name} advance`,
        `${winner.name} survive the shoot-out to reach ${nextRoundNoun(m.stage)}`,
        `Spot-kick agony: ${winner.name} edge past ${nameOf(loser)}`,
      ]);
    } else if (!winner) {
      tag = "Stalemate";
      headline = pick(seed + "draw", [
        total === 0
          ? `Goalless grind between ${nameOf(h)} and ${nameOf(a)}`
          : `${nameOf(h)} and ${nameOf(a)} trade blows and share the points`,
        `Honours even as ${nameOf(h)} are held by ${nameOf(a)}`,
        `${nameOf(a)} dig in to leave ${nameOf(h)} frustrated`,
      ]);
    } else if (margin >= 3) {
      tag = "Statement win";
      headline = pick(seed + "rout", [
        `${winner.name} dismantle ${nameOf(loser)} in a ruthless display`,
        `No mercy: ${winner.name} put ${nameOf(loser)} to the sword`,
        `${winner.name} send a warning to the rest of the field`,
        `${nameOf(loser)} overrun as ${winner.name} turn on the style`,
      ]);
    } else if (hero && hero.n > 1) {
      tag = m.stage === "group" ? "Group stage" : stageLabel[m.stage];
      headline = pick(seed + "hero", [
        `${hero.name}'s ${hero.n} goals fire ${winner.name} into ${nextRoundNoun(m.stage)}`,
        `Double delight for ${hero.name} as ${winner.name} prevail`,
        `${hero.name} does it twice over to sink ${nameOf(loser)}`,
      ]);
    } else if (clean) {
      tag = "Clean sheet";
      headline = pick(seed + "cs", [
        `${winner.name} keep it tight and take the spoils`,
        `Solid at the back, clinical up front — ${winner.name} get the job done`,
        `${nameOf(loser)} blunted as ${winner.name} shut up shop`,
      ]);
    } else if (margin === 1) {
      tag = "Squeaky finish";
      headline = pick(seed + "tight", [
        hero
          ? `${hero.name} settles a nervy night for ${winner.name}`
          : `${winner.name} scrape past ${nameOf(loser)}`,
        `One goal is all ${winner.name} need against ${nameOf(loser)}`,
        `${winner.name} edge a thriller with ${nameOf(loser)}`,
      ]);
    } else {
      headline = pick(seed + "gen", [
        `${winner.name} take control against ${nameOf(loser)}`,
        `${winner.name} march on at the expense of ${nameOf(loser)}`,
        `Job done for ${winner.name} in the ${stageNoun(m.stage)}`,
      ]);
    }

    const scoreline = `${nameOf(h)} ${m.home_score}-${m.away_score} ${nameOf(a)}${
      pensDecided ? ` (${m.home_pens}-${m.away_pens} pens)` : ""
    }`;
    const mvpPart = m.mvp_player_name ? ` · MVP ${m.mvp_player_name}` : "";

    push({
      id: `res-${m.id}`,
      kind: "result",
      tag,
      matchId: m.id,
      headline,
      detail: `${scoreline}${mvpPart}`,
    });
  }

  /* ===== 5. Golden Boot race ===== */
  const scorers = topScorers(data.goals, data.teams);
  if (scorers.length > 0) {
    const [lead, ...rest] = scorers;
    const chaser = rest.find((r) => r.goals < lead.goals);
    const tied = rest.filter((r) => r.goals === lead.goals);
    push({
      id: `boot-${lead.player}-${lead.goals}`,
      kind: "boot",
      tag: "Golden Boot",
      headline:
        tied.length > 0
          ? pick(`boot-tie-${lead.goals}`, [
              `${lead.player} and ${tied.length} rival${tied.length > 1 ? "s" : ""} deadlocked on ${lead.goals}`,
              `The race for the Golden Boot is wide open on ${lead.goals} goals`,
              `No one can shake off ${lead.player} at the top of the charts`,
            ])
          : pick(`boot-${lead.player}-${lead.goals}`, [
              `${lead.player} sits top of the scoring charts on ${lead.goals}`,
              `${lead.goals} and counting — ${lead.player} chases the Golden Boot`,
              `${lead.player} is the tournament's deadliest finisher`,
            ]),
      detail: chaser
        ? `${nameOf(lead.team)} · ${chaser.player} closest on ${chaser.goals}`
        : nameOf(lead.team),
    });
  }

  /* ===== 6. Golden Ball race ===== */
  const balls = goldenBall(data);
  if (balls.length > 0) {
    const [lead, second] = balls;
    const gap = second ? lead.score - second.score : null;
    push({
      id: `ball-${lead.player}-${lead.score}`,
      kind: "ball",
      tag: "Golden Ball",
      headline:
        gap === null
          ? `${lead.player} stands alone on the Golden Ball board`
          : gap === 0
            ? pick(`ball-lvl-${lead.score}`, [
                `${lead.player} and ${second.player} cannot be separated`,
                `A dead heat for the tournament's best player award`,
              ])
            : pick(`ball-${lead.player}-${lead.score}`, [
                `${lead.player} is the standout performer of the tournament`,
                `${lead.player} pulling clear in the Golden Ball reckoning`,
                `All-round brilliance has ${lead.player} leading the pack`,
              ]),
      detail:
        `${lead.goals}G · ${lead.assists}A · ${lead.clean_sheets}CS · ${lead.mvps}MVP` +
        (gap && gap > 0 ? ` — ${gap} pts clear of ${second.player}` : ""),
    });
  }

  /* ===== 7. Golden Glove ===== */
  const gk = [...data.gks].sort((a, b) => b.clean_sheets - a.clean_sheets || b.saves - a.saves)[0];
  if (gk && (gk.clean_sheets > 0 || gk.saves > 0)) {
    push({
      id: `gk-${gk.id}-${gk.clean_sheets}-${gk.saves}`,
      kind: "gloves",
      tag: "Golden Glove",
      headline: pick(`gk-${gk.id}-${gk.clean_sheets}`, [
        `${gk.player_name} is building a wall in goal`,
        `${gk.clean_sheets} shut-out${gk.clean_sheets === 1 ? "" : "s"} and counting for ${gk.player_name}`,
        `${gk.player_name} keeps making the difference between the sticks`,
      ]),
      detail: `${nameOf(gk.team_id ? teamById.get(gk.team_id) : null)} · ${gk.clean_sheets} clean sheets · ${gk.saves} saves`,
    });
  }

  /* ===== 8. Upcoming fixture preview ===== */
  const next = data.matches.find((m) => m.status === "scheduled");
  if (next) {
    const h = teamById.get(next.home_team_id ?? "");
    const a = teamById.get(next.away_team_id ?? "");
    push({
      id: `prev-${next.id}`,
      kind: "preview",
      tag: "Up next",
      matchId: next.id,
      headline: pick(`prev-${next.id}`, [
        `${nameOf(h)} meet ${nameOf(a)} with plenty at stake`,
        `All eyes on ${nameOf(h)} vs ${nameOf(a)}`,
        `${nameOf(a)} travel to face ${nameOf(h)} in the ${stageNoun(next.stage)}`,
        `Countdown to ${nameOf(h)} vs ${nameOf(a)}`,
      ]),
      detail: `${stageLabel[next.stage]} · kick-off to be confirmed`,
    });
  }

  return items;
}
