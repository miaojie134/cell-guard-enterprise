import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useInventoryTaskItems, useInventoryTaskActions } from '@/hooks/useInventoryTasks';
import { InventoryTaskItem, InventoryItemStatus } from '@/types/index';

interface InventoryTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
}

type LocalProgress = {
  [itemId: number]: {
    status: InventoryItemStatus;
    purpose?: string;
    comment?: string;
  };
};

// Custom hook for managing local storage state
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
};

export const InventoryTaskDialog: React.FC<InventoryTaskDialogProps> = ({
  open,
  onOpenChange,
  taskId,
}) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useInventoryTaskItems(taskId || '', { page, limit: 5 });
  const { performItemActionAsync, isPerformingAction, submitTask, isSubmitting } = useInventoryTaskActions();

  const storageKey = `inventory_task_${taskId}`;
  const [localProgress, setLocalProgress] = useLocalStorage<LocalProgress>(storageKey, {});
  
  // Form state for reporting unlisted phones
  const [unlistedPhone, setUnlistedPhone] = useState('');
  const [unlistedPurpose, setUnlistedPurpose] = useState('');

  // Reset state when dialog is closed or task ID changes
  useEffect(() => {
    if (!open) {
      setPage(1);
    }
  }, [open]);


  const handleActionClick = async (item: InventoryTaskItem, status: InventoryItemStatus) => {
    const purpose = status === 'confirmed' ? (localProgress[item.itemId]?.purpose || item.purpose || '') : localProgress[item.itemId]?.purpose;
    const comment = status === 'unavailable' ? localProgress[item.itemId]?.comment : undefined;

    if (status === 'confirmed' && !purpose) {
      setLocalProgress(prev => ({ ...prev, [item.itemId]: { ...prev[item.itemId], status } }));
      return; // 需要先填写用途再触发
    }

    setLocalProgress(prev => ({
      ...prev,
      [item.itemId]: { ...prev[item.itemId], status, purpose, comment },
    }));

    if (taskId) {
      await performItemActionAsync({
        taskId,
        itemId: item.itemId,
        payload: {
          action: status === 'confirmed' ? 'confirm' : 'unavailable',
          purpose,
          comment,
        },
      });
    }
  };

  const handleCommentChange = (item: InventoryTaskItem, comment: string) => {
    setLocalProgress(prev => ({
      ...prev,
      [item.itemId]: { ...prev[item.itemId], status: 'unavailable', comment },
    }));
  };

  const handlePurposeChange = (item: InventoryTaskItem, purpose: string) => {
    setLocalProgress(prev => ({
      ...prev,
      [item.itemId]: { ...prev[item.itemId], status: 'confirmed', purpose },
    }));
  };

  const handlePurposeBlur = async (item: InventoryTaskItem) => {
    const progress = localProgress[item.itemId];
    const purpose = progress?.purpose || item.purpose;
    const status = progress?.status || item.status;
    if (taskId && status === 'confirmed' && purpose && purpose !== item.purpose) {
      await performItemActionAsync({
        taskId,
        itemId: item.itemId,
        payload: {
          action: 'confirm',
          purpose,
        },
      });
    }
  };

  const handleCommentBlur = async (item: InventoryTaskItem) => {
    const progress = localProgress[item.itemId];
    const comment = progress?.comment;
    const status = progress?.status || item.status;
    if (taskId && status === 'unavailable' && comment && comment !== item.comment) {
      await performItemActionAsync({
        taskId,
        itemId: item.itemId,
        payload: {
          action: 'unavailable',
          comment,
        },
      });
    }
  };

  const handleSubmit = async () => {
    if (!taskId || !data?.items) return;

    // 确保每条都已处理
    const pendingItem = data.items.find((item) => {
      const progress = localProgress[item.itemId];
      const status = progress?.status || item.status;
      const purpose = progress?.purpose || item.purpose;
      if (status === 'pending') return true;
      if (status === 'confirmed' && !purpose) return true;
      return false;
    });
    if (pendingItem) {
      return;
    }

    try {
      await submitTask(taskId);
      localStorage.removeItem(storageKey);
      onOpenChange(false);
    } catch (e) {
      // handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>盘点任务</DialogTitle>
          <DialogDescription>请确认以下手机号码的状态。</DialogDescription>
        </DialogHeader>

        {isLoading && <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
        {error && <div className="text-center p-8 text-red-500">{error.message}</div>}
        
        <div className="space-y-4">
          {data?.items.map((item) => {
            const currentProgress = localProgress[item.itemId];
            const displayStatus = currentProgress?.status || item.status;
            const displayPurpose = currentProgress?.purpose || item.purpose || '';

            return (
              <div key={item.itemId} className="p-3 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{item.phoneNumber}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={displayStatus === 'confirmed' ? 'default' : 'outline'}
                      onClick={() => handleActionClick(item, 'confirmed')}
                    >
                      确认
                    </Button>
                    <Button 
                      size="sm" 
                      variant={displayStatus === 'unavailable' ? 'destructive' : 'outline'}
                      onClick={() => handleActionClick(item, 'unavailable')}
                    >
                      不可用
                    </Button>
                  </div>
                </div>
                {displayStatus === 'confirmed' && (
                  <Input
                    placeholder="请输入用途（必填）"
                    value={displayPurpose}
                    onChange={(e) => handlePurposeChange(item, e.target.value)}
                    onBlur={() => handlePurposeBlur(item)}
                  />
                )}
                {displayStatus === 'unavailable' && (
                   <Textarea 
                      placeholder="请说明原因 (如: 设备丢失、已销卡等)"
                      value={currentProgress?.comment || ''}
                      onChange={(e) => handleCommentChange(item, e.target.value)}
                      onBlur={() => handleCommentBlur(item)}
                   />
                )}
              </div>
            )
          })}
        </div>
        
        {/* TODO: Add pagination controls */}
        
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-semibold">上报未列出的号码</h3>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="手机号码" value={unlistedPhone} onChange={e => setUnlistedPhone(e.target.value)} />
            <Input placeholder="用途" value={unlistedPurpose} onChange={e => setUnlistedPurpose(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" disabled={!unlistedPhone || !unlistedPurpose}>上报</Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>稍后处理</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isPerformingAction}>
            {(isSubmitting || isPerformingAction) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交盘点结果
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
