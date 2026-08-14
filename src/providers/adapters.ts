import type { IStreamChunk, IChatOptions } from '@/types';

// ---------- SSE Parser ----------
export async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Process multi-line "data:" lines
        const dataLines: string[] = [];
        for (const line of rawEvent.split('\n')) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
        if (dataLines.length > 0) {
          yield dataLines.join('\n');
        }
      }
    }
    // Flush remaining
    if (buffer.trim().length > 0) {
      const dataLines: string[] = [];
      for (const line of buffer.split('\n')) {
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (dataLines.length > 0) {
        yield dataLines.join('\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------- OpenAI-compatible adapter ----------
export async function* openaiChat(opts: IChatOptions): AsyncGenerator<IStreamChunk> {
  const { apiKey, baseUrl, model, messages, systemPrompt, params, signal } = opts;

  const payload: Record<string, unknown> = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    stream: true,
    temperature: params.temperature,
    top_p: params.topP,
    frequency_penalty: params.frequencyPenalty,
    presence_penalty: params.presencePenalty,
  };
  if (params.maxTokens != null) {
    payload.max_tokens = params.maxTokens;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) msg = j.error.message;
    } catch { /* ignore */ }
    yield {
      content: '',
      done: true,
      error: { code: res.status, message: `${res.status} ${res.statusText}: ${msg}` },
    };
    return;
  }

  if (!res.body) {
    yield { content: '', done: true, error: { code: 'NO_BODY', message: 'No response body' } };
    return;
  }

  let usage: IStreamChunk['usage'];
  let hasContent = false;

  for await (const raw of parseSSE(res.body)) {
    if (raw === '[DONE]') {
      yield { content: '', done: true, usage };
      return;
    }
    try {
      const data = JSON.parse(raw);
      // Try to capture usage from last chunk (some providers include it)
      if (data.usage) {
        usage = {
          prompt_tokens: data.usage.prompt_tokens ?? 0,
          completion_tokens: data.usage.completion_tokens ?? 0,
          total_tokens: data.usage.total_tokens ?? 0,
        };
      }
      const delta = data?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        hasContent = true;
        yield { content: delta, done: false };
      }
      const finish = data?.choices?.[0]?.finish_reason;
      if (finish && hasContent) {
        yield { content: '', done: true, usage };
        return;
      }
    } catch {
      // ignore malformed chunks
    }
  }

  yield { content: '', done: true, usage };
}

// ---------- Anthropic adapter ----------
export async function* anthropicChat(opts: IChatOptions): AsyncGenerator<IStreamChunk> {
  const { apiKey, baseUrl, model, messages, systemPrompt, params, signal } = opts;

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: params.temperature,
    top_p: params.topP,
  };
  if (systemPrompt) {
    payload.system = systemPrompt;
  }
  if (params.maxTokens != null) {
    payload.max_tokens = params.maxTokens;
  } else {
    payload.max_tokens = 4096; // Anthropic requires max_tokens
  }

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) msg = j.error.message;
    } catch { /* ignore */ }
    yield {
      content: '',
      done: true,
      error: { code: res.status, message: `${res.status} ${res.statusText}: ${msg}` },
    };
    return;
  }

  if (!res.body) {
    yield { content: '', done: true, error: { code: 'NO_BODY', message: 'No response body' } };
    return;
  }

  let promptTokens = 0;
  let completionTokens = 0;

  for await (const raw of parseSSE(res.body)) {
    try {
      const data = JSON.parse(raw);
      const type = data.type;

      if (type === 'message_start') {
        if (data.message?.usage) {
          promptTokens = data.message.usage.input_tokens ?? 0;
        }
      } else if (type === 'content_block_delta') {
        const text = data.delta?.text;
        if (typeof text === 'string' && text.length > 0) {
          yield { content: text, done: false };
        }
      } else if (type === 'message_delta') {
        if (data.usage) {
          completionTokens = data.usage.output_tokens ?? 0;
        }
      } else if (type === 'message_stop') {
        yield {
          content: '',
          done: true,
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
          },
        };
        return;
      }
    } catch {
      // ignore
    }
  }

  yield {
    content: '',
    done: true,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

// ---------- Google Gemini adapter ----------
export async function* geminiChat(opts: IChatOptions): AsyncGenerator<IStreamChunk> {
  const { apiKey, baseUrl, model, messages, systemPrompt, params, signal } = opts;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const generationConfig: Record<string, unknown> = {
    temperature: params.temperature,
    topP: params.topP,
  };
  if (params.maxTokens != null) {
    generationConfig.maxOutputTokens = params.maxTokens;
  }
  if (params.topK != null) {
    generationConfig.topK = params.topK;
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig,
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `${baseUrl}/models/${model}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) msg = j.error.message;
    } catch { /* ignore */ }
    yield {
      content: '',
      done: true,
      error: { code: res.status, message: `${res.status} ${res.statusText}: ${msg}` },
    };
    return;
  }

  if (!res.body) {
    yield { content: '', done: true, error: { code: 'NO_BODY', message: 'No response body' } };
    return;
  }

  let promptTokens = 0;
  let completionTokens = 0;

  for await (const raw of parseSSE(res.body)) {
    try {
      const data = JSON.parse(raw);
      // Gemini may return array of candidates
      const candidates = Array.isArray(data) ? data : data.candidates ? [data] : [];
      const first = Array.isArray(data) ? data[0] : data;

      // Try token usage
      const meta = first?.usageMetadata;
      if (meta) {
        promptTokens = meta.promptTokenCount ?? promptTokens;
        completionTokens = meta.candidatesTokenCount ?? completionTokens;
      }

      const parts = first?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        const text = parts.map((p: { text?: string }) => p.text ?? '').join('');
        if (text.length > 0) {
          yield { content: text, done: false };
        }
      }

      const finish = first?.candidates?.[0]?.finishReason;
      if (finish && finish !== 'STOP') {
        // non-STOP finish reasons: MAX_TOKENS, SAFETY, etc.
      }

      if (Array.isArray(candidates) && candidates.length > 0 && first?.candidates?.[0]?.finishReason === 'STOP') {
        yield {
          content: '',
          done: true,
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
          },
        };
        return;
      }
    } catch {
      // ignore
    }
  }

  yield {
    content: '',
    done: true,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

// ---------- Dispatcher ----------
export function chatStream(
  adapterType: 'openai' | 'anthropic' | 'gemini',
  opts: IChatOptions,
): AsyncGenerator<IStreamChunk> {
  switch (adapterType) {
    case 'openai':
      return openaiChat(opts);
    case 'anthropic':
      return anthropicChat(opts);
    case 'gemini':
      return geminiChat(opts);
  }
}
