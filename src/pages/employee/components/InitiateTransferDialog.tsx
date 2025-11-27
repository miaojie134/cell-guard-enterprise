import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useTransferActions } from '@/hooks/useTransfers';
import { PhoneNumber } from '@/types/index';
import { EmployeeSelector, Employee } from '@/components/EmployeeSelector';

interface InitiateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: PhoneNumber | null;
}

export const InitiateTransferDialog: React.FC<InitiateTransferDialogProps> = ({
  open,
  onOpenChange,
  phone,
}) => {
  const [recipient, setRecipient] = useState<Employee | null>(null);
  const [remark, setRemark] = useState('');
  const { initiateTransfer, isInitiating } = useTransferActions();

  if (!phone) return null;

  const handleSubmit = () => {
    if (!recipient) {
      alert('请选择一个接收人。');
      return;
    }
    initiateTransfer({
      phoneNumber: phone.phoneNumber,
      toEmployeeId: recipient.employeeId,
      remark,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发起手机号转移</DialogTitle>
          <DialogDescription>
            您正在转移号码 <span className="font-semibold text-foreground">{phone.phoneNumber}</span>。
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div>
            <label className="text-sm font-medium">选择接收人</label>
            <EmployeeSelector 
              value={recipient}
              onChange={setRecipient}
              placeholder="搜索要转移到的员工..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">备注 (可选)</label>
            <Textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="例如: 岗位调整"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isInitiating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isInitiating || !recipient}>
            {isInitiating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            确认转移
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
