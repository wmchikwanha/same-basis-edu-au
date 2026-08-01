CREATE TABLE public.ai_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  adjustment_id uuid REFERENCES public.adjustments(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'generated',
  surface text NOT NULL DEFAULT 'planner',
  summary text NOT NULL DEFAULT '',
  duration_ms integer,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_activity_events TO authenticated;
GRANT ALL ON public.ai_activity_events TO service_role;

ALTER TABLE public.ai_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_activity_events_own ON public.ai_activity_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ai_activity_events_user_created_idx ON public.ai_activity_events (user_id, created_at DESC);