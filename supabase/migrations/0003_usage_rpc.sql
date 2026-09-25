-- Olze v0.1 — usage accounting RPCs used by the API (run under the user's JWT, RLS-safe)

-- Count successful free-tier requests for a workspace in the current month.
CREATE OR REPLACE FUNCTION count_ai_usage_month(p_workspace_id UUID) RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM ai_usage
  WHERE workspace_id = p_workspace_id
    AND created_at >= date_trunc('month', now())
    AND is_workspace_member(p_workspace_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Insert one usage row (only for workspaces the caller belongs to).
CREATE OR REPLACE FUNCTION record_ai_usage(
  p_workspace_id UUID, p_provider TEXT, p_model TEXT,
  p_input_tokens INT, p_output_tokens INT, p_latency_ms INT,
  p_est_cost_usd NUMERIC, p_success BOOLEAN
) RETURNS VOID AS $$
BEGIN
  IF NOT is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'not a workspace member';
  END IF;
  INSERT INTO ai_usage (workspace_id, user_id, provider, model, input_tokens, output_tokens, latency_ms, est_cost_usd, success)
  VALUES (p_workspace_id, auth.uid(), p_provider, p_model, p_input_tokens, p_output_tokens, p_latency_ms, p_est_cost_usd, p_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION count_ai_usage_month(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_ai_usage(UUID,TEXT,TEXT,INT,INT,INT,NUMERIC,BOOLEAN) TO authenticated;
