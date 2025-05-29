// 手机号码相关API类型定义
// 根据后端/mobilenumbers接口格式定义

// 手机号码搜索参数
export interface PhoneSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  applicantStatus?: string;
}

// 创建手机号码请求（匹配后端CreateMobileNumberPayload）
export interface CreatePhoneRequest {
  phoneNumber: string;
  applicantEmployeeId: string; // 员工工号
  applicationDate: string; // 格式: YYYY-MM-DD
  status: '闲置' | '在用' | '待注销' | '已注销' | '待核实-办卡人离职';
  purpose?: string; // 可选
  vendor: string;
  remarks: string;
}

// 使用历史记录项
export interface UsageHistoryItem {
  employeeId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// 后端手机号码数据结构（根据实际API响应格式）
export interface APIPhone {
  id: number;
  phoneNumber: string;
  applicantEmployeeId: string;
  applicantName: string;
  applicantStatus: string;
  applicationDate: string;
  cancellationDate: string;
  createdAt: string;
  currentEmployeeId: string;
  currentUserName: string;
  purpose: string;
  remarks: string;
  status: string;
  updatedAt: string;
  vendor: string;
  usageHistory?: UsageHistoryItem[]; // 使用历史记录
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

// 手机号码分配请求（根据后端assignPayload结构）
export interface AssignPhoneRequest {
  assignmentDate: string; // YYYY-MM-DD 格式
  employeeId: string; // 员工工号
  purpose: string; // 用途
}

// 手机号码回收请求（根据后端unassignPayload结构）
export interface UnassignPhoneRequest {
  reclaimDate: string; // YYYY-MM-DD 格式，可选
} 