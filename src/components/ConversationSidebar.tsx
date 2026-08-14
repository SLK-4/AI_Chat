import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  MessageSquare,
  X,
  Menu,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/storage';
import type { IConversation } from '@/types';

interface ConversationSidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function ConversationSidebar({ open, onClose, isMobile }: ConversationSidebarProps) {
  const {
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversationId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const handleCreate = () => {
    createConversation();
    if (isMobile) onClose();
  };

  const handleSelect = (id: string) => {
    setCurrentConversationId(id);
    if (isMobile) onClose();
  };

  const startRename = (conv: IConversation) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameConversation(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 p-3">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="size-4" />
          </Button>
        )}
        <Button
          onClick={handleCreate}
          variant="default"
          className="flex-1 h-9 gap-1.5"
        >
          <Plus className="size-4" />
          新建对话
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-3">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? '没有匹配的对话' : '暂无对话，点击上方新建'}
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === currentConversationId}
                isEditing={editingId === conv.id}
                editValue={editValue}
                onSelect={() => handleSelect(conv.id)}
                onStartRename={() => startRename(conv)}
                onEditChange={setEditValue}
                onCommitRename={commitRename}
                onCancelRename={() => setEditingId(null)}
                onDelete={() => handleDelete(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-border/40 bg-card transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
        {open && (
          <div
            className="fixed inset-y-0 right-0 w-[calc(100vw-18rem)] bg-black/40 md:hidden"
            onClick={onClose}
          />
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'h-full border-r border-border/40 bg-card/30 transition-all duration-200',
        open ? 'w-64' : 'w-0 overflow-hidden border-r-0',
      )}
    >
      {sidebarContent}
    </aside>
  );
}

interface ConversationItemProps {
  conv: IConversation;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onSelect: () => void;
  onStartRename: () => void;
  onEditChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function ConversationItem({
  conv,
  isActive,
  isEditing,
  editValue,
  onSelect,
  onStartRename,
  onEditChange,
  onCommitRename,
  onCancelRename,
  onDelete,
}: ConversationItemProps) {
  if (isEditing) {
    return (
      <div className="rounded-md bg-accent/50 p-2">
        <Input
          autoFocus
          value={editValue}
          onChange={e => onEditChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onCommitRename();
            if (e.key === 'Escape') onCancelRename();
          }}
          onBlur={onCommitRename}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/40 text-foreground/80',
      )}
      onClick={onSelect}
    >
      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate min-w-0">{conv.title}</span>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={e => {
                  e.stopPropagation();
                  onStartRename();
                }}
              >
                <Edit3 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">重命名</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={e => e.stopPropagation()}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>删除对话</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{conv.title}」吗？此操作不可撤销。
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
