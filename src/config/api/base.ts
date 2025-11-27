// 基础API配置
export const API_CONFIG = {
  BASE_URL: '/api/v1', // 使用代理，不需要完整URL
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    EMPLOYEE_LOGIN: '/employee-auth/login',
    EMPLOYEE_AUTH_HINT: '/employee-auth/hint',
    EMPLOYEE_INVENTORY_TASKS: '/employee/inventory/tasks',
    EMPLOYEE_INVENTORY_TASKS_ACTIVE: '/employee/inventory/tasks/active',
    EMPLOYEES: '/employees',
    PHONES: '/phones',
    DEPARTMENTS: '/departments',
    EMPLOYEE_MOBILE_NUMBERS: '/employee/mobile-numbers',
    EMPLOYEE_NOTIFICATIONS: '/employee/notifications',
    EMPLOYEE_NOTIFICATIONS_UNREAD_COUNT: '/employee/notifications/unread-count',
    EMPLOYEE_NOTIFICATIONS_MARK_AS_READ: '/employee/notifications/:id/read', // Placeholder for dynamic ID
    EMPLOYEE_TRANSFER_REQUESTS_PENDING: '/employee/transfer-requests/pending',
    EMPLOYEE_TRANSFER_REQUESTS_MINE: '/employee/transfer-requests/mine',
    EMPLOYEE_TRANSFER_REQUESTS_BASE: '/employee/transfer-requests',
    TRANSFER_REQUESTS: '/transfer/requests',
  },
};

export enum ResponseStatus {
  SUCCESS = "success",
  // 可以根据需要添加其他状态
}

// 通用API响应类型定义
export interface APIResponse<TData = any> {
  status: ResponseStatus; // 使用枚举
  message: string;
  data: TData; // 成功时data字段是必需的
}

export interface APIErrorResponse {
  details?: string; // details 字段可选
  error: string;   // error 字段是主要的错误信息
} 
