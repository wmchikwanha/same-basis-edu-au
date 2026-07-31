ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_consent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS year_level integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS assessment_context text NOT NULL DEFAULT '';