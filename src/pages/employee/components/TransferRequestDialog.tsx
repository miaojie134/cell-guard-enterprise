import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useTransferActions } from '@/hooks/useTransfers';
import { TransferRequest } from '@/types/index';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TransferRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferRequest: TransferRequest | null;
}

export const TransferRequestDialog: React.FC<TransferRequestDialogProps> = ({
  open,
  onOpenChange,
  transferRequest,
}) => {
  const { acceptTransfer, isAccepting, rejectTransfer, isRejecting } = useTransferActions();

  if (!transferRequest) return null;

  const handleAccept = () => {
    acceptTransfer(transferRequest.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleReject = () => {
    rejectTransfer(transferRequest.id, {
      onSuccess: () => onOpenChange(false),
    });
  };
  
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>手机号转移请求</DialogTitle>
          <DialogDescription>
            您收到一个来自 {transferRequest.fromEmployee.name} 的手机号转移请求。
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
            <div className="flex items-center justify-center space-x-4">
                <div className="flex flex-col items-center gap-1 text-center">
                    <Avatar>
                        <AvatarFallback>{getInitials(transferRequest.fromEmployee.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{transferRequest.fromEmployee.name}</span>
                    <span className="text-xs text-muted-foreground">转出方</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col items-center gap-1 text-center">
                    <Avatar className="ring-2 ring-primary">
                        <AvatarFallback>{getInitials(transferRequest.toEmployee.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{transferRequest.toEmployee.name}</span>
                    <span className="text-xs text-muted-foreground">(您)</span>
                </div>
            </div>
            <div className="p-4 bg-muted/50 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">转移号码</p>
                <p className="text-lg font-semibold">{transferRequest.phoneNumber}</p>
            </div>
            {transferRequest.remark && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">备注:</span> {transferRequest.remark}
                    </p>
                </div>
            )}
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={handleReject} disabled={isAccepting || isRejecting}>
            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            拒绝
          </Button>
          <Button onClick={handleAccept} disabled={isAccepting || isRejecting}>
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            接受
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
