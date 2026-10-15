import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const model = body.model || 'qwen2.5-coder-32b-instruct';
    const messages = body.messages || [];
    const promptText = messages.map((m: { content: string }) => m.content).join('\n');

    // Extract target package from prompt if present
    const pkgMatch = promptText.match(/dependency\s+"([^"]+)"/i) || promptText.match(/package\s+"([^"]+)"/i);
    const targetPkg = pkgMatch ? pkgMatch[1] : 'dependency';

    // Open-weight AI analyst structured response format
    const mockExitPlan = {
      plan: [
        `Identify all call sites and symbols of ${targetPkg}`,
        'Wrap proprietary calls into standard open protocol client',
        'Update configuration to read endpoint from EXITKIT_BASE_URL',
        `Prune ${targetPkg} from dependencies file`,
      ],
      diff: `--- a/agent.py\n+++ b/agent.py\n@@ -10,3 +10,3 @@\n-import ${targetPkg}\n+import openai\n`,
      claims: [
        {
          id: 'c1',
          type: 'only_used_in',
          statement: `${targetPkg} is only used in agent.py`,
          params: { package: targetPkg, files: ['agent.py'] },
        },
        {
          id: 'c2',
          type: 'schema_compat',
          statement: `Client calls can be rewritten directly into OpenAI-compatible chat format`,
          params: {},
        },
      ],
    };

    const completion = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '```json\n' + JSON.stringify(mockExitPlan, null, 2) + '\n```',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 350,
        completion_tokens: 280,
        total_tokens: 630,
      },
    };

    return NextResponse.json(completion);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid gateway request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
