
import { API_CONFIG, LoginRequest, LoginResponse, APIResponse, APIErrorResponse } from '@/config/api';

class AuthService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Attempting login with:', { username: credentials.username });
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);

      const data: APIResponse<LoginResponse> | APIErrorResponse = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.message || '登录失败');
      }

      const successData = data as APIResponse<LoginResponse>;
      if (!successData.success || !successData.data) {
        throw new Error('登录响应格式错误');
      }

      // 存储token
      localStorage.setItem('token', successData.data.token);
      console.log('Token stored successfully');

      return successData.data;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Attempting logout');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });

      console.log('Logout response status:', response.status);

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        console.error('Logout error response:', errorData);
        throw new Error(errorData.message || '退出登录失败');
      }

      // 清除本地存储的token和用户信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Local storage cleared successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使API调用失败，也要清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败');
    }
  }

  // 检查token是否有效
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // 简单的token格式检查，实际项目中可能需要更复杂的验证
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
