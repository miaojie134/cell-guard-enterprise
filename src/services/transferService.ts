import { API_CONFIG } from '@/config/api';
import { TransferRequest, InitiateTransferPayload, NewAPIResponse } from '@/types';
import { apiFetch } from './api';

class TransferService {
  async getPendingTransfers(): Promise<TransferRequest[]> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_TRANSFER_REQUESTS_PENDING}`;
    const response = await apiFetch(url, { useEmployeeToken: true });
    const data: NewAPIResponse<TransferRequest[]> = await response.json();

    if (!response.ok || data.code !== 0 || !data.data) {
      throw new Error(data.message || '获取待处理的转移请求失败');
    }
    return data.data;
  }

  async acceptTransfer(transferId: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_TRANSFER_REQUESTS_BASE}/${transferId}/accept`;
    const response = await apiFetch(url, {
      method: 'POST',
      useEmployeeToken: true,
    });
    const data: NewAPIResponse = await response.json();
    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || '接受转移失败');
    }
  }

  async rejectTransfer(transferId: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_TRANSFER_REQUESTS_BASE}/${transferId}/reject`;
    const response = await apiFetch(url, {
      method: 'POST',
      useEmployeeToken: true,
    });
    const data: NewAPIResponse = await response.json();
    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || '拒绝转移失败');
    }
  }

  async initiateTransfer(payload: InitiateTransferPayload): Promise<TransferRequest> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_TRANSFER_REQUESTS_BASE}/phone/${encodeURIComponent(payload.phoneNumber)}`;
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify({
        toEmployeeId: payload.toEmployeeId,
        remark: payload.remark,
      }),
      useEmployeeToken: true,
    });
    const data: NewAPIResponse<TransferRequest> = await response.json();
    if (!response.ok || data.code !== 0 || !data.data) {
      throw new Error(data.message || '发起转移失败');
    }
    return data.data;
  }
}

export const transferService = new TransferService();
