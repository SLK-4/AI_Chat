import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  Send,
  Square,
  CornerDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  placeholder = '输入消息，按 Ctrl+Enter 发送...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isGenerating) return;
    onSend(value.trim());
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
    // Enter alone inserts newline (default behavior)
  };

  const handleStop = () => {
    onStop();
  };

  return (
    <div className="border-t border-border/40 bg-background/60 p-3 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border/60 bg-card/40 p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isGenerating}
            rows={1}
            className={cn(
              'min-h-[36px] resize-none border-0 bg-transparent p-2 text-[15px] leading-relaxed',
              'focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none',
              'placeholder:text-muted-foreground/60',
            )}
            style={{ maxHeight: '200px' }}
          />

          <div className="flex shrink-0 items-center gap-1 pb-1 pr-1">
            {isGenerating ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={handleStop}
                    >
                      <Square className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    停止生成
                    <Kbd className="ml-1">Ctrl+S</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={handleSend}
                      disabled={disabled || !value.trim()}
                    >
                      <Send className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    发送
                    <Kbd className="ml-1">Ctrl+Enter</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> 发送
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> 换行
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Kbd>Ctrl</Kbd> + <Kbd>N</Kbd> 新对话
          </span>
        </div>
      </div>
    </div>
  );
}
