import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  STORAGE_KEYS,
  safeGet,
  safeSet,
  generateId,
  extractTitle,
} from '@/lib/storage';
import {
  DEFAULT_PARAMS,
  DEFAULT_SETTINGS,
  type IConversation,
  type IConversationParams,
  type IAppSettings,
  type IMessage,
  type ICustomProvider,
} from '@/types';
import { BUILTIN_PROVIDERS, findProvider, customToProviderConfig } from '@/providers/config';
import { chatStream } from '@/providers/adapters';

interface AppContextValue {
  // Conversations
  conversations: IConversation[];
  currentConversationId: string | null;
  currentConversation: IConversation | null;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setCurrentConversationId: (id: string) => void;
  updateConversationParams: (id: string, params: Partial<IConversationParams>) => void;
  resetParams: (id: string) => void;
  setProviderAndModel: (id: string, providerId: string, model: string) => void;

  // Messages
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  isGenerating: boolean;
  regenerateLast: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;

  // Settings
  settings: IAppSettings;
  updateSettings: (patch: Partial<IAppSettings>) => void;
  apiKeys: Record<string, string>;
  setApiKey: (providerId: string, key: string) => void;
  customProviders: ICustomProvider[];
  addCustomProvider: (p: Omit<ICustomProvider, 'id'>) => void;
  removeCustomProvider: (id: string) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Data operations
  exportAllData: () => string;
  importAllData: (json: string, mode: 'merge' | 'replace') => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<IConversation[]>(
    () => safeGet<IConversation[]>(STORAGE_KEYS.conversations, []),
  );
  const [currentConversationId, setCurrentConversationIdState] = useState<string | null>(
    () => safeGet<string | null>(STORAGE_KEYS.currentId, null),
  );
  const [settings, setSettings] = useState<IAppSettings>(
    () => safeGet<IAppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(
    () => safeGet<Record<string, string>>(STORAGE_KEYS.apiKeys, {}),
  );
  const [customProviders, setCustomProviders] = useState<ICustomProvider[]>(
    () => safeGet<ICustomProvider[]>(STORAGE_KEYS.customProviders, []),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef<IConversation[]>([]);

  // Keep ref in sync with conversations state
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // --- Persistence effects ---
  useEffect(() => { safeSet(STORAGE_KEYS.conversations, conversations); }, [conversations]);
  useEffect(() => { safeSet(STORAGE_KEYS.currentId, currentConversationId); }, [currentConversationId]);
  useEffect(() => { safeSet(STORAGE_KEYS.settings, settings); }, [settings]);
  useEffect(() => { safeSet(STORAGE_KEYS.apiKeys, apiKeys); }, [apiKeys]);
  useEffect(() => { safeSet(STORAGE_KEYS.customProviders, customProviders); }, [customProviders]);

  // --- Theme effect ---
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [settings.theme]);

  // --- Computed ---
  const currentConversation = conversations.find(c => c.id === currentConversationId) ?? null;

  // --- Conversation actions ---
  const createConversation = useCallback((): string => {
    const id = generateId('conv');
    const now = Date.now();
    const newConv: IConversation = {
      id,
      title: '新对话',
      providerId: settings.defaultProviderId,
      model: settings.defaultModel,
      messages: [],
      params: { ...DEFAULT_PARAMS },
      createdAt: now,
      updatedAt: now,
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationIdState(id);
    return id;
  }, [settings.defaultProviderId, settings.defaultModel]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      return next;
    });
    setCurrentConversationIdState(prevId => {
      if (prevId === id) {
        return null;
      }
      return prevId;
    });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c));
  }, []);

  const setCurrentConversationId = useCallback((id: string) => {
    setCurrentConversationIdState(id);
  }, []);

  const updateConversationParams = useCallback((id: string, patch: Partial<IConversationParams>) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, params: { ...c.params, ...patch }, updatedAt: Date.now() } : c,
    ));
  }, []);

  const resetParams = useCallback((id: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, params: { ...DEFAULT_PARAMS }, updatedAt: Date.now() } : c,
    ));
  }, []);

  const setProviderAndModel = useCallback((id: string, providerId: string, model: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, providerId, model, updatedAt: Date.now() } : c,
    ));
  }, []);

  // --- Settings actions ---
  const updateSettings = useCallback((patch: Partial<IAppSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const setApiKey = useCallback((providerId: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: key }));
  }, []);

  const addCustomProvider = useCallback((p: Omit<ICustomProvider, 'id'>) => {
    const newP: ICustomProvider = { ...p, id: generateId('custom') };
    setCustomProviders(prev => [...prev, newP]);
  }, []);

  const removeCustomProvider = useCallback((id: string) => {
    setCustomProviders(prev => prev.filter(p => p.id !== id));
    setApiKeys(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  // --- Stream helper ---
  const runStream = useCallback(async (
    convId: string,
    userMsgId: string,
    assistantMsgId: string,
    providerId: string,
    model: string,
    params: IConversationParams,
    messages: IMessage[],
  ) => {
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const startTime = Date.now();

    try {
      const provider = findProvider(providerId, customProviders);
      if (!provider) {
        throw new Error(`未找到服务商: ${providerId}`);
      }

      const key = apiKeys[providerId] || '';
      if (!key.trim()) {
        throw new Error(`请先在设置中配置 ${provider.name} 的 API Key`);
      }

      // Build messages up to userMsgId (inclusive) — handles edit case
      const userIdx = messages.findIndex(m => m.id === userMsgId);
      const historyMsgs = userIdx >= 0
        ? messages.slice(0, userIdx + 1).filter(m => m.role !== 'system')
        : messages.filter(m => m.role !== 'system');

      const stream = chatStream(provider.adapterType, {
        apiKey: key.trim(),
        baseUrl: provider.baseUrl,
        model,
        messages: historyMsgs,
        systemPrompt: params.systemPrompt,
        params,
        signal: controller.signal,
      });

      let fullContent = '';
      let finalUsage: IMessage['usage'];

      for await (const chunk of stream) {
        if (chunk.error) {
          throw new Error(chunk.error.message);
        }
        if (chunk.usage) finalUsage = chunk.usage;
        if (chunk.content) {
          fullContent += chunk.content;
          // Update assistant message content incrementally
          setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMsgId ? { ...m, content: fullContent } : m,
              ),
              updatedAt: Date.now(),
            };
          }));
        }
        if (chunk.done) break;
      }

      const duration = Date.now() - startTime;

      // Finalize
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        const messages = c.messages.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: fullContent || '(空响应)',
                usage: finalUsage,
                duration,
              }
            : m,
        );
        // Auto-title from first user message if title is default
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = c.title === '新对话' && firstUserMsg
          ? extractTitle(firstUserMsg.content, 20)
          : c.title;
        return { ...c, messages, title, updatedAt: Date.now() };
      }));
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const duration = Date.now() - startTime;
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: isAbort ? m.content || '(已停止)' : m.content,
                  error: isAbort ? undefined : {
                    code: 'API_ERROR',
                    message: err instanceof Error ? err.message : String(err),
                  },
                  duration,
                }
              : m,
          ),
          updatedAt: Date.now(),
        };
      }));
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [customProviders, apiKeys]);

  // --- Send message ---
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const now = Date.now();
    const userMsgId = generateId('msg');
    const assistantMsgId = generateId('msg');
    const userMsg: IMessage = {
      id: userMsgId,
      role: 'user',
      content: content.trim(),
      timestamp: now,
    };
    const assistantMsg: IMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: now,
    };

    let convId = currentConversationId;
    let providerId = settings.defaultProviderId;
    let model = settings.defaultModel;
    let params = { ...DEFAULT_PARAMS };
    let existingMessages: IMessage[] = [];

    if (convId) {
      const existing = conversationsRef.current.find(c => c.id === convId);
      if (existing) {
        providerId = existing.providerId;
        model = existing.model;
        params = existing.params;
        existingMessages = existing.messages;
      }
    } else {
      // Create new conversation inline
      convId = generateId('conv');
      const newConv: IConversation = {
        id: convId,
        title: '新对话',
        providerId,
        model,
        messages: [],
        params: { ...DEFAULT_PARAMS },
        createdAt: now,
        updatedAt: now,
      };
      // Add to state and ref
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationIdState(convId);
    }

    const allMessages = [...existingMessages, userMsg, assistantMsg];

    // Add user + assistant messages to state
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return {
        ...c,
        messages: allMessages,
        updatedAt: now,
      };
    }));

    await runStream(convId, userMsgId, assistantMsgId, providerId, model, params, allMessages);
  }, [currentConversationId, settings.defaultProviderId, settings.defaultModel, runStream]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const regenerateLast = useCallback(async () => {
    const conv = currentConversation;
    if (!conv) return;

    // Find last assistant message, then the user message before it
    let assistantIdx = -1;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'assistant') {
        assistantIdx = i;
        break;
      }
    }
    if (assistantIdx < 0) return;

    // Find the user message before it (or the last user message)
    let userMsgId = '';
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        userMsgId = conv.messages[i].id;
        break;
      }
    }
    if (!userMsgId) return;

    const newAssistantId = generateId('msg');
    const now = Date.now();

    // Compute new messages array for the stream
    const newMessages = [...conv.messages];
    newMessages[assistantIdx] = {
      id: newAssistantId,
      role: 'assistant',
      content: '',
      timestamp: now,
    };

    // Replace the last assistant message with a new empty one
    setConversations(prev => prev.map(c => {
      if (c.id !== conv.id) return c;
      return { ...c, messages: newMessages, updatedAt: now };
    }));

    await runStream(conv.id, userMsgId, newAssistantId, conv.providerId, conv.model, conv.params, newMessages);
  }, [currentConversation, runStream]);

  const editAndResend = useCallback(async (messageId: string, newContent: string) => {
    const conv = currentConversation;
    if (!conv) return;

    const msgIdx = conv.messages.findIndex(m => m.id === messageId);
    if (msgIdx < 0 || conv.messages[msgIdx].role !== 'user') return;

    const newAssistantId = generateId('msg');
    const now = Date.now();

    // Build new messages array for the stream
    const newMessages = [...conv.messages.slice(0, msgIdx + 1)];
    newMessages[msgIdx] = { ...newMessages[msgIdx], content: newContent, timestamp: now };
    const assistantMsg: IMessage = {
      id: newAssistantId,
      role: 'assistant',
      content: '',
      timestamp: now,
    };
    const allMessages = [...newMessages, assistantMsg];

    // Truncate messages after this user message, update content, add new assistant
    setConversations(prev => prev.map(c => {
      if (c.id !== conv.id) return c;
      return {
        ...c,
        messages: allMessages,
        updatedAt: now,
      };
    }));

    await runStream(conv.id, messageId, newAssistantId, conv.providerId, conv.model, conv.params, allMessages);
  }, [currentConversation, runStream]);

  // --- Data operations ---
  const exportAllData = useCallback((): string => {
    const data = {
      conversations,
      settings,
      customProviders,
      apiKeys,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    return JSON.stringify(data, null, 2);
  }, [conversations, settings, customProviders, apiKeys]);

  const importAllData = useCallback((json: string, mode: 'merge' | 'replace') => {
    const data = JSON.parse(json);
    if (mode === 'replace') {
      if (Array.isArray(data.conversations)) setConversations(data.conversations);
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (Array.isArray(data.customProviders)) setCustomProviders(data.customProviders);
      if (data.apiKeys && typeof data.apiKeys === 'object') setApiKeys(data.apiKeys);
    } else {
      // merge: append conversations (by id dedup), merge custom providers, keep own settings
      if (Array.isArray(data.conversations)) {
        setConversations(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          for (const c of data.conversations) {
            if (!map.has(c.id)) map.set(c.id, c);
          }
          return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        });
      }
      if (data.apiKeys && typeof data.apiKeys === 'object') {
        setApiKeys(prev => ({ ...prev, ...data.apiKeys }));
      }
      if (Array.isArray(data.customProviders)) {
        setCustomProviders(prev => {
          const ids = new Set(prev.map(p => p.id));
          const additions = data.customProviders.filter((p: ICustomProvider) => !ids.has(p.id));
          return [...prev, ...additions];
        });
      }
    }
  }, []);

  const clearAllData = useCallback(() => {
    setConversations([]);
    setCurrentConversationIdState(null);
    setSettings(DEFAULT_SETTINGS);
    setApiKeys({});
    setCustomProviders([]);
  }, []);

  const value: AppContextValue = {
    conversations,
    currentConversationId,
    currentConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversationId,
    updateConversationParams,
    resetParams,
    setProviderAndModel,
    sendMessage,
    stopGeneration,
    isGenerating,
    regenerateLast,
    editAndResend,
    settings,
    updateSettings,
    apiKeys,
    setApiKey,
    customProviders,
    addCustomProvider,
    removeCustomProvider,
    theme: settings.theme,
    toggleTheme,
    exportAllData,
    importAllData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Helper re-export
export { BUILTIN_PROVIDERS, findProvider, customToProviderConfig };
