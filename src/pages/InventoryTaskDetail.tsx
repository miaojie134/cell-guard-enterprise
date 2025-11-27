import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItemStatus } from '@/types';
import { formatDateFromISO } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_TEXT: Record<InventoryItemStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  unavailable: '不可用',
};

const InventoryTaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | ''>('');

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventoryTaskDetail', taskId, page, limit, statusFilter],
    queryFn: () => inventoryService.getAdminTaskDetail(taskId || '', { page, limit, status: statusFilter || undefined }),
    enabled: !!taskId,
    keepPreviousData: true,
  });

  const task = (data as any)?.task;
  const items = data?.items || [];
  const pagination = data?.pagination;

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const handleStatusChange = (value: string) => {
    // Radix Select 要求非空值，这里用 'all' 代表全部
    if (value === 'all') {
      setStatusFilter('');
      setSearchParams({ page: '1', limit: String(limit) });
      return;
    }
    setStatusFilter(value as InventoryItemStatus);
    setSearchParams({ page: '1', limit: String(limit) });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage), limit: String(limit) });
  };

  return (
    <MainLayout title="盘点任务详情">
      <div className="container mx-auto p-4 space-y-4">
        {!taskId && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>任务 ID 缺失</AlertTitle>
            <AlertDescription>无法加载盘点任务详情。</AlertDescription>
          </Alert>
        )}

        {task && (
          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="flex flex-wrap gap-4 justify-between">
              <div>
                <h2 className="text-xl font-semibold">{task.name}</h2>
                <p className="text-sm text-muted-foreground">任务 ID: {task.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{task.scopeType === 'department_ids' ? '按部门' : '按员工'}</Badge>
                <Badge>{task.status}</Badge>
                <span className="text-sm text-muted-foreground">截止: {formatDateFromISO(task.dueAt)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">任务项状态</span>
            <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="unavailable">不可用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>号码</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>用途</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>加载失败</AlertTitle>
                      <AlertDescription>{(error as any)?.message || '获取任务详情失败'}</AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    暂无任务项
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && items.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.phoneNumber}</TableCell>
                  <TableCell>{STATUS_TEXT[item.status] || item.status}</TableCell>
                  <TableCell>{item.purpose || '-'}</TableCell>
                  <TableCell>{item.comment || '-'}</TableCell>
                  <TableCell>{formatDateFromISO(item.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(Math.max(1, page - 1));
                  }}
                  className={page <= 1 ? 'pointer-events-none text-gray-400' : ''}
                />
              </PaginationItem>
              <PaginationItem className="font-medium">
                第 {page} / {totalPages} 页
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(Math.min(totalPages, page + 1));
                  }}
                  className={page >= totalPages ? 'pointer-events-none text-gray-400' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </MainLayout>
  );
};

export default InventoryTaskDetail;
