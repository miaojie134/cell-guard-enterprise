// 认证相关API类型定义

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