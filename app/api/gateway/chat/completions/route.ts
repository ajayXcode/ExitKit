import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const upstreamBase =
      process.env.LOCAL_LLM_URL ||
      process.env.OPENAI_BASE_URL ||
      process.env.EXITKIT_UPSTREAM_URL ||
      'http://127.0.0.1:11434/v1';

    const apiKey =
      process.env.LOCAL_LLM_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.EXITKIT_API_KEY ||
      'x';

    try {
      const upstreamRes = await fetch(`${upstreamBase.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text();
        return NextResponse.json(
          { error: `Upstream local LLM error (${upstreamRes.status}): ${errorText}` },
          { status: upstreamRes.status }
        );
      }

      const data = await upstreamRes.json();
      return NextResponse.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: `No local LLM available at ${upstreamBase}. Ensure Ollama, vLLM, or your OpenAI-compatible local model server is running, or configure LOCAL_LLM_URL. (${msg})`,
        },
        { status: 503 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid gateway request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
