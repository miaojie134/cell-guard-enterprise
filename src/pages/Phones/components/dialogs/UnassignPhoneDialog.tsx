import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UnassignPhoneRequest } from "@/config/api/phone";

interface UnassignPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSubmit: (phoneNumber: string, data: UnassignPhoneRequest) => void;
  isUnassigning: boolean;
}

export const UnassignPhoneDialog: React.FC<UnassignPhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneNumber,
  onSubmit,
  isUnassigning,
}) => {
  // 处理回收提交
  const handleUnassignSubmit = () => {
    const unassignRequest: UnassignPhoneRequest = {
      reclaimDate: new Date().toISOString().split('T')[0],
    };
    
    onSubmit(phoneNumber, unassignRequest);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>回收手机号码</DialogTitle>
          <DialogDescription>
            确认要回收手机号码 {phoneNumber} 吗？
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            回收后，该号码将变为闲置状态，当前使用人信息将被清空。此操作不可撤销。
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleUnassignSubmit} 
            disabled={isUnassigning}
            variant="destructive"
          >
            {isUnassigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                回收中...
              </>
            ) : (
              "确认回收"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
