
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS home_pens integer,
  ADD COLUMN IF NOT EXISTS away_pens integer,
  ADD COLUMN IF NOT EXISTS went_to_extra_time boolean NOT NULL DEFAULT false;

ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.goals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.teams; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.groups; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.assist_stats; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.gk_stats; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
