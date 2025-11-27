import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';
import { useUnreadNotificationCount, useEmployeeNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Loader2, Bell, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { InventoryTaskDialog } from '@/pages/employee/components/InventoryTaskDialog';
import { TransferRequestDialog } from '@/pages/employee/components/TransferRequestDialog';
import { TransferRequest, Notification } from '@/types/index';
import { usePendingTransfers } from '@/hooks/useTransfers';

const EmployeeHeader: React.FC = () => {
  const { employee, employeeLogout } = useEmployeeAuth();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notificationsData, isLoading, error, refetch: refetchNotifications } = useEmployeeNotifications({ page: 1, limit: 10 });
  const { data: pendingTransfers } = usePendingTransfers();

  const [isInventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isTransferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    if (isMenuOpen) {
      refetchNotifications();
    }
  }, [isMenuOpen, refetchNotifications]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const trimmed = name.trim();
    // 中文名取前两字，英文取首字母
    if (/[\u4e00-\u9fa5]/.test(trimmed)) {
      return trimmed.slice(0, 2);
    }
    return trimmed.slice(0, 2).toUpperCase();
  };

  const handleNotificationClick = (notification: Notification) => {
    if ((notification.type === 'inventory_task' || notification.type === 'inventory_task_assigned') && notification.relatedId) {
      setSelectedTaskId(notification.relatedId);
      setInventoryDialogOpen(true);
    } else if (notification.type === 'transfer_request' && notification.relatedId) {
      const transfer = pendingTransfers?.find(t => t.id === notification.relatedId);
      if (transfer) {
        setSelectedTransfer(transfer);
        setTransferDialogOpen(true);
      } else {
        alert("找不到对应的转移请求，可能已被处理。");
      }
    } else {
      alert(`Notification clicked: ${notification.title}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
             <img 
                src="https://kael.knowbox.cn/html/static/media/xiaohe-logo.c6f6c06b.png" 
                alt="logo"
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold">手机号码资产平台</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="#" alt={employee?.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(employee?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  {unreadData && typeof unreadData.count === 'number' && unreadData.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 px-1.5 min-w-[20px] justify-center p-0 text-[11px] leading-none bg-red-500 text-white">
                      {unreadData.count > 99 ? '99+' : unreadData.count}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium leading-none">通知中心</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                  {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">加载中...</div>}
                  {error && <div className="p-4 text-center text-sm text-destructive">{error.message}</div>}
                  {notificationsData && notificationsData.items.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">没有新通知</div>}
                  {notificationsData?.items.map(notification => (
                    <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification)} className={cn(!notification.read && "bg-blue-50/50")}>
                      <div className="flex items-start space-x-3 py-2">
                        <Bell className="h-4 w-4 mt-1 text-muted-foreground"/>
                        <div className="flex flex-col">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.content}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onSelect={employeeLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <InventoryTaskDialog 
        open={isInventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
        taskId={selectedTaskId}
      />
      <TransferRequestDialog
        open={isTransferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        transferRequest={selectedTransfer}
      />
    </>
  );
};


const EmployeeLayout: React.FC = () => {
  const { isEmployeeAuthenticated, isEmployeeLoading } = useEmployeeAuth();

  if (isEmployeeLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isEmployeeAuthenticated) {
    return <Navigate to="/employee-login" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <EmployeeHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;
