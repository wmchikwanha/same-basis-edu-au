CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.school_members (
  user_id uuid PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.school_members TO authenticated;
GRANT ALL ON public.school_members TO service_role;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.user_school_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.school_members WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin_of(_admin uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_admin, 'admin')
    AND EXISTS (
      SELECT 1 FROM public.school_members a
      JOIN public.school_members t ON t.school_id = a.school_id
      WHERE a.user_id = _admin AND t.user_id = _target
    )
$$;

CREATE POLICY schools_member_read ON public.schools FOR SELECT TO authenticated
  USING (id = public.user_school_id(auth.uid()));
CREATE POLICY schools_admin_update ON public.schools FOR UPDATE TO authenticated
  USING (id = public.user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = public.user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY members_read ON public.school_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_admin_of(auth.uid(), user_id));

CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_admin_of(auth.uid(), user_id));

-- Append-only governance log
CREATE TABLE public.governance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL,
  actor_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'ai',
  event_type text NOT NULL,
  target_type text,
  target_id uuid,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX governance_events_school_idx ON public.governance_events (school_id, created_at DESC);
GRANT SELECT, INSERT ON public.governance_events TO authenticated;
GRANT SELECT, INSERT ON public.governance_events TO service_role;
ALTER TABLE public.governance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY gov_insert_self ON public.governance_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND school_id IS NOT DISTINCT FROM public.user_school_id(auth.uid()));
CREATE POLICY gov_read ON public.governance_events FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR (public.has_role(auth.uid(), 'admin') AND school_id = public.user_school_id(auth.uid())));

CREATE OR REPLACE FUNCTION public.block_governance_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'governance_events is append-only';
END;
$$;
CREATE TRIGGER governance_events_append_only
  BEFORE UPDATE OR DELETE ON public.governance_events
  FOR EACH ROW EXECUTE FUNCTION public.block_governance_mutation();

-- Equity / zero-discrimination flags
CREATE TABLE public.equity_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  surface text NOT NULL DEFAULT 'planner',
  category text NOT NULL,
  phrase text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  excerpt text NOT NULL DEFAULT '',
  detector text NOT NULL DEFAULT 'rules',
  status text NOT NULL DEFAULT 'open',
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.equity_flags TO authenticated;
GRANT ALL ON public.equity_flags TO service_role;
ALTER TABLE public.equity_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY equity_insert_own ON public.equity_flags FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY equity_read ON public.equity_flags FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY equity_admin_update ON public.equity_flags FOR UPDATE TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id))
  WITH CHECK (public.is_school_admin_of(auth.uid(), user_id));

-- School admin oversight on existing teacher data
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), id));
CREATE POLICY classes_admin_read ON public.classes FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY classes_admin_insert ON public.classes FOR INSERT TO authenticated
  WITH CHECK (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY students_admin_read ON public.students FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY students_admin_insert ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY students_admin_update ON public.students FOR UPDATE TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id))
  WITH CHECK (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY adjustments_admin_read ON public.adjustments FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY evidence_admin_read ON public.evidence_logs FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY activity_admin_read ON public.ai_activity_events FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));
CREATE POLICY topics_admin_read ON public.curriculum_topics FOR SELECT TO authenticated
  USING (public.is_school_admin_of(auth.uid(), user_id));