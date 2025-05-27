// API配置
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8081/api/v1', // 根据你的后端端口调整
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
};

export enum ResponseStatus {
  SUCCESS = "success",
  // 可以根据需要添加其他状态
}

// API响应类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponsePayload { // 原LoginResponse，代表成功登录响应中的data部分
  token: string;
  user: {
    id?: string; // id 字段可选
    username: string;
    role: string;
  };
}

export interface APIResponse<TData = any> {
  status: ResponseStatus; // 使用枚举
  message: string;
  data: TData; // 成功时data字段是必需的
}

export interface APIErrorResponse {
  details?: string; // details 字段可选
  error: string;   // error 字段是主要的错误信息
}
