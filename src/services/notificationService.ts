import { API_CONFIG, APIResponse, PaginatedNotificationsResponse, Notification } from '@/config/api';
import { apiFetch } from './api';

class NotificationService {
  async getEmployeeNotifications(params: { page?: number, limit?: number }): Promise<PaginatedNotificationsResponse> {
    const url = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_NOTIFICATIONS}`, window.location.origin);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());
    
    const response = await apiFetch(url.toString(), { useEmployeeToken: true });
    const data = await response.json();

    // 兼容 status:success 与 code:0
    const isSuccessCode = 'code' in data && data.code === 0;
    const isSuccessStatus = 'status' in data && data.status === 'success';
    if (!response.ok || !(isSuccessCode || isSuccessStatus)) {
      throw new Error(data.message || '获取通知列表失败');
    }
    return data.data;
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_NOTIFICATIONS_UNREAD_COUNT}`;
    const response = await apiFetch(url, { useEmployeeToken: true });
    const data = await response.json();

    const isSuccessCode = 'code' in data && data.code === 0;
    const isSuccessStatus = 'status' in data && data.status === 'success';
    if (!response.ok || !(isSuccessCode || isSuccessStatus)) {
      throw new Error(data.message || '获取未读通知数失败');
    }
    // 兼容字段名 unread 或 count
    const unread = data.data?.unread ?? data.data?.count ?? 0;
    return { count: unread };
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const url = `${API_CONFIG.BASE_URL}/employee/notifications/${notificationId}/read`; // Manually construct URL with ID
    const response = await apiFetch(url, {
      method: 'GET',
      useEmployeeToken: true,
    });
    const data = await response.json();

    const isSuccessCode = 'code' in data && data.code === 0;
    const isSuccessStatus = 'status' in data && data.status === 'success';
    if (!response.ok || !(isSuccessCode || isSuccessStatus)) {
      throw new Error(data.message || '标记已读失败');
    }
    return data.data;
  }
}

export const notificationService = new NotificationService();
