import { describe, expect, test } from "bun:test";
import { aggregateScore, matchWinner, supportsTwoLegs } from "../src/lib/tournament";
import type { Match, Team } from "../src/lib/tournament";

function fixture(overrides: Partial<Match> & Pick<Match, "id">): Match {
  return {
    id: overrides.id,
    stage: "r16",
    group_id: null,
    home_team_id: "team-a",
    away_team_id: "team-b",
    home_score: 0,
    away_score: 0,
    status: "scheduled",
    scheduled_at: null,
    mvp_player_name: null,
    mvp_team_id: null,
    bracket_slot: 1,
    leg_number: 1,
    home_pens: null,
    away_pens: null,
    went_to_extra_time: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const teams: Team[] = [
  { id: "team-a", name: "Team A", short_name: "A", logo_url: null, group_id: null },
  { id: "team-b", name: "Team B", short_name: "B", logo_url: null, group_id: null },
];

describe("two-leg knockout ties", () => {
  test("only round of 16, quarter-finals, and semi-finals support two legs", () => {
    expect(supportsTwoLegs("r16")).toBe(true);
    expect(supportsTwoLegs("qf")).toBe(true);
    expect(supportsTwoLegs("sf")).toBe(true);
    expect(supportsTwoLegs("group")).toBe(false);
    expect(supportsTwoLegs("final")).toBe(false);
  });

  test("keeps each leg's score and calculates aggregate in the first leg's team order", () => {
    const first = fixture({ id: "leg-1", home_score: 2, away_score: 0, status: "finished" });
    const second = fixture({
      id: "leg-2",
      home_team_id: "team-b",
      away_team_id: "team-a",
      home_score: 1,
      away_score: 0,
      status: "finished",
      leg_number: 2,
    });

    const aggregate = aggregateScore(first, [first, second]);
    expect(aggregate?.homeScore).toBe(2);
    expect(aggregate?.awayScore).toBe(1);
    expect(aggregate?.complete).toBe(true);
    expect(aggregate?.legs.map((leg) => [leg.leg_number, leg.home_score, leg.away_score])).toEqual([
      [1, 2, 0],
      [2, 1, 0],
    ]);
  });

  test("uses the second-leg penalty result to decide an aggregate draw", () => {
    const first = fixture({ id: "leg-1", home_score: 1, status: "finished" });
    const second = fixture({
      id: "leg-2",
      home_team_id: "team-b",
      away_team_id: "team-a",
      home_score: 1,
      status: "finished",
      leg_number: 2,
      home_pens: 4,
      away_pens: 5,
    });

    expect(matchWinner(first, teams, [first, second])?.id).toBe("team-a");
  });
});