// 手机号码相关API类型定义（预留）
// 这里为将来的手机号码管理功能预留

// 手机号码搜索参数
export interface PhoneSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

// 后端手机号码数据结构
export interface APIPhone {
  id: number;
  phoneNumber: string;
  status: string;
  assignedEmployeeId?: string;
  assignedDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 手机号码列表响应
export interface PhoneListResponse {
  items: APIPhone[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// 手机号码分配请求
export interface AssignPhoneRequest {
  phoneId: string;
  employeeId: string;
}

// 手机号码回收请求
export interface RecoverPhoneRequest {
  phoneId: string;
  reason?: string;
} 