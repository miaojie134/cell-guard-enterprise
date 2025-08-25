/**
 * 统一的状态映射工具
 * 避免在多个组件中重复写状态转换逻辑
 */

import {
  FrontendPhoneStatus,
  FrontendEmploymentStatus,
  BACKEND_PHONE_STATUS,
  FRONTEND_PHONE_STATUS,
  BACKEND_EMPLOYMENT_STATUS,
  FRONTEND_EMPLOYMENT_STATUS
} from '@/types';

// 手机状态：后端字符串 -> 前端类型
export const mapPhoneStatusStringToFrontend = (status: string): FrontendPhoneStatus => {
  const statusMap: Record<string, FrontendPhoneStatus> = {
    'idle': FRONTEND_PHONE_STATUS.IDLE,
    'in_use': FRONTEND_PHONE_STATUS.IN_USE,
    'pending_deactivation': FRONTEND_PHONE_STATUS.PENDING_CANCELLATION,
    'deactivated': FRONTEND_PHONE_STATUS.CANCELLED,
    'risk_pending': FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_EMPLOYEE_LEFT,
    'user_reported': FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_USER_REPORT,
    // 兼容后端可能返回的其他格式
    'pending_cancellation': FRONTEND_PHONE_STATUS.PENDING_CANCELLATION,
    'cancelled': FRONTEND_PHONE_STATUS.CANCELLED,
  };

  return statusMap[status] || FRONTEND_PHONE_STATUS.IDLE;
};

// 员工状态：后端字符串 -> 前端类型  
export const mapEmployeeStatusStringToFrontend = (status: string): FrontendEmploymentStatus => {
  const statusMap: Record<string, FrontendEmploymentStatus> = {
    'Active': FRONTEND_EMPLOYMENT_STATUS.ACTIVE,
    'Departed': FRONTEND_EMPLOYMENT_STATUS.DEPARTED,
    // 兼容小写格式
    'active': FRONTEND_EMPLOYMENT_STATUS.ACTIVE,
    'departed': FRONTEND_EMPLOYMENT_STATUS.DEPARTED,
  };

  return statusMap[status] || FRONTEND_EMPLOYMENT_STATUS.DEPARTED;
};

// 手机状态：前端类型 -> 中文显示文本
export const getPhoneStatusText = (status: FrontendPhoneStatus): string => {
  const textMap: Record<FrontendPhoneStatus, string> = {
    [FRONTEND_PHONE_STATUS.IDLE]: '闲置',
    [FRONTEND_PHONE_STATUS.IN_USE]: '使用中',
    [FRONTEND_PHONE_STATUS.PENDING_CANCELLATION]: '待注销',
    [FRONTEND_PHONE_STATUS.CANCELLED]: '已注销',
    [FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_EMPLOYEE_LEFT]: '待核实-办卡人离职',
    [FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_USER_REPORT]: '待核实-用户报告',
  };

  return textMap[status] || status;
};

// 员工状态：前端类型 -> 中文显示文本
export const getEmployeeStatusText = (status: FrontendEmploymentStatus): string => {
  const textMap: Record<FrontendEmploymentStatus, string> = {
    [FRONTEND_EMPLOYMENT_STATUS.ACTIVE]: '在职',
    [FRONTEND_EMPLOYMENT_STATUS.DEPARTED]: '已离职',
  };

  return textMap[status] || status;
};

// 便捷函数：直接从后端字符串转换到中文显示
export const getPhoneStatusTextFromString = (status: string): string => {
  const frontendStatus = mapPhoneStatusStringToFrontend(status);
  return getPhoneStatusText(frontendStatus);
};

export const getEmployeeStatusTextFromString = (status: string): string => {
  const frontendStatus = mapEmployeeStatusStringToFrontend(status);
  return getEmployeeStatusText(frontendStatus);
};
