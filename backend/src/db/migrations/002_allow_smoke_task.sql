-- Allow 'smoke' task in ai_usage_log for integration testing and telemetry
ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS ai_usage_log_task_check;
ALTER TABLE ai_usage_log ADD CONSTRAINT ai_usage_log_task_check CHECK (task IN ('triage', 'draft', 'smoke'));
