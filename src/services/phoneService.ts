import { API_CONFIG, APIResponse, APIErrorResponse } from '@/config/api/base';
import { PhoneSearchParams, PhoneListResponse, APIPhone, CreatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest } from '@/config/api/phone';

// 获取认证头
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

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

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
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

// 获取单个手机号码详情
export const getPhoneByNumber = async (phoneNumber: string): Promise<APIResponse<APIPhone>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}`, {
      method: 'GET',
      headers: getAuthHeaders(),
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

    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
export const updatePhone = async (id: string, phoneData: Partial<APIPhone>): Promise<APIResponse<APIPhone>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(phoneData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新手机号码失败:', error);
    throw error;
  }
};

// 删除手机号码
export const deletePhone = async (id: string): Promise<APIResponse<void>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
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

    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
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

    const response = await fetch(`${API_CONFIG.BASE_URL}/mobilenumbers/${phoneNumber}/unassign`, {
      method: 'POST',
      headers: getAuthHeaders(),
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