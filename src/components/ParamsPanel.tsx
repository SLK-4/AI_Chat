import {
  RotateCcw,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ParamsPanelProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function ParamsPanel({ open, onClose, isMobile }: ParamsPanelProps) {
  const {
    currentConversation,
    updateConversationParams,
    resetParams,
    isGenerating,
  } = useApp();

  const params = currentConversation?.params;
  const disabled = !currentConversation || isGenerating;

  const update = (patch: Record<string, unknown>) => {
    if (!currentConversation) return;
    updateConversationParams(currentConversation.id, patch);
  };

  const handleReset = () => {
    if (!currentConversation) return;
    resetParams(currentConversation.id);
  };

  const panelContent = (
    <div className="flex h-full flex-col bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <h3 className="text-sm font-semibold">参数设置</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={disabled}
            title="重置为默认值"
          >
            <RotateCcw className="size-4" />
          </Button>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">System Prompt</Label>
            <Textarea
              value={params?.systemPrompt ?? ''}
              onChange={e => update({ systemPrompt: e.target.value })}
              placeholder="你是一个有用的AI助手..."
              className="min-h-[100px] resize-y text-sm"
              disabled={disabled}
            />
          </div>

          {/* Temperature */}
          <SliderField
            label="Temperature"
            description="控制输出随机性 (0-2)"
            value={params?.temperature ?? 0.7}
            min={0}
            max={2}
            step={0.1}
            disabled={disabled}
            onChange={v => update({ temperature: v })}
          />

          {/* Top P */}
          <SliderField
            label="Top P"
            description="核采样概率 (0-1)"
            value={params?.topP ?? 1}
            min={0}
            max={1}
            step={0.05}
            disabled={disabled}
            onChange={v => update({ topP: v })}
          />

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Max Tokens</Label>
            <Input
              type="number"
              value={params?.maxTokens ?? ''}
              onChange={e => {
                const val = e.target.value;
                update({ maxTokens: val === '' ? undefined : Number(val) });
              }}
              placeholder="不限制"
              className="h-9 text-sm"
              disabled={disabled}
              min={1}
            />
            <p className="text-[11px] text-muted-foreground">
              单次回复的最大 token 数
            </p>
          </div>

          {/* Top K */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Top K</Label>
            <Input
              type="number"
              value={params?.topK ?? ''}
              onChange={e => {
                const val = e.target.value;
                update({ topK: val === '' ? undefined : Number(val) });
              }}
              placeholder="默认"
              className="h-9 text-sm"
              disabled={disabled}
              min={0}
            />
            <p className="text-[11px] text-muted-foreground">
              仅部分模型支持（如 Gemini），留空使用默认值
            </p>
          </div>

          {/* Frequency Penalty */}
          <SliderField
            label="Frequency Penalty"
            description="频率惩罚 (-2 到 2)"
            value={params?.frequencyPenalty ?? 0}
            min={-2}
            max={2}
            step={0.1}
            disabled={disabled}
            onChange={v => update({ frequencyPenalty: v })}
          />

          {/* Presence Penalty */}
          <SliderField
            label="Presence Penalty"
            description="存在惩罚 (-2 到 2)"
            value={params?.presencePenalty ?? 0}
            min={-2}
            max={2}
            step={0.1}
            disabled={disabled}
            onChange={v => update({ presencePenalty: v })}
          />

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={handleReset}
              disabled={disabled}
            >
              <RotateCcw className="size-3.5" />
              重置为默认值
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-72 border-l border-border/40 bg-card transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {panelContent}
        {open && (
          <div
            className="fixed inset-y-0 left-0 w-[calc(100vw-18rem)] bg-black/40 md:hidden"
            onClick={onClose}
          />
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'h-full border-l border-border/40 bg-card/30 transition-all duration-200',
        open ? 'w-72' : 'w-0 overflow-hidden border-l-0',
      )}
    >
      {panelContent}
    </aside>
  );
}

interface SliderFieldProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={v => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}
