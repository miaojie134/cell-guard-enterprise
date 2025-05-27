
// API配置
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080', // 根据你的后端端口调整
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
};

// API响应类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface APIErrorResponse {
  success: false;
  error: string;
  message: string;
}
