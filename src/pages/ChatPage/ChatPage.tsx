import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import ConversationSidebar from '@/components/ConversationSidebar';
import Topbar from '@/components/Topbar';
import ParamsPanel from '@/components/ParamsPanel';
import SettingsDialog from '@/components/SettingsDialog';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import WelcomePanel from '@/components/WelcomePanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const {
    currentConversation,
    sendMessage,
    stopGeneration,
    isGenerating,
    regenerateLast,
    editAndResend,
    settings,
    updateSettings,
    createConversation,
  } = useApp();

  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!settings.sidebarCollapsed);
  const [paramsPanelOpen, setParamsPanelOpen] = useState(!settings.paramsPanelCollapsed);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Persist sidebar/params panel state
  useEffect(() => {
    updateSettings({ sidebarCollapsed: !sidebarOpen });
  }, [sidebarOpen, updateSettings]);

  useEffect(() => {
    updateSettings({ paramsPanelCollapsed: !paramsPanelOpen });
  }, [paramsPanelOpen, updateSettings]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!autoScrollRef.current || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [currentConversation?.messages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    autoScrollRef.current = isAtBottom;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: new conversation
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createConversation();
      }
      // Ctrl/Cmd + S: stop generation
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isGenerating) {
          e.preventDefault();
          stopGeneration();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGenerating, stopGeneration]);

  const messages = currentConversation?.messages ?? [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left Sidebar */}
      <ConversationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          paramsPanelOpen={paramsPanelOpen}
          onToggleParamsPanel={() => setParamsPanelOpen(v => !v)}
          onOpenSettings={() => setSettingsOpen(true)}
          isMobile={isMobile}
        />

        {/* Chat area */}
        <div className="relative flex-1 overflow-hidden">
          {!currentConversation || messages.length === 0 ? (
            <div className="h-full overflow-y-auto pb-4">
              <WelcomePanel onOpenSettings={() => setSettingsOpen(true)} />
            </div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto"
            >
              <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
                {messages.map((msg, idx) => {
                  const isLast = idx === messages.length - 1;
                  const isLastAssistant = msg.role === 'assistant' && isLast;
                  // Determine if user message is editable (has an assistant message after it, or is the last user message before current streaming)
                  const nextMsg = messages[idx + 1];
                  const canEdit = msg.role === 'user' && nextMsg?.role === 'assistant' && !isGenerating;
                  const isStreamingAssistant = isGenerating && isLastAssistant && !msg.error;

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isStreaming={isStreamingAssistant}
                      isLastAssistant={isLastAssistant}
                      onRegenerate={() => regenerateLast()}
                      onEditResend={content => editAndResend(msg.id, content)}
                      canEdit={canEdit}
                    />
                  );
                })}

                {/* Scroll anchor */}
                <div id="chat-bottom" />
              </div>
            </div>
          )}
        </div>

        {/* Chat input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          disabled={!currentConversation}
        />
      </div>

      {/* Right params panel */}
      <ParamsPanel
        open={paramsPanelOpen}
        onClose={() => setParamsPanelOpen(false)}
        isMobile={isMobile}
      />

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
