// 手机号码相关的工具函数和类型定义

import { DepartmentOption } from "@/config/api";

// 通用的手机号码数据接口
export interface BasePhoneNumber {
  id?: string;
  phoneNumber: string;
  currentUserName?: string;
  applicantName: string;
  applicantEmployeeId: string;
  applicantStatus: string;
  applicationDate: string;
  status: string;
  cancellationDate?: string;
  vendor: string;
  purpose?: string;
  remarks?: string;
  createdAt?: string;
  usageHistory?: Array<{
    id: number;
    mobileNumberDbId: number;
    employeeName: string;
    purpose?: string;
    startDate: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  }>;
  departmentId?: number;
}

// 通用的搜索参数接口
export interface PhoneSearchParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  applicantStatus: string;
  applicationDateFrom: string;
  applicationDateTo: string;
  applicationDate: string;
  cancellationDateFrom: string;
  cancellationDateTo: string;
  cancellationDate: string;
  vendor: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 状态文本映射
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'idle': '闲置',
    'in_use': '使用中',
    'pending_deactivation': '待注销', // 兼容旧值
    'pending_deactivation_user': '待注销（员工上报）',
    'pending_deactivation_admin': '待注销（系统标记）',
    'deactivated': '已注销',
    'risk_pending': '待核实-办卡人离职',
    'user_reported': '待核实-用户报告',
    'suspended': '停机保号',
    'card_replacing': '补卡中',
  };
  return statusMap[status] || status;
};

// 状态变体映射
export const getStatusVariant = (status: string): "active" | "inactive" | "pending" | "cancelled" | "risk" => {
  const variantMap: Record<string, "active" | "inactive" | "pending" | "cancelled" | "risk"> = {
    'idle': 'inactive',
    'in_use': 'active',
    'pending_deactivation': 'pending',
    'pending_deactivation_user': 'pending',
    'pending_deactivation_admin': 'pending',
    'deactivated': 'cancelled',
    'risk_pending': 'risk',
    'user_reported': 'risk',
    'suspended': 'pending',
    'card_replacing': 'pending',
  };
  return variantMap[status] || 'inactive';
};

// 供应商列表
export const VENDORS = [
  '北京联通',
  '北京电信',
  '北京第三方',
  '长春联通',
];

// 供应商文本映射
export const getVendorText = (vendor: string): string => {
  const vendorMap: Record<string, string> = {
    '北京联通': '北京联通',
    '北京电信': '北京电信',
    '北京第三方': '北京第三方',
    '长春联通': '长春联通',
  };
  return vendorMap[vendor] || vendor;
};

// 部门名称映射
export const getDepartmentName = (departmentId: number | undefined, departmentOptions: DepartmentOption[]): string => {
  if (!departmentId) {
    return '未分配部门';
  }
  const department = departmentOptions.find(dept => dept.id === departmentId);
  return department ? department.name : `部门ID: ${departmentId}`;
};

// 申请人状态映射
export const getApplicantStatusText = (status: string): string => {
  return status === "Active" ? "在职" : "离职";
};

export const getApplicantStatusVariant = (status: string): "active" | "inactive" => {
  return status === "Active" ? "active" : "inactive";
};

// 格式化日期
export const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

// 检查是否有使用历史
export const hasUsageHistory = (phone: BasePhoneNumber): boolean => {
  return !!(phone.usageHistory && phone.usageHistory.length > 0);
}; 
