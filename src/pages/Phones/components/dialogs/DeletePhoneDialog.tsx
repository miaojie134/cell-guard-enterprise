import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeletePhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSubmit: (phoneNumber: string) => void;
  isDeleting: boolean;
  hasUsageHistory?: boolean;
}

export const DeletePhoneDialog: React.FC<DeletePhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneNumber,
  onSubmit,
  isDeleting,
  hasUsageHistory = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      setHasConfirmed(false);
      onOpenChange(false);
    }
  };

  // 处理对话框状态变化
  const handleOpenChange = (newOpen: boolean) => {
    // 如果正在删除中，不允许关闭对话框
    if (!newOpen && isDeleting) {
      return;
    }
    if (!newOpen) {
      handleClose();
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText === phoneNumber && hasConfirmed) {
      onSubmit(phoneNumber);
      handleClose();
    }
  };

  const isValid = confirmText === phoneNumber && hasConfirmed;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            删除手机号码
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {hasUsageHistory ? (
              "该手机号码存在使用历史记录，为保留历史记录，不允许删除。"
            ) : (
              "此操作将永久删除手机号码记录，且无法恢复。请谨慎操作。"
            )}
          </DialogDescription>
        </DialogHeader>
        
        {hasUsageHistory ? (
          // 有使用历史时显示说明信息
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-800">
                    无法删除该手机号码
                  </p>
                  <p className="text-sm text-orange-700">
                    手机号码 <span className="font-mono font-semibold">{phoneNumber}</span> 存在使用历史记录。
                    系统不允许删除有使用历史的号码。
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    如果确实需要停用该号码，建议将状态更改为"已注销"而不是删除记录。
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                我知道了
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // 没有使用历史时显示删除确认表单
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="space-y-2">
                <Label htmlFor="confirm-number" className="text-sm font-medium">
                  要删除的手机号码：<span className="font-mono text-red-600">{phoneNumber}</span>
                </Label>
                <Label htmlFor="confirm-number" className="text-sm text-gray-600">
                  请输入上述手机号码以确认删除：
                </Label>
                <Input
                  id="confirm-number"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="请输入手机号码"
                  className="font-mono"
                  disabled={isDeleting}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirm-checkbox"
                  checked={hasConfirmed}
                  onChange={(e) => setHasConfirmed(e.target.checked)}
                  disabled={isDeleting}
                  className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <Label 
                  htmlFor="confirm-checkbox" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  我确认要删除此手机号码，并了解此操作不可撤销
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!isValid || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    删除中...
                  </>
                ) : (
                  "确认删除"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}; 