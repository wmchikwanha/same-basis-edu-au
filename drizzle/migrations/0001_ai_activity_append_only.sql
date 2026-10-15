DROP POLICY IF EXISTS ai_activity_events_own ON public.ai_activity_events;
CREATE POLICY ai_activity_events_insert_own ON public.ai_activity_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ai_activity_events_read_own ON public.ai_activity_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER ai_activity_events_append_only BEFORE UPDATE OR DELETE ON public.ai_activity_events FOR EACH ROW EXECUTE FUNCTION public.block_governance_mutation();