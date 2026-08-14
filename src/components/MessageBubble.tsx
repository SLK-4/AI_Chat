import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Copy,
  RefreshCw,
  Edit3,
  Check,
  X,
  AlertCircle,
  User,
  Sparkles,
  Clock,
} from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import { logger } from '@lark-apaas/client-toolkit-lite';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import cpp from 'highlight.js/lib/languages/cpp';
import 'highlight.js/styles/github-dark.css';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDuration, formatNumber } from '@/lib/storage';
import type { IMessage } from '@/types';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('html', html);
hljs.registerLanguage('xml', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('c', cpp);

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface MessageBubbleProps {
  message: IMessage;
  isStreaming: boolean;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  onEditResend?: (newContent: string) => void;
  canEdit?: boolean;
}

export default function MessageBubble({
  message,
  isStreaming,
  isLastAssistant,
  onRegenerate,
  onEditResend,
  canEdit,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  useEffect(() => {
    setEditValue(message.content);
  }, [message.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleEditSubmit = () => {
    if (onEditResend && editValue.trim()) {
      onEditResend(editValue.trim());
      setEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditValue(message.content);
    setEditing(false);
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const renderedHtml = useMemo(() => {
    if (isUser || !message.content) return null;
    try {
      return marked.parse(message.content) as string;
    } catch (err) {
      logger.error('Markdown parse error:', String(err));
      return message.content;
    }
  }, [message.content, isUser]);

  // Syntax highlight + add copy buttons to code blocks (skip during streaming)
  useEffect(() => {
    if (!contentRef.current || isUser || isStreaming) return;
    const root = contentRef.current;
    const codeBlocks = root.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
      // Syntax highlight if not already highlighted
      if (!block.classList.contains('hljs')) {
        try {
          hljs.highlightElement(block as HTMLElement);
        } catch (err) {
          logger.error('Highlight error:', String(err));
        }
      }
      
      // Add copy button
      const pre = block.parentElement;
      if (!pre || pre.querySelector('.code-copy-btn')) return;
      
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn absolute right-2 top-2 rounded-md bg-foreground/10 px-2 py-1 text-xs text-foreground/70 opacity-0 transition-opacity hover:bg-foreground/20 hover:text-foreground';
      btn.textContent = '复制';
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        const code = block.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = '已复制';
          toast.success('代码已复制');
          setTimeout(() => { btn.textContent = '复制'; }, 1500);
        } catch {
          toast.error('复制失败');
        }
      });
      
      pre.style.position = 'relative';
      pre.appendChild(btn);
      
      // Show on hover
      pre.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
      pre.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
    });
  }, [renderedHtml, isUser, isStreaming]);

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'group relative max-w-[85%] space-y-2',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {/* Role label */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            {isUser ? '你' : 'AI 助手'}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-[15px] leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card/60 border border-border/40 rounded-tl-sm',
          )}
        >
          {message.error ? (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">请求失败</p>
                <p className="text-sm opacity-90 mt-1">{message.error.message}</p>
              </div>
            </div>
          ) : editing ? (
            <div className="space-y-2 min-w-[300px]">
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="min-h-[120px] resize-y text-sm bg-background"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleEditCancel}>
                  <X className="size-3.5 mr-1" />
                  取消
                </Button>
                <Button size="sm" onClick={handleEditSubmit}>
                  <Check className="size-3.5 mr-1" />
                  重新发送
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div
              ref={contentRef}
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: renderedHtml || '' }}
            />
          )}
        </div>

        {/* Actions & meta */}
        {!isUser && !message.error && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground">
            {message.usage && (
              <span className="flex items-center gap-1 tabular-nums">
                {formatNumber(message.usage.total_tokens)} tokens
                <span className="opacity-50">
                  (p:{formatNumber(message.usage.prompt_tokens)} / c:{formatNumber(message.usage.completion_tokens)})
                </span>
              </span>
            )}
            {message.duration != null && (
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-3" />
                {formatDuration(message.duration)}
              </span>
            )}

            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>复制</TooltipContent>
                </Tooltip>

                {isLastAssistant && onRegenerate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onRegenerate}
                        disabled={isStreaming}
                      >
                        <RefreshCw className={cn('size-3.5', isStreaming && 'animate-spin')} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>重新生成</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        )}

        {isUser && canEdit && (
          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>编辑并重发</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && isLastAssistant && (
          <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <span className="flex gap-0.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>正在生成...</span>
          </div>
        )}
      </div>

      {/* User avatar (right side) */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
          <User className="size-4" />
        </div>
      )}
    </div>
  );
}
