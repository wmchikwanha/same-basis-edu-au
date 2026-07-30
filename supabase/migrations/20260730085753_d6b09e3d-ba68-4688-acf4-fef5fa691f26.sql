CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Teacher',
  school_name text NOT NULL DEFAULT 'Main Stream High School',
  state text NOT NULL DEFAULT 'NSW',
  role text NOT NULL DEFAULT 'Classroom Teacher',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  year_level integer NOT NULL DEFAULT 8,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_own" ON public.classes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text NOT NULL,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_own" ON public.students FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  year_level integer NOT NULL DEFAULT 8,
  topic text NOT NULL,
  strand text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_topics TO authenticated;
GRANT ALL ON public.curriculum_topics TO service_role;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum_topics_own" ON public.curriculum_topics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  curriculum_topic_id uuid REFERENCES public.curriculum_topics(id) ON DELETE SET NULL,
  activity_description text NOT NULL DEFAULT '',
  generated_adjustment text NOT NULL DEFAULT '',
  udl_benefit text NOT NULL DEFAULT '',
  cultural_note text,
  trauma_note text,
  rationale text NOT NULL DEFAULT '',
  nccd_pillar text NOT NULL DEFAULT 'Adjustment',
  evidence_type text NOT NULL DEFAULT 'QDTP',
  teacher_action text,
  status text NOT NULL DEFAULT 'suggested',
  created_at timestamptz NOT NULL DEFAULT now(),
  implemented_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adjustments TO authenticated;
GRANT ALL ON public.adjustments TO service_role;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adjustments_own" ON public.adjustments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.evidence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adjustment_id uuid REFERENCES public.adjustments(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT current_date,
  week_number integer NOT NULL DEFAULT 1,
  pillar text NOT NULL DEFAULT 'Adjustment',
  evidence_summary text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'teacher-recorded',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_logs TO authenticated;
GRANT ALL ON public.evidence_logs TO service_role;
ALTER TABLE public.evidence_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_logs_own" ON public.evidence_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_students_user ON public.students(user_id);
CREATE INDEX idx_adjustments_user ON public.adjustments(user_id);
CREATE INDEX idx_evidence_logs_user ON public.evidence_logs(user_id);