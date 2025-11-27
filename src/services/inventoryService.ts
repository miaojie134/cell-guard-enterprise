import { API_INVENTORY_ENDPOINTS } from '@/config/api';
import {
  InventoryTask,
  InventoryTasksListResponse,
  InventoryTaskSearchParams,
  CreateInventoryTaskPayload,
  InventoryTaskItemsResponse,
  PerformItemActionPayload,
  ReportUnlistedPhonePayload,
  NewAPIResponse,
  InventoryItemStatus,
} from '@/types';
import { apiFetch } from './api';

class InventoryService {
  async getInventoryTasks(params: InventoryTaskSearchParams = {}): Promise<InventoryTasksListResponse> {
    try {
      let url = API_INVENTORY_ENDPOINTS.ADMIN_TASKS;

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.scopeType) queryParams.append('scopeType', params.scopeType);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.createdFrom) queryParams.append('createdFrom', params.createdFrom);
      if (params.createdTo) queryParams.append('createdTo', params.createdTo);

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await apiFetch(url, {
        method: 'GET',
        signal: params.signal,
      });

      const data: NewAPIResponse<InventoryTasksListResponse> | { status?: string; message?: string; data?: InventoryTasksListResponse } = await response.json();
      const isSuccessCode = 'code' in data && (data as NewAPIResponse<InventoryTasksListResponse>).code === 0;
      const isSuccessStatus = 'status' in data && data.status === 'success';
      const payload = (data as any).data;

      if (!response.ok || !(isSuccessCode || isSuccessStatus) || !payload) {
        throw new Error((data as any).message || '获取盘点任务列表失败');
      }

      // 兼容后端未提供 summary 的结构，构造前端所需 summary 字段
      const normalizedItems = payload.items?.map((item) => ({
        ...item,
        summary: item.summary || {
          total: item.totalItems ?? 0,
          confirmed: item.confirmedItems ?? 0,
          unavailable: item.unavailableItems ?? 0,
          pending: (item.totalItems ?? 0) - (item.confirmedItems ?? 0) - (item.unavailableItems ?? 0),
          unlistedReported: item.unlistedReported ?? 0,
        },
      })) || [];

      return {
        ...payload,
        items: normalizedItems,
      };

    } catch (error) {
      console.error('Get inventory tasks error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败或服务器错误');
    }
  }

  async createInventoryTask(payload: CreateInventoryTaskPayload): Promise<InventoryTask> {
    try {
      const response = await apiFetch(API_INVENTORY_ENDPOINTS.ADMIN_TASKS, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data: NewAPIResponse<InventoryTask> | { status?: string; message?: string; data?: InventoryTask } = await response.json();

      const isSuccessCode = 'code' in data && (data as NewAPIResponse<InventoryTask>).code === 0;
      const isSuccessStatus = 'status' in data && data.status === 'success';
      const payloadData = (data as any).data;

      if (!response.ok || !(isSuccessCode || isSuccessStatus) || !payloadData) {
        throw new Error((data as any).message || '创建盘点任务失败');
      }

      return payloadData;
    } catch (error) {
      console.error('Create inventory task error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败或服务器错误');
    }
  }

  async getEmployeeActiveTasks(): Promise<InventoryTask[]> {
    const response = await apiFetch(API_INVENTORY_ENDPOINTS.EMPLOYEE_ACTIVE_TASKS, {
      method: 'GET',
      useEmployeeToken: true,
    });
    const data: NewAPIResponse<InventoryTask[]> = await response.json();
    if (!response.ok || data.code !== 0 || !data.data) {
      throw new Error(data.message || '获取待处理盘点任务失败');
    }
    return data.data;
  }

  async getAdminTaskDetail(taskId: string, params: { page?: number; limit?: number; status?: InventoryItemStatus }): Promise<InventoryTaskItemsResponse & { task: InventoryTask }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);

    const url = `${API_INVENTORY_ENDPOINTS.ADMIN_TASKS}/${taskId}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiFetch(url, { method: 'GET' });
    const data: any = await response.json();
    const isSuccessCode = 'code' in data && data.code === 0;
    const isSuccessStatus = 'status' in data && data.status === 'success';
    const payload = data.data;

    if (!response.ok || !(isSuccessCode || isSuccessStatus) || !payload) {
      throw new Error(data.message || '获取盘点任务详情失败');
    }

    return payload;
  }

  // Employee-side methods
  async getEmployeeTaskItems(taskId: string, params: { page?: number; limit?: number }): Promise<InventoryTaskItemsResponse> {
    const url = new URL(`${API_INVENTORY_ENDPOINTS.EMPLOYEE_TASKS_BASE}/${taskId}/items`, window.location.origin);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());
    
    const response = await apiFetch(url.toString(), { useEmployeeToken: true });
    const data: NewAPIResponse<InventoryTaskItemsResponse> | { status?: string; message?: string; data?: InventoryTaskItemsResponse } = await response.json();
    const isSuccessCode = 'code' in data && (data as NewAPIResponse<InventoryTaskItemsResponse>).code === 0;
    const isSuccessStatus = 'status' in data && data.status === 'success';
    const payload = (data as any).data;
    if (!response.ok || !(isSuccessCode || isSuccessStatus) || !payload) throw new Error((data as any).message || '获取任务项列表失败');

    const normalizedItems = payload.items?.map((item: any) => ({
      ...item,
      itemId: item.itemId ?? item.id ?? item.mobileNumberId,
    })) ?? [];

    return { ...payload, items: normalizedItems };
  }

  async performItemAction(taskId: string, itemId: number, payload: PerformItemActionPayload): Promise<{ status: string }> {
    const url = `${API_INVENTORY_ENDPOINTS.EMPLOYEE_TASKS_BASE}/${taskId}/items/${itemId}`;
    const response = await apiFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      useEmployeeToken: true,
    });
    const data: NewAPIResponse<{ status: string }> = await response.json();
    if (!response.ok || data.code !== 0 || !data.data) throw new Error(data.message || '操作失败');
    return data.data;
  }

  async reportUnlistedPhone(taskId: string, payload: ReportUnlistedPhonePayload): Promise<void> {
    const url = `${API_INVENTORY_ENDPOINTS.EMPLOYEE_TASKS_BASE}/${taskId}/unlisted`;
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      useEmployeeToken: true,
    });
    const data: NewAPIResponse = await response.json();
    if (!response.ok || data.code !== 0) throw new Error(data.message || '上报号码失败');
  }

  async submitTask(taskId: string): Promise<{ submitted: boolean }> {
    const url = `${API_INVENTORY_ENDPOINTS.EMPLOYEE_TASKS_BASE}/${taskId}/submit`;
    const response = await apiFetch(url, {
      method: 'POST',
      useEmployeeToken: true,
    });
    const data: NewAPIResponse<{ submitted: boolean }> = await response.json();
    if (!response.ok || data.code !== 0 || !data.data) throw new Error(data.message || '提交任务失败');
    return data.data;
  }
}

export const inventoryService = new InventoryService();
