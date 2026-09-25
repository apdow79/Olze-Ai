-- Olze v0.1 — create the caller's personal workspace atomically.
CREATE OR REPLACE FUNCTION bootstrap_workspace(p_name TEXT) RETURNS JSONB AS $$
DECLARE ws UUID; slug_base TEXT; i INT := 0; s TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO ws FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id
   WHERE m.user_id = auth.uid() LIMIT 1;
  IF ws IS NOT NULL THEN RETURN jsonb_build_object('id', ws); END IF;
  slug_base := lower(regexp_replace(coalesce(nullif(p_name,''),'workspace'), '[^a-z0-9]+', '-', 'g'));
  LOOP
    s := slug_base || CASE WHEN i = 0 THEN '' ELSE '-' || i::text END;
    BEGIN
      INSERT INTO workspaces (name, slug, created_by) VALUES (coalesce(nullif(p_name,''),'My workspace'), s, auth.uid()) RETURNING id INTO ws;
      EXIT;
    EXCEPTION WHEN unique_violation THEN i := i + 1;
    END;
  END LOOP;
  INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (ws, auth.uid(), 'owner');
  RETURN jsonb_build_object('id', ws);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION bootstrap_workspace(TEXT) TO authenticated;
