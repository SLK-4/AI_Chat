import { scopedStorage } from '@lark-apaas/client-toolkit-lite';

export const STORAGE_KEYS = {
  conversations: 'ai_chat_conversations',
  currentId: 'ai_chat_current_id',
  apiKeys: 'ai_chat_api_keys',
  settings: 'ai_chat_settings',
  customProviders: 'ai_chat_custom_providers',
} as const;

export function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = scopedStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSet<T>(key: string, value: T): void {
  try {
    scopedStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatNumber(n: number): string {
  if (n == null) return '-';
  return n.toLocaleString();
}

export function extractTitle(content: string, maxLen = 20): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (!clean) return '新对话';
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
}

export function downloadFile(filename: string, content: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
