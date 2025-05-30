// 基础API配置
export const API_CONFIG = {
  BASE_URL: '/api/v1', // 使用代理，不需要完整URL
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    EMPLOYEES: '/employees',
    PHONES: '/phones',
    DEPARTMENTS: '/departments',
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