import {
  Sparkles,
  Settings,
  KeyRound,
  MessageSquarePlus,
  Zap,
  Shield,
  Bot,
  Code2,
  Lightbulb,
  PenTool,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { BUILTIN_PROVIDERS } from '@/providers/config';
import { cn } from '@/lib/utils';

interface WelcomePanelProps {
  onOpenSettings: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: Code2,
    title: '帮我写一段代码',
    prompt: '用 Python 写一个快速排序算法，并解释其时间复杂度',
  },
  {
    icon: Lightbulb,
    title: '解释一个概念',
    prompt: '用通俗易懂的方式解释什么是 Transformer 模型',
  },
  {
    icon: PenTool,
    title: '润色文案',
    prompt: '帮我把下面这段话润色得更专业、更简洁：',
  },
  {
    icon: Bot,
    title: '头脑风暴',
    prompt: '给我 5 个关于 AI 工具产品的创业点子',
  },
];

export default function WelcomePanel({ onOpenSettings }: WelcomePanelProps) {
  const { apiKeys, createConversation, sendMessage, settings } = useApp();

  // Check if any API key is configured
  const hasAnyKey = BUILTIN_PROVIDERS.some(p => (apiKeys[p.id] || '').trim().length > 0);

  const handleQuickPrompt = async (prompt: string) => {
    if (!hasAnyKey) {
      onOpenSettings();
      return;
    }
    createConversation();
    // Small delay to ensure state update
    setTimeout(() => sendMessage(prompt), 50);
  };

  return (
    <div className="flex min-h-full items-start justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 text-center">
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <Sparkles className="size-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            AI 对话工具
          </h1>
          <p className="text-muted-foreground text-base">
            支持多家大语言模型 · 数据本地存储 · 纯前端实现
          </p>
        </div>

        {/* First-time setup card */}
        {!hasAnyKey && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <KeyRound className="size-5" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold">开始使用前，请先配置 API Key</h3>
                <p className="text-sm text-muted-foreground">
                  您需要至少配置一个 AI 服务商的 API Key 才能开始对话。
                  所有密钥仅保存在您的浏览器本地，不会上传到任何服务器。
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={onOpenSettings} className="gap-2">
                    <Settings className="size-4" />
                    前往设置
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick prompts */}
        {hasAnyKey && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">试试这些快速开始：</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(item.prompt)}
                    className={cn(
                      'group flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-4',
                      'text-left transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-md',
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                      <Icon className="size-4.5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <FeatureCard
            icon={Zap}
            title="多模型支持"
            description="8+ 内置服务商，兼容 OpenAI 格式"
          />
          <FeatureCard
            icon={Shield}
            title="数据安全"
            description="本地存储，数据不出浏览器"
          />
          <FeatureCard
            icon={MessageSquarePlus}
            title="多会话管理"
            description="独立参数，灵活组织对话"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/20 p-4 text-left">
      <Icon className="size-5 text-primary mb-2" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}
