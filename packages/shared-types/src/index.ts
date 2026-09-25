/**
 * @olze/shared-types — contracts shared by web app, API, CLI, VS Code extension,
 * desktop and browser extension. One engine, many surfaces: everyone speaks these types.
 */

// ── Auth / Workspaces ────────────────────────────────────────────────
export type WorkspaceRole = 'owner' | 'admin' | 'developer' | 'designer' | 'viewer';
export type PlanCode = 'free' | 'pro' | 'business' | 'enterprise';

export interface Profile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: PlanCode;
  role: WorkspaceRole; // caller's role
}

// ── Projects & Files ─────────────────────────────────────────────────
export type TemplateId =
  | 'blank' | 'nextjs' | 'react' | 'landing-page' | 'saas'
  | 'dashboard' | 'ecommerce' | 'portfolio';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  template: TemplateId;
  framework?: string;
  prompt?: string;          // "describe your idea" origin text
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;             // e.g. "app/page.tsx"
  content: string;
  sizeBytes: number;
  updatedAt: string;
  updatedBy?: 'user' | 'agent';
}

export interface CreateProjectRequest {
  workspaceId: string;
  name?: string;
  template?: TemplateId;
  /** If present, the AI agent builds the project from this description. */
  prompt?: string;
}

// ── AI Gateway ───────────────────────────────────────────────────────
export type ProviderId =
  | 'olze-free' | 'openrouter' | 'groq' | 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
}

export interface ChatRequest {
  workspaceId: string;
  messages: ChatMessage[];
  tools?: ToolSpec[];
  preferredModel?: string;   // undefined → free-first routing
  kind: 'chat' | 'agent';
}

export interface ChatDelta {
  content?: string;
  toolCalls?: Array<{ id: string; name: string; argumentsJson: string }>;
  done: boolean;
  usage?: TokenUsage;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  estCostUsd: number;
}

export interface QuotaInfo {
  requestsUsed: number;
  requestsLimit: number;     // 100 for free tier (tunable)
  warningsAt: number[];      // [60, 90] percentages
  hasByoKey: boolean;        // BYO key ⇒ unlimited by Olze quota
}

// ── Agent ────────────────────────────────────────────────────────────
export type ActionClass = 'read' | 'write' | 'execute' | 'deploy' | 'delete';

export interface AgentToolCall {
  id: string;
  name: 'read_file' | 'write_file' | 'edit_file' | 'delete_file'
      | 'search_code' | 'run_command' | 'install_package' | 'deploy';
  args: Record<string, unknown>;
}

export type RiskLevel = 'safe' | 'needs_confirmation';

export interface AgentEvent {
  sessionId: string;
  seq: number;
  type: 'plan' | 'tool_call' | 'tool_result' | 'awaiting_confirm' | 'message' | 'done' | 'error';
  actionClass?: ActionClass;
  risk?: RiskLevel;
  toolCall?: AgentToolCall;
  resultSummary?: string;
  message?: string;
}

export interface ConfirmActionRequest {
  sessionId: string;
  seq: number;
  approve: boolean;
}

// ── Deployments & Integrations ──────────────────────────────────────
export interface Deployment {
  id: string;
  projectId: string;
  environment: 'preview' | 'production';
  status: 'queued' | 'building' | 'ready' | 'failed';
  url?: string;
  provider: 'vercel';
  commitSha?: string;
}

export type IntegrationProvider = 'github' | 'supabase' | 'vercel';

export interface IntegrationConnection {
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  accountLabel?: string;
  connectedAt: string;
  // NOTE: tokens are NEVER serialized to clients — only connection metadata.
}
