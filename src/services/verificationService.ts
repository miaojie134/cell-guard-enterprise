import {
  API_CONFIG,
  APIResponse,
  APIErrorResponse,
  ResponseStatus
} from '@/config/api';
import {
  VerificationInitiateRequest,
  VerificationBatchTask,
  VerificationEmployeeInfo,
  VerificationSubmitRequest,
  VerificationResults
} from '@/types';
import { apiFetch } from './api';

class VerificationService {
  // 发起号码使用确认流程（管理员接口）
  async initiate(data: VerificationInitiateRequest): Promise<{ batchId: string }> {
    try {
      console.log('发起盘点验证:', data);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/verification/admin/batch`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const responseData: APIResponse<{ batchId: string }> | APIErrorResponse = await response.json();
      if (!response.ok) {
        throw new Error((responseData as APIErrorResponse).error || '发起盘点验证失败');
      }
      return (responseData as APIResponse<{ batchId: string }>).data;
    } catch (error) {
      console.error('发起盘点验证失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('发起盘点验证失败，请稍后重试');
    }
  }

  // 获取批处理任务状态（管理员接口）
  async getBatchStatus(batchId: string): Promise<VerificationBatchTask> {
    try {
      console.log('获取批处理状态:', batchId);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/verification/batch/${batchId}/status`, {
        method: 'GET',
      });

      const responseData: APIResponse<VerificationBatchTask> | APIErrorResponse = await response.json();
      if (!response.ok) {
        throw new Error((responseData as APIErrorResponse).error || '获取批处理状态失败');
      }
      return (responseData as APIResponse<VerificationBatchTask>).data;
    } catch (error) {
      console.error('获取批处理状态失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取批处理状态失败，请稍后重试');
    }
  }

  // 获取待确认的号码信息（员工接口）
  async getEmployeeInfo(token: string): Promise<VerificationEmployeeInfo> {
    try {
      console.log('获取员工确认信息');

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/verification/info?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        auth: false, // 无需JWT认证
      });

      const responseData: APIResponse<VerificationEmployeeInfo> | APIErrorResponse = await response.json();
      if (!response.ok) {
        throw new Error((responseData as APIErrorResponse).error || '获取员工确认信息失败');
      }
      return (responseData as APIResponse<VerificationEmployeeInfo>).data;
    } catch (error) {
      console.error('获取员工确认信息失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取确认信息失败，请检查链接是否有效');
    }
  }

  // 提交号码确认结果（员工接口）
  async submitVerification(token: string, data: VerificationSubmitRequest): Promise<void> {
    try {
      console.log('提交确认结果:', data);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/verification/submit?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(data),
        auth: false, // 无需JWT认证
      });

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        throw new Error(errorData.error || '提交确认结果失败');
      }
    } catch (error) {
      console.error('提交确认结果失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('提交确认结果失败，请稍后重试');
    }
  }

  // 获取基于手机号码维度的确认流程状态（管理员接口）
  async getResults(batchId: string): Promise<VerificationResults> {
    try {
      console.log('获取盘点结果, batchId:', batchId);

      const url = `${API_CONFIG.BASE_URL}/verification/admin/phone-status?batch_id=${batchId}`;

      const response = await apiFetch(url, {
        method: 'GET',
      });

      const responseData: APIResponse<VerificationResults> | APIErrorResponse = await response.json();
      if (!response.ok) {
        throw new Error((responseData as APIErrorResponse).error || '获取盘点结果失败');
      }
      return (responseData as APIResponse<VerificationResults>).data;
    } catch (error) {
      console.error('获取盘点结果失败:', error);

      // 如果接口不存在或其他错误，返回默认空数据结构
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('fetch'))) {
        console.warn('盘点结果接口暂未实现或网络错误，返回空数据结构');
        return {
          summary: {
            totalPhonesCount: 0,
            confirmedPhonesCount: 0,
            reportedIssuesCount: 0,
            pendingPhonesCount: 0,
            newlyReportedPhonesCount: 0,
          },
          confirmedPhones: [],
          pendingUsers: [],
          reportedIssues: [],
          unlistedNumbers: [],
        };
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取盘点结果失败，请稍后重试');
    }
  }

  // 批量获取批处理任务列表（用于管理页面）
  async getBatchList(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<VerificationBatchTask[]> {
    try {
      console.log('获取批处理任务列表', params);

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.createdAfter) queryParams.append('createdAfter', params.createdAfter);
      if (params?.createdBefore) queryParams.append('createdBefore', params.createdBefore);

      const url = `${API_CONFIG.BASE_URL}/verification/admin/batch-tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiFetch(url, {
        method: 'GET',
      });

      const result: APIResponse<{
        tasks: VerificationBatchTask[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }> = await response.json();

      if (!response.ok) {
        throw new Error((result as unknown as APIErrorResponse).error || '获取批处理任务列表失败');
      }

      return result.data.tasks;
    } catch (error) {
      console.error('获取批处理任务列表失败:', error);
      // 如果接口不存在，返回空数组
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('批处理列表接口暂未实现，返回空数组');
        return [];
      }
      throw error;
    }
  }

  // 补发失败的验证邮件
  async resendFailedEmails(batchId: string, employeeIds?: string[]): Promise<{
    totalAttempted: number;
    successCount: number;
    failedCount: number;
    successEmails: Array<{
      employeeId: string;
      emailAddress: string;
    }>;
    failedEmails: Array<{
      employeeId: string;
      employeeName: string;
      emailAddress: string;
      reason: string;
    }>;
  }> {
    try {
      console.log(`补发邮件: batchId=${batchId}, employeeIds=${employeeIds?.join(',')}`);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/verification/batch/${batchId}/resend`, {
        method: 'POST',
        body: JSON.stringify({ employeeIds }),
      });

      const responseData: APIResponse<any> | APIErrorResponse = await response.json();
      if (!response.ok) {
        throw new Error((responseData as APIErrorResponse).error || '补发邮件失败');
      }
      return (responseData as APIResponse<any>).data;
    } catch (error) {
      console.error('补发失败的验证邮件失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('补发失败的验证邮件失败，请稍后重试');
    }
  }
}

export const verificationService = new VerificationService(); 