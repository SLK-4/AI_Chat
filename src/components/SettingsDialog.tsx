import { useState, useRef, type ChangeEvent } from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BUILTIN_PROVIDERS } from '@/providers/config';
import { downloadFile, readFileAsText } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    apiKeys,
    setApiKey,
    customProviders,
    addCustomProvider,
    removeCustomProvider,
    settings,
    updateSettings,
    exportAllData,
    importAllData,
    clearAllData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleExport = () => {
    const data = exportAllData();
    const filename = `ai-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(filename, data, 'application/json');
    toast.success('数据已导出');
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      importAllData(text, importMode);
      toast.success(`导入成功 (${importMode === 'replace' ? '覆盖模式' : '合并模式'})`);
    } catch (err) {
      toast.error(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = '';
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success('所有数据已清除');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理 API Key、服务商和数据。所有数据仅保存在本地浏览器中。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api-keys" className="flex-1 overflow-hidden">
          <div className="px-6 border-b border-border/40">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-0 border-b-0">
              <TabsTrigger
                value="api-keys"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
              >
                API Key 管理
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
              >
                自定义服务商
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
              >
                通用设置
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
              >
                数据管理
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5"
              >
                关于
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh]">
            <TabsContent value="api-keys" className="p-6 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                输入您的 API Key，所有密钥仅保存在浏览器 localStorage 中，不会上传到任何服务器。
              </p>
              {BUILTIN_PROVIDERS.map(provider => (
                <ApiKeyRow
                  key={provider.id}
                  providerId={provider.id}
                  providerName={provider.name}
                  placeholder={provider.apiKeyPlaceholder || 'sk-...'}
                  value={apiKeys[provider.id] || ''}
                  onChange={v => setApiKey(provider.id, v)}
                />
              ))}
              {customProviders.length > 0 && (
                <>
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-sm font-medium mb-3">自定义服务商</p>
                  </div>
                  {customProviders.map(cp => (
                    <ApiKeyRow
                      key={cp.id}
                      providerId={cp.id}
                      providerName={cp.name}
                      placeholder="API Key"
                      value={apiKeys[cp.id] || ''}
                      onChange={v => setApiKey(cp.id, v)}
                    />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="custom" className="p-6 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                添加自定义 OpenAI 兼容接口，如 Ollama、vLLM、OneAPI 等中转服务。
              </p>
              <CustomProviderForm
                onAdd={(name, baseUrl, models) => {
                  addCustomProvider({ name, baseUrl, models });
                  toast.success('已添加自定义服务商');
                }}
              />
              <div className="space-y-2">
                {customProviders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    暂无自定义服务商
                  </div>
                ) : (
                  customProviders.map(cp => (
                    <Card key={cp.id} className="bg-card/50">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cp.name}</p>
                            <Badge variant="outline" className="text-xs">自定义</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{cp.baseUrl}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            模型: {cp.models.join(', ')}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>删除自定义服务商</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除「{cp.name}」吗？对应的 API Key 也会被清除。
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => removeCustomProvider(cp.id)}
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="general" className="p-6 pt-4 space-y-6">
              <div className="space-y-2">
                <Label>默认服务商</Label>
                <Select
                  value={settings.defaultProviderId}
                  onValueChange={v => updateSettings({ defaultProviderId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...BUILTIN_PROVIDERS, ...customProviders.map(cp => ({
                      id: cp.id,
                      name: cp.name,
                      baseUrl: cp.baseUrl,
                      models: cp.models,
                      adapterType: 'openai' as const,
                      isBuiltin: false,
                    }))].map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>默认模型</Label>
                <Input
                  value={settings.defaultModel}
                  onChange={e => updateSettings({ defaultModel: e.target.value })}
                  placeholder="gpt-4o-mini"
                />
                <p className="text-xs text-muted-foreground">
                  新建对话时自动使用此模型
                </p>
              </div>
            </TabsContent>

            <TabsContent value="data" className="p-6 pt-4 space-y-6">
              <Card className="bg-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">导出所有数据</CardTitle>
                  <CardDescription>
                    将所有对话、设置、API Key 导出为 JSON 文件
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="size-4" />
                    导出 JSON
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">导入数据</CardTitle>
                  <CardDescription>
                    从 JSON 文件导入对话和设置
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={importMode === 'merge' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImportMode('merge')}
                      className="flex-1"
                    >
                      合并模式
                    </Button>
                    <Button
                      variant={importMode === 'replace' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImportMode('replace')}
                      className="flex-1"
                    >
                      覆盖模式
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {importMode === 'merge'
                      ? '合并模式：保留现有数据，追加导入的对话（按 ID 去重）'
                      : '覆盖模式：清除所有现有数据，替换为导入的数据'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                    <Upload className="size-4" />
                    选择文件导入
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    清除所有数据
                  </CardTitle>
                  <CardDescription>
                    永久删除所有对话、设置和 API Key，此操作不可撤销
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="size-4" />
                        清除所有数据
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle className="text-destructive">
                        确认清除所有数据？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将永久删除所有对话记录、API Key 和设置，且无法恢复。
                        建议先导出数据备份。
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={handleClearAll}
                        >
                          确认清除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="p-6 pt-4">
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-base">AI Chat Tool</CardTitle>
                  <CardDescription>
                    多服务商大语言模型 API 调用工具
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    一个纯前端实现的 AI 对话工具，支持同时调用多家大语言模型 API。
                  </p>
                  <p>
                    所有数据（API Key、对话历史、设置）均存储在浏览器 localStorage 中，
                    不会上传到任何服务器。
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Info className="size-4" />
                    直接从浏览器调用第三方 API 可能受到 CORS 限制，
                    建议使用支持浏览器直连的服务商或使用本地中转服务。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border/40">
          <Button onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyRow({
  providerId,
  providerName,
  placeholder,
  value,
  onChange,
}: {
  providerId: string;
  providerName: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{providerName}</Label>
        {value && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">已配置</Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setVisible(v => !v)}
                type="button"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {visible ? '隐藏密钥' : '显示密钥'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function CustomProviderForm({ onAdd }: { onAdd: (name: string, baseUrl: string, models: string[]) => void }) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelsStr, setModelsStr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUrl.trim()) {
      toast.error('请填写服务商名称和 Base URL');
      return;
    }
    const models = modelsStr
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);
    if (models.length === 0) {
      models.push('gpt-3.5-turbo');
    }
    onAdd(name.trim(), baseUrl.trim().replace(/\/$/, ''), models);
    setName('');
    setBaseUrl('');
    setModelsStr('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-border/40 rounded-lg bg-card/30">
      <div className="text-sm font-medium">添加自定义服务商</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">服务商名称</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My API"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Base URL</Label>
          <Input
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">模型列表（逗号分隔）</Label>
        <Input
          value={modelsStr}
          onChange={e => setModelsStr(e.target.value)}
          placeholder="gpt-3.5-turbo, gpt-4o"
          className="h-9 font-mono text-xs"
        />
      </div>
      <Button type="submit" size="sm" className="gap-1.5">
        <Plus className="size-3.5" />
        添加服务商
      </Button>
    </form>
  );
}
