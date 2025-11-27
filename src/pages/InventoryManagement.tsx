import React, { useState } from 'react';
import { useInventoryTasks } from '@/hooks/useInventoryTasks';
import { InventoryTask, InventoryTaskSearchParams } from '@/types/index';
import { formatDateFromISO } from '@/lib/utils';
import { CreateInventoryTaskDialog } from '@/components/CreateInventoryTaskDialog';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_MAP: { [key: string]: { text: string; className: string } } = {
  pending: { text: '待开始', className: 'bg-gray-500' },
  in_progress: { text: '进行中', className: 'bg-blue-500' },
  completed: { text: '已完成', className: 'bg-green-500' },
  closed: { text: '已关闭', className: 'bg-red-500' },
};

const InventoryManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useState<InventoryTaskSearchParams>({
    page: 1,
    limit: 10,
  });
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useInventoryTasks(searchParams);

  const handlePreviousPage = () => {
    if (searchParams.page && searchParams.page > 1) {
      setSearchParams((prev) => ({ ...prev, page: prev.page! - 1 }));
    }
  };

  const handleNextPage = () => {
    if (data && searchParams.page && searchParams.page < data.pagination.total) {
       setSearchParams((prev) => ({ ...prev, page: prev.page! + 1 }));
    }
  };

  const renderContent = () => {
   if (isLoading) {
      return (
        <TableBody>
          {[...Array(searchParams.limit)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={6}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6}>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (!data || !data.items || data.items.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              没有找到任何盘点任务。
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {data.items.map((task: InventoryTask) => (
          <TableRow key={task.id}>
            <TableCell>{task.name}</TableCell>
            <TableCell>
              <Badge className={STATUS_MAP[task.status]?.className || 'bg-gray-400'}>
                {STATUS_MAP[task.status]?.text || task.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>总数: {task.summary?.total ?? task.totalItems ?? 0}</span>
                <span className="text-green-600">已确认: {task.summary?.confirmed ?? task.confirmedItems ?? 0}</span>
                <span className="text-red-600">不可用: {task.summary?.unavailable ?? task.unavailableItems ?? 0}</span>
                <span className="text-gray-500">待处理: {task.summary?.pending ?? ((task.totalItems ?? 0) - (task.confirmedItems ?? 0) - (task.unavailableItems ?? 0))}</span>
              </div>
            </TableCell>
            <TableCell>{formatDateFromISO(task.dueAt)}</TableCell>
            <TableCell>{formatDateFromISO(task.createdAt)}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/inventory/${task.id}`)}
              >
                查看详情
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <MainLayout title="盘点管理">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold"></h1>
          <Button onClick={() => setCreateDialogOpen(true)}>新增盘点任务</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>进度概览</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>创建日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            {renderContent()}
          </Table>
        </div>
        
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePreviousPage();
                  }}
                  className={searchParams.page === 1 ? 'pointer-events-none text-gray-400' : ''}
                />
              </PaginationItem>
              <PaginationItem className="font-medium">
                第 {searchParams.page} / {data?.pagination.total || 1} 页
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNextPage();
                  }}
                  className={searchParams.page === data?.pagination.total ? 'pointer-events-none text-gray-400' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <CreateInventoryTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTaskCreated={() => refetch()}
        />
      </div>
    </MainLayout>
  );
};

export default InventoryManagement;
