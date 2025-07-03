import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PendingUser } from '@/types';

interface PendingPhonesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: PendingUser | null;
}

export const PendingPhonesDialog: React.FC<PendingPhonesDialogProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>待确认号码 - {user.fullName}</DialogTitle>
          <DialogDescription>
            以下是员工 {user.fullName} ({user.email}) 所有待确认的手机号码。
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          <div className="flex flex-wrap gap-2">
            {user.pendingPhones?.map(phone => (
              <Badge key={phone.id} variant="secondary" className="text-base">
                {phone.phoneNumber}
              </Badge>
            ))}
            {(!user.pendingPhones || user.pendingPhones.length === 0) && (
              <p className="text-sm text-gray-500">该用户没有待确认的号码。</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 