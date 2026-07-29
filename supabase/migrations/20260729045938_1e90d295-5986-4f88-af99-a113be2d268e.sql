-- settings
DROP POLICY IF EXISTS "public write settings" ON public.settings;
DROP POLICY IF EXISTS "public read settings" ON public.settings;
CREATE POLICY "public read settings" ON public.settings FOR SELECT USING (true);

-- groups
DROP POLICY IF EXISTS "public all groups" ON public.groups;
CREATE POLICY "public read groups" ON public.groups FOR SELECT USING (true);

-- teams
DROP POLICY IF EXISTS "public all teams" ON public.teams;
CREATE POLICY "public read teams" ON public.teams FOR SELECT USING (true);

-- matches
DROP POLICY IF EXISTS "public all matches" ON public.matches;
CREATE POLICY "public read matches" ON public.matches FOR SELECT USING (true);

-- goals
DROP POLICY IF EXISTS "public all goals" ON public.goals;
CREATE POLICY "public read goals" ON public.goals FOR SELECT USING (true);

-- assist_stats
DROP POLICY IF EXISTS "public all assist_stats" ON public.assist_stats;
CREATE POLICY "public read assist_stats" ON public.assist_stats FOR SELECT USING (true);

-- gk_stats
DROP POLICY IF EXISTS "public all gk_stats" ON public.gk_stats;
CREATE POLICY "public read gk_stats" ON public.gk_stats FOR SELECT USING (true);

-- Revoke browser-side write privileges; reads stay open, service role keeps full access.
REVOKE INSERT, UPDATE, DELETE ON public.settings, public.groups, public.teams, public.matches, public.goals, public.assist_stats, public.gk_stats FROM anon, authenticated;
GRANT SELECT ON public.settings, public.groups, public.teams, public.matches, public.goals, public.assist_stats, public.gk_stats TO anon, authenticated;
GRANT ALL ON public.settings, public.groups, public.teams, public.matches, public.goals, public.assist_stats, public.gk_stats TO service_role;