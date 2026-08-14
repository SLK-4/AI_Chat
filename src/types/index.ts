// Core type definitions for the AI Chat tool

export interface IMessageUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IMessageError {
  code: string | number;
  message: string;
}

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  usage?: IMessageUsage;
  duration?: number; // ms
  error?: IMessageError;
}

export interface IConversationParams {
  systemPrompt: string;
  temperature: number;
  maxTokens?: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface IConversation {
  id: string;
  title: string;
  providerId: string;
  model: string;
  messages: IMessage[];
  params: IConversationParams;
  createdAt: number;
  updatedAt: number;
}

export interface IAppSettings {
  theme: 'dark' | 'light';
  defaultProviderId: string;
  defaultModel: string;
  sidebarCollapsed: boolean;
  paramsPanelCollapsed: boolean;
}

export interface ICustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
}

export interface IProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  adapterType: 'openai' | 'anthropic' | 'gemini';
  isBuiltin: boolean;
  apiKeyPlaceholder?: string;
}

export interface IStreamChunk {
  content: string;
  done: boolean;
  usage?: IMessageUsage;
  error?: IMessageError;
}

export interface IChatOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: IMessage[];
  systemPrompt: string;
  params: IConversationParams;
  signal: AbortSignal;
}

export const DEFAULT_PARAMS: IConversationParams = {
  systemPrompt: '',
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const DEFAULT_SETTINGS: IAppSettings = {
  theme: 'dark',
  defaultProviderId: 'openai',
  defaultModel: 'gpt-4o-mini',
  sidebarCollapsed: false,
  paramsPanelCollapsed: false,
};
