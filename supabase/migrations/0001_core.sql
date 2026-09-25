-- ============================================================
-- Olze v0.1 — Core schema (Supabase / Postgres)
-- Migration: 0001_core.sql
-- Auth lives in Supabase's `auth.users`; we extend it below.
-- RLS is ON everywhere; access flows through workspace_members.
-- ============================================================

-- helper: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ---------- profiles ----------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  theme        TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- workspaces ----------
CREATE TABLE workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  plan       TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business','enterprise')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE workspace_role AS ENUM ('owner','admin','developer','designer','viewer');

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         workspace_role NOT NULL DEFAULT 'owner',
  invited_by   UUID REFERENCES auth.users(id),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ---------- projects & files ----------
CREATE TYPE project_status AS ENUM ('active','archived');

CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  template     TEXT NOT NULL DEFAULT 'blank',
  framework    TEXT,
  prompt       TEXT,                       -- original "describe your idea" text
  status       project_status NOT NULL DEFAULT 'active',
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,               -- e.g. app/page.tsx
  content     TEXT NOT NULL DEFAULT '',
  size_bytes  INT  NOT NULL DEFAULT 0,
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);

CREATE TABLE file_versions (
  id         BIGSERIAL PRIMARY KEY,
  file_id    UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  author_id  UUID REFERENCES auth.users(id),
  source     TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user','agent','import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- deployments ----------
CREATE TYPE deployment_env AS ENUM ('preview','production');
CREATE TYPE deployment_status AS ENUM ('queued','building','ready','failed');

CREATE TABLE deployments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment  deployment_env NOT NULL DEFAULT 'preview',
  status       deployment_status NOT NULL DEFAULT 'queued',
  url          TEXT,
  provider     TEXT NOT NULL DEFAULT 'vercel',
  commit_sha   TEXT,
  logs_url     TEXT,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);

-- ---------- integration connections (tokens stored server-side only!) ----------
CREATE TABLE integration_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('github','supabase','vercel')),
  account_label TEXT,
  token_enc     BYTEA NOT NULL,            -- AES-256-GCM ciphertext; key in KMS, never in DB
  scope         TEXT,
  connected_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at    TIMESTAMPTZ,
  UNIQUE (workspace_id, provider)
);

-- ---------- AI usage / quota (foundation for fair-use + future credits) ----------
CREATE TABLE ai_usage (
  id            BIGSERIAL PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  provider      TEXT NOT NULL,             -- groq | openrouter | gemini | openai | anthropic | ollama
  model         TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','agent','embedding')),
  input_tokens  INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  est_cost_usd  NUMERIC(10,6) NOT NULL DEFAULT 0,
  latency_ms    INT,
  success       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_usage_ws_month ON ai_usage (workspace_id, created_at);

-- ---------- agent sessions & audit ----------
CREATE TABLE agent_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_by  UUID NOT NULL REFERENCES auth.users(id),
  goal        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','waiting_confirm','done','failed','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

CREATE TABLE agent_events (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  tool        TEXT NOT NULL,               -- read_file | write_file | edit_file | run_command | deploy ...
  action_class TEXT NOT NULL CHECK (action_class IN ('read','write','execute','deploy','delete')),
  payload     JSONB NOT NULL DEFAULT '{}', -- redacted: no secrets ever
  confirmed_by UUID REFERENCES auth.users(id),  -- set when user approved a risky action
  ok          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- triggers ----------
CREATE TRIGGER trg_profiles_upd     BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_workspaces_upd   BEFORE UPDATE ON workspaces  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_upd     BEFORE UPDATE ON projects    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- RLS ----------
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE files                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events          ENABLE ROW LEVEL SECURITY;

-- helper functions used by policies
CREATE OR REPLACE FUNCTION is_workspace_member(ws UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM workspace_members m
                 WHERE m.workspace_id = ws AND m.user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION workspace_role(ws UUID) RETURNS workspace_role AS $$
  SELECT role FROM workspace_members WHERE workspace_id = ws AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY profiles_self ON profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY ws_read ON workspaces FOR SELECT USING (is_workspace_member(id));
CREATE POLICY ws_write ON workspaces FOR ALL
  USING (created_by = auth.uid() OR workspace_role(id) IN ('owner','admin'))
  WITH CHECK (created_by = auth.uid() OR workspace_role(id) IN ('owner','admin'));

CREATE POLICY wm_read ON workspace_members FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY wm_manage ON workspace_members FOR ALL
  USING (workspace_role(workspace_id) IN ('owner','admin'))
  WITH CHECK (workspace_role(workspace_id) IN ('owner','admin'));

CREATE POLICY projects_rw ON projects FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY files_rw ON files FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));

CREATE POLICY fv_rw ON file_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM files f JOIN projects p ON p.id=f.project_id
                 WHERE f.id = file_id AND is_workspace_member(p.workspace_id)));

CREATE POLICY deploys_rw ON deployments FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));

-- integration tokens: service-role only from the API; humans never query directly
CREATE POLICY intc_none ON integration_connections FOR ALL USING (false);

CREATE POLICY usage_read ON ai_usage FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY sessions_rw ON agent_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));

CREATE POLICY events_rw ON agent_events FOR ALL
  USING (EXISTS (SELECT 1 FROM agent_sessions s JOIN projects p ON p.id=s.project_id
                 WHERE s.id = session_id AND is_workspace_member(p.workspace_id)));
