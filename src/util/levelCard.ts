/**
 * レベルカード画像の生成 (fork のテスト環境専用)。
 * Python + Pillow のスクリプトを子プロセスで呼び、PNG を受け取る。
 * LEVEL_CARD_PYTHON が未設定、または生成に失敗した場合は null を返し、
 * 呼び出し側は Embed のみの表示にフォールバックする。
 */
export interface LevelCardParams {
  name: string;
  level: number;
  current: number;
  next: number;
  total: number;
  serverRank: number;
  globalRank: number;
  avatarUrl: string;
}

export async function renderLevelCard(params: LevelCardParams): Promise<Buffer | null> {
  const python = process.env.LEVEL_CARD_PYTHON;
  if (!python) return null;

  const script = process.env.LEVEL_CARD_SCRIPT ?? `${process.cwd()}/tools/level_card.py`;

  try {
    const proc = Bun.spawn([python, script], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
    });

    const timeout = setTimeout(() => proc.kill(), 15000);
    proc.stdin.write(JSON.stringify(params));
    proc.stdin.end();

    const data = await new Response(proc.stdout).arrayBuffer();
    const code = await proc.exited;
    clearTimeout(timeout);

    if (code !== 0 || data.byteLength === 0) return null;
    return Buffer.from(data);
  } catch {
    return null;
  }
}
