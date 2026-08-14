import type { IProviderConfig, ICustomProvider } from '@/types';

export const BUILTIN_PROVIDERS: IProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    adapterType: 'anthropic',
    isBuiltin: true,
    apiKeyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    adapterType: 'gemini',
    isBuiltin: true,
    apiKeyPlaceholder: 'AIza...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: 'sk-...',
  },
  {
    id: 'moonshot',
    name: '月之暗面 Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: 'sk-...',
  },
  {
    id: 'glm',
    name: '智谱 AI GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-4-flash', 'glm-4v', 'glm-3-turbo'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: '...',
  },
  {
    id: 'doubao',
    name: '字节豆包 Doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-pro-32k', 'doubao-pro-4k', 'doubao-lite-32k', 'doubao-lite-4k'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: '...',
  },
  {
    id: 'qwen',
    name: '通义千问 Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    adapterType: 'openai',
    isBuiltin: true,
    apiKeyPlaceholder: 'sk-...',
  },
];

export function customToProviderConfig(cp: ICustomProvider): IProviderConfig {
  return {
    id: cp.id,
    name: cp.name,
    baseUrl: cp.baseUrl,
    models: cp.models,
    adapterType: 'openai',
    isBuiltin: false,
    apiKeyPlaceholder: 'API Key',
  };
}

export function findProvider(providerId: string, customProviders: ICustomProvider[]): IProviderConfig | undefined {
  const builtin = BUILTIN_PROVIDERS.find(p => p.id === providerId);
  if (builtin) return builtin;
  const custom = customProviders.find(cp => cp.id === providerId);
  if (custom) return customToProviderConfig(custom);
  return undefined;
}
