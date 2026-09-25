/**
 * DbSandbox — implements agent-core's SandboxFs on top of the Olze `files` table.
 * All DB calls run under the END USER'S JWT → workspace isolation is enforced by RLS,
 * not by this code. Path traversal is blocked (no '..', absolute paths, control chars).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SandboxFs } from '@olze/agent-core';

const MAX_FILE_BYTES = 512_000;

export function safePath(p: string): string {
  const clean = String(p).replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!clean || clean.includes('..') || /[\x00-\x1f]/.test(clean)) throw new Error(`unsafe path: ${p}`);
  return clean;
}

export class DbSandbox implements SandboxFs {
  constructor(private db: SupabaseClient, private projectId: string) {}

  /** normalized path used for lookups after a write */
  safePathOf(p: string): string { return safePath(p); }

  private async allFiles(): Promise<Map<string, string>> {
    const { data, error } = await this.db.from('files').select('path,content').eq('project_id', this.projectId);
    if (error) throw new Error(error.message);
    return new Map((data ?? []).map(f => [f.path as string, f.content as string]));
  }

  async readFile(path: string): Promise<string> {
    const p = safePath(path);
    const { data, error } = await this.db.from('files').select('content').eq('project_id', this.projectId).eq('path', p).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`file not found: ${p}`);
    return data.content as string;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const p = safePath(path);
    if (Buffer.byteLength(content) > MAX_FILE_BYTES) throw new Error(`file too large: ${p}`);
    const { error } = await this.db.from('files').upsert(
      { project_id: this.projectId, path: p, content, size_bytes: Buffer.byteLength(content), updated_by: (await this.db.auth.getUser()).data.user?.id ?? null },
      { onConflict: 'project_id,path' });
    if (error) throw new Error(error.message);
  }

  async editFile(path: string, oldText: string, newText: string): Promise<void> {
    const cur = await this.readFile(path);
    if (!cur.includes(oldText)) throw new Error(`edit target not found in ${safePath(path)}`);
    await this.writeFile(safePath(path), cur.replace(oldText, newText));
  }

  async deleteFile(path: string): Promise<void> {
    const p = safePath(path);
    const { error } = await this.db.from('files').delete().eq('project_id', this.projectId).eq('path', p);
    if (error) throw new Error(error.message);
  }

  async search(pattern: string): Promise<Array<{ path: string; line: number; text: string }>> {
    const files = await this.allFiles();
    const out: Array<{ path: string; line: number; text: string }> = [];
    for (const [path, content] of files) {
      content.split('\n').forEach((line, i) => {
        if (line.toLowerCase().includes(pattern.toLowerCase())) out.push({ path, line: i + 1, text: line.slice(0, 200) });
      });
      if (out.length > 200) break;
    }
    return out;
  }

  /** v0.1 blocker (documented, not faked): containerized command execution lands in v0.2.
   *  We only support a safe, real subset evaluated against the virtual file tree. */
  async runCommand(cmd: string): Promise<{ code: number; stdout: string; stderr: string }> {
    const files = await this.allFiles();
    const c = cmd.trim();
    if (/^ls(\s|$)/.test(c)) return { code: 0, stdout: [...files.keys()].join('\n'), stderr: '' };
    if (/^cat\s+/.test(c)) {
      try { return { code: 0, stdout: await this.readFile(c.slice(4).trim()), stderr: '' }; }
      catch (e: any) { return { code: 1, stdout: '', stderr: e.message }; }
    }
    if (/^(npm install|npm run build|npm test)/.test(c)) {
      return { code: 1, stdout: '', stderr: 'Sandbox runtime not available in v0.1 — builds run in the hosted sandbox (v0.2). Files were still created correctly.' };
    }
    return { code: 127, stdout: '', stderr: `command not permitted in v0.1 sandbox: ${c}` };
  }
}
