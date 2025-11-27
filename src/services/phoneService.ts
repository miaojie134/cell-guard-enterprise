import { API_CONFIG, APIResponse, APIErrorResponse } from '@/config/api/base';
import { PhoneSearchParams, RiskPhoneSearchParams, PhoneListResponse, APIPhone, CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest, HandleRiskPhoneRequest } from '@/config/api/phone';
import { PaginatedData, PhoneNumber, mapBackendPhoneToFrontend, NewAPIResponse } from '@/types/index';
import { apiFetch } from './api';

// 获取手机号码列表
export const getPhoneNumbers = async (params: PhoneSearchParams = {}): Promise<APIResponse<PhoneListResponse>> => {
  const url = new URL(`${API_CONFIG.BASE_URL}/mobilenumbers`, window.location.origin);

  // 添加查询参数
  if (params.page) url.searchParams.append('page', params.page.toString());
  if (params.limit) url.searchParams.append('limit', params.limit.toString());
  if (params.sortBy) url.searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.append('sortOrder', params.sortOrder);
  if (params.search) url.searchParams.append('search', params.search);
  if (params.status) url.searchParams.append('status', params.status);
  if (params.applicantStatus) url.searchParams.append('applicantStatus', params.applicantStatus);
  if (params.vendor) url.searchParams.append('vendor', params.vendor);

  // 办卡时间筛选参数
  if (params.applicationDateFrom) url.searchParams.append('applicationDateFrom', params.applicationDateFrom);
  if (params.applicationDateTo) url.searchParams.append('applicationDateTo', params.applicationDateTo);
  if (params.applicationDate) url.searchParams.append('applicationDate', params.applicationDate);

  // 注销时间筛选参数
  if (params.cancellationDateFrom) url.searchParams.append('cancellationDateFrom', params.cancellationDateFrom);
  if (params.cancellationDateTo) url.searchParams.append('cancellationDateTo', params.cancellationDateTo);
  if (params.cancellationDate) url.searchParams.append('cancellationDate', params.cancellationDate);

  try {
    const response = await apiFetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取手机号码列表失败:', error);
    throw error;
  }
};

// 获取风险号码列表
export const getRiskPhoneNumbers = async (params: RiskPhoneSearchParams = {}): Promise<APIResponse<PhoneListResponse>> => {
  const url = new URL(`${API_CONFIG.BASE_URL}/mobilenumbers/risk-pending`, window.location.origin);

  // 添加查询参数
  if (params.page) url.searchParams.append('page', params.page.toString());
  if (params.limit) url.searchParams.append('limit', params.limit.toString());
  if (params.sortBy) url.searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.append('sortOrder', params.sortOrder);
  if (params.search) url.searchParams.append('search', params.search);
  if (params.vendor) url.searchParams.append('vendor', params.vendor);

  // 办卡时间筛选参数
  if (params.applicationDateFrom) url.searchParams.append('applicationDateFrom', params.applicationDateFrom);
  if (params.applicationDateTo) url.searchParams.append('applicationDateTo', params.applicationDateTo);
  if (params.applicationDate) url.searchParams.append('applicationDate', params.applicationDate);

  try {
    const response = await apiFetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取风险号码列表失败:', error);
    throw error;
  }
};

// 获取单个手机号码详情
export const getPhoneByNumber = async (phoneNumber: string): Promise<APIResponse<APIPhone>> => {
  try {
    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取手机号码详情失败:', error);
    throw error;
  }
};

// 创建手机号码（使用新的接口格式）
export const createPhone = async (phoneData: CreatePhoneRequest): Promise<APIResponse<APIPhone>> => {
  try {
    console.log('Creating phone with data:', phoneData);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers`, {
      method: 'POST',
      body: JSON.stringify(phoneData),
    });

    console.log('Create phone response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Create phone error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Create phone success response:', data);
    return data;
  } catch (error) {
    console.error('创建手机号码失败:', error);
    throw error;
  }
};

// 更新手机号码
export const updatePhone = async (phoneNumber: string, phoneData: UpdatePhoneRequest): Promise<APIResponse<APIPhone>> => {
  try {
    console.log('Updating phone:', phoneNumber, 'with data:', phoneData);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/update`, {
      method: 'POST',
      body: JSON.stringify(phoneData),
    });

    console.log('Update phone response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update phone error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Update phone success response:', data);
    return data;
  } catch (error) {
    console.error('更新手机号码失败:', error);
    throw error;
  }
};

// 删除手机号码
export const deletePhone = async (id: string): Promise<APIResponse<void>> => {
  try {
    console.log('Deleting phone:', id);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${id}`, {
      method: 'DELETE',
    });

    console.log('Delete phone response status:', response.status);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('Delete phone error response:', errorData);
        // 尝试获取更详细的错误信息
        const errorMsg = errorData.error || errorData.message || errorData.details || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      } catch (jsonError) {
        // 如果无法解析JSON，返回HTTP状态码错误
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Delete phone success response:', data);
    return data;
  } catch (error) {
    console.error('删除手机号码失败:', error);
    throw error;
  }
};

// 分配手机号码
export const assignPhone = async (phoneNumber: string, assignData: AssignPhoneRequest): Promise<APIResponse<APIPhone>> => {
  try {
    console.log('Assigning phone:', phoneNumber, 'with data:', assignData);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignData),
    });

    console.log('Assign phone response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Assign phone error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Assign phone success response:', data);
    return data;
  } catch (error) {
    console.error('分配手机号码失败:', error);
    throw error;
  }
};

// 回收手机号码
export const unassignPhone = async (phoneNumber: string, unassignData: UnassignPhoneRequest): Promise<APIResponse<APIPhone>> => {
  try {
    console.log('Unassigning phone:', phoneNumber, 'with data:', unassignData);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/unassign`, {
      method: 'POST',
      body: JSON.stringify(unassignData),
    });

    console.log('Unassign phone response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Unassign phone error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Unassign phone success response:', data);
    return data;
  } catch (error) {
    console.error('回收手机号码失败:', error);
    throw error;
  }
};

// 处理风险号码
export const handleRiskPhone = async (phoneNumber: string, handleData: HandleRiskPhoneRequest): Promise<APIResponse<APIPhone>> => {
  try {
    console.log('Handling risk phone:', phoneNumber, 'with data:', handleData);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/handle-risk`, {
      method: 'POST',
      body: JSON.stringify(handleData),
    });

    console.log('Handle risk phone response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Handle risk phone error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Handle risk phone success response:', data);
    return data;
  } catch (error) {
    console.error('处理风险号码失败:', error);
    throw error;
  }
};

// 导出手机号码资产明细
export const exportPhoneAssets = async (params: PhoneSearchParams = {}): Promise<Blob> => {
  const url = new URL(`${API_CONFIG.BASE_URL}/mobilenumbers/export`, window.location.origin);

  // 添加查询参数
  if (params.search) url.searchParams.append('search', params.search);
  if (params.status) url.searchParams.append('status', params.status);
  if (params.applicantStatus) url.searchParams.append('applicantStatus', params.applicantStatus);
  if (params.vendor) url.searchParams.append('vendor', params.vendor);
  if (params.applicationDateFrom) url.searchParams.append('applicationDateFrom', params.applicationDateFrom);
  if (params.applicationDateTo) url.searchParams.append('applicationDateTo', params.applicationDateTo);
  if (params.cancellationDateFrom) url.searchParams.append('cancellationDateFrom', params.cancellationDateFrom);
  if (params.cancellationDateTo) url.searchParams.append('cancellationDateTo', params.cancellationDateTo);

  try {
    const response = await apiFetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  } catch (error) {
    console.error('导出手机号码资产明细失败:', error);
    throw error;
  }
};

// 增强版批量导入手机号码数据结果
export interface EnhancedImportData {
  message: string;
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    rowData: string[];
    reason: string;
  }>;
}

// API响应结构
export interface EnhancedImportResult {
  status: string;
  message: string;
  data: EnhancedImportData;
}

// 中文状态到英文状态的映射
const statusChineseToEnglishMap: Record<string, string> = {
  '闲置': 'idle',
  '使用中': 'in_use',
  '待注销': 'pending_deactivation_user', // 默认导入视为员工上报
  '已注销': 'deactivated',
  '待核实-办卡人离职': 'risk_pending',
  '待核实-用户报告': 'user_reported',
  '停机保号': 'suspended',
  '补卡中': 'card_replacing'
};

// 处理CSV文件内容，将中文状态转换为英文状态
const preprocessCSVFile = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let content = event.target?.result as string;

        // 替换中文状态为英文状态
        Object.entries(statusChineseToEnglishMap).forEach(([chinese, english]) => {
          // 使用正则表达式进行全局替换，考虑CSV格式（逗号分隔）
          const regex = new RegExp(`([,]|^)${chinese}([,]|$)`, 'g');
          content = content.replace(regex, `$1${english}$2`);
        });

        // 创建新的文件对象
        const processedBlob = new Blob([content], { type: file.type });
        const processedFile = new File([processedBlob], file.name, { type: file.type });
        resolve(processedFile);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'utf-8');
  });
};

export const enhancedImportPhones = async (file: File): Promise<APIResponse<EnhancedImportResult>> => {
  try {
    const processedFile = await preprocessCSVFile(file);
    const formData = new FormData();
    formData.append('file', processedFile, processedFile.name);

    console.log('Importing phones with file:', processedFile.name);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/mobilenumbers/import`, {
      method: 'POST',
      body: formData,
    });

    console.log('Import phones response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('增强版批量导入手机号码失败:', error);
    throw error;
  }
};

export const getEmployeeMobileNumbers = async (params: { page?: number, limit?: number }): Promise<PaginatedData<PhoneNumber>> => {
  try {
    const url = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_MOBILE_NUMBERS}`, window.location.origin);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());

    const response = await apiFetch(url.toString(), {
      method: 'GET',
      useEmployeeToken: true,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || '获取员工手机号列表失败');
    }
    
    // 支持两种格式：{code:0,data:{...}} 或 {status:'success',data:{...}}
    if ('code' in data) {
      if (data.code !== 0 || !data.data) {
        throw new Error(data.message || '获取员工手机号列表响应格式错误');
      }
    } else if ('status' in data) {
      if (data.status !== 'success' || !data.data) {
        throw new Error(data.message || '获取员工手机号列表响应格式错误');
      }
    } else {
      throw new Error('获取员工手机号列表响应格式错误');
    }

    return {
      data: data.data.items.map(mapBackendPhoneToFrontend),
      total: data.data.pagination.total,
      page: data.data.pagination.page,
      pageSize: data.data.pagination.limit || data.data.pagination.pageSize,
    };

  } catch (error) {
    console.error('Get employee mobile numbers error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络连接失败或服务器错误');
  }
};

export const requestDeactivatePhone = async (phoneNumber: string): Promise<void> => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEE_MOBILE_NUMBERS}/${encodeURIComponent(phoneNumber)}/deactivate-request`;
    const response = await apiFetch(url, {
      method: 'POST',
      useEmployeeToken: true,
    });

    const data: NewAPIResponse<{ submitted: boolean }> | { status: string; message?: string; data?: { submitted?: boolean } } = await response.json();

    const successByCode = 'code' in data && data.code === 0;
    const successByStatus = 'status' in data && data.status === 'success';
    const submitted = (data as any).data?.submitted;

    if (!response.ok || !(successByCode || successByStatus) || submitted === false) {
      throw new Error((data as any).message || '提交停用申请失败');
    }
  } catch (error) {
    console.error('Request deactivate phone error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络连接失败或服务器错误');
  }
};

export const confirmDeactivatePhone = async (phoneNumber: string): Promise<void> => {
  const url = `${API_CONFIG.BASE_URL}/mobilenumbers/${encodeURIComponent(phoneNumber)}/confirm-deactivate`;
  const response = await apiFetch(url, { method: 'POST' });
  const data: NewAPIResponse = await response.json();
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || '确认停用失败');
  }
};

export const rejectDeactivatePhone = async (phoneNumber: string): Promise<void> => {
  const url = `${API_CONFIG.BASE_URL}/mobilenumbers/${encodeURIComponent(phoneNumber)}/reject-deactivate`;
  const response = await apiFetch(url, { method: 'POST' });
  const data: NewAPIResponse = await response.json();
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || '驳回停用失败');
  }
};
