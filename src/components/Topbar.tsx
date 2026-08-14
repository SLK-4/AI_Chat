import { useState, useMemo } from 'react';
import {
  Settings,
  Sun,
  Moon,
  PanelLeft,
  PanelRight,
  Download,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BUILTIN_PROVIDERS, customToProviderConfig } from '@/providers/config';
import type { IProviderConfig } from '@/types';

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  paramsPanelOpen: boolean;
  onToggleParamsPanel: () => void;
  onOpenSettings: () => void;
  isMobile: boolean;
}

export default function Topbar({
  sidebarOpen,
  onToggleSidebar,
  paramsPanelOpen,
  onToggleParamsPanel,
  onOpenSettings,
  isMobile,
}: TopbarProps) {
  const {
    currentConversation,
    setProviderAndModel,
    theme,
    toggleTheme,
    customProviders,
  } = useApp();

  const allProviders = useMemo<IProviderConfig[]>(() => {
    return [
      ...BUILTIN_PROVIDERS,
      ...customProviders.map(customToProviderConfig),
    ];
  }, [customProviders]);

  const currentProvider = allProviders.find(
    p => p.id === currentConversation?.providerId,
  );

  const handleSelectModel = (providerId: string, model: string) => {
    if (currentConversation) {
      setProviderAndModel(currentConversation.id, providerId, model);
    }
  };

  const handleExportMd = () => {
    // Export current conversation as Markdown
    if (!currentConversation) return;
    const lines: string[] = [];
    lines.push(`# ${currentConversation.title}`);
    lines.push('');
    lines.push(`> 服务商: ${currentProvider?.name ?? currentConversation.providerId} | 模型: ${currentConversation.model}`);
    lines.push('');
    for (const msg of currentConversation.messages) {
      if (msg.role === 'system') continue;
      const roleLabel = msg.role === 'user' ? '用户' : 'AI';
      lines.push(`## ${roleLabel}`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
      if (msg.usage) {
        lines.push(`*Token用量: ${msg.usage.prompt_tokens} prompt + ${msg.usage.completion_tokens} completion = ${msg.usage.total_tokens}*`);
        lines.push('');
      }
    }
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title || 'conversation'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur-md">
      {/* Left: sidebar toggle + provider/model */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="shrink-0"
      >
        <PanelLeft className={cn('size-5', !sidebarOpen && 'opacity-60')} />
      </Button>

      <div className="flex items-center gap-1.5 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 max-w-[200px] truncate"
              disabled={!currentConversation}
            >
              <span className="truncate">
                {currentProvider?.name ?? '选择服务商'}
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>选择服务商</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {allProviders.map(p => (
                <div key={p.id}>
                  <div
                    className={cn(
                      'px-2 py-1.5 text-xs font-medium text-muted-foreground',
                      p.id === currentConversation?.providerId && 'text-primary',
                    )}
                  >
                    {p.name}
                  </div>
                  <DropdownMenuGroup>
                    {p.models.map(m => (
                      <DropdownMenuItem
                        key={m}
                        className="pl-6 text-sm cursor-pointer"
                        onClick={() => handleSelectModel(p.id, m)}
                      >
                        <span className="flex-1 truncate">{m}</span>
                        {currentConversation?.providerId === p.id &&
                          currentConversation?.model === m && (
                            <Check className="size-3.5 text-primary" />
                          )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  {p.id !== allProviders[allProviders.length - 1].id && (
                    <DropdownMenuSeparator />
                  )}
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentConversation && currentProvider && (
          <span className="hidden md:inline-block text-xs text-muted-foreground truncate max-w-[140px]">
            / {currentConversation.model}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Right: export + params + theme + settings */}
      <TooltipProvider delayDuration={300}>
        {currentConversation && currentConversation.messages.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportMd}
              >
                <Download className="size-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出 Markdown</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleParamsPanel}
            >
              <PanelRight className={cn('size-4.5', !paramsPanelOpen && 'opacity-60')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>参数面板</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
            >
              <Settings className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>设置</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
}
