-- ============================================================
-- Olze — Billing stubs (Phase 25/26). Created but INACTIVE until Stage 2.
-- The free tier works without these rows; do not gate core features on them.
-- ============================================================

CREATE TABLE plans (
  code              TEXT PRIMARY KEY,      -- free | pro | business
  name              TEXT NOT NULL,
  monthly_credits   INT  NOT NULL DEFAULT 0,
  ai_requests_month INT  NOT NULL DEFAULT 100,
  price_usd_month   NUMERIC(10,2) NOT NULL DEFAULT 0,
  features          JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO plans (code, name, monthly_credits, ai_requests_month, price_usd_month) VALUES
  ('free',     'Olze Free',     100,    100, 0),
  ('pro',      'Olze Pro',    10000,  10000, 19),
  ('business', 'Olze Business', 50000, 50000, 79);

CREATE TABLE subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_code    TEXT NOT NULL REFERENCES plans(code),
  provider     TEXT NOT NULL DEFAULT 'stripe',
  provider_sub_id TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_end TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE credit_balances (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  balance      INT NOT NULL DEFAULT 100,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE credit_tx_kind AS ENUM ('grant','spend','refund','adjustment');

CREATE TABLE credit_transactions (
  id           BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind         credit_tx_kind NOT NULL,
  amount       INT NOT NULL,               -- positive grant / negative spend
  reason       TEXT NOT NULL,              -- ai_generation | agent_run | purchase | bonus ...
  ref_id       TEXT,                       -- link to ai_usage.id / stripe invoice
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_credits_upd BEFORE UPDATE ON credit_balances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_public ON plans FOR SELECT USING (true);
CREATE POLICY subs_read ON subscriptions FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY bal_read ON credit_balances FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY tx_read ON credit_transactions FOR SELECT USING (is_workspace_member(workspace_id));
-- writes go through service role (Stripe webhooks / quota engine) only
