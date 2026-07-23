
-- SETTINGS
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  tournament_format TEXT NOT NULL DEFAULT 'groups',
  tournament_name TEXT NOT NULL DEFAULT 'eFootball World Cup',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "public write settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.settings (id) VALUES (1);

-- GROUPS
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon, authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);

-- Seed 12 groups A..L
INSERT INTO public.groups (name, position) VALUES
 ('A',1),('B',2),('C',3),('D',4),('E',5),('F',6),
 ('G',7),('H',8),('I',9),('J',10),('K',11),('L',12);

-- TEAMS
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

-- MATCHES
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL DEFAULT 'group', -- group|r32|r16|qf|sf|3rd|final
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|live|finished
  scheduled_at TIMESTAMPTZ,
  mvp_player_name TEXT,
  mvp_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  bracket_slot INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

-- GOALS (goal events)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  scorer_name TEXT NOT NULL,
  minute INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO anon, authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX goals_match_idx ON public.goals(match_id);
CREATE INDEX goals_scorer_idx ON public.goals(scorer_name);

-- ASSIST STATS (manual admin table)
CREATE TABLE public.assist_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  assists INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assist_stats TO anon, authenticated;
GRANT ALL ON public.assist_stats TO service_role;
ALTER TABLE public.assist_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all assist_stats" ON public.assist_stats FOR ALL USING (true) WITH CHECK (true);

-- GOALKEEPER STATS (manual admin table)
CREATE TABLE public.gk_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  clean_sheets INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gk_stats TO anon, authenticated;
GRANT ALL ON public.gk_stats TO service_role;
ALTER TABLE public.gk_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all gk_stats" ON public.gk_stats FOR ALL USING (true) WITH CHECK (true);
