import { API_CONFIG, APIResponse } from '@/config/api/base';
import { DashboardStatsData } from '@/config/api/dashboard';
import { apiFetch } from './api';

// 获取仪表盘统计数据
export const getDashboardStats = async (): Promise<APIResponse<DashboardStatsData>> => {
  const url = `${API_CONFIG.BASE_URL}/dashboard/stats`;

  try {
    const response = await apiFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: APIResponse<DashboardStatsData> = await response.json();
    return result;
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    throw error;
  }
};
