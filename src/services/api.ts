import { authService } from './authService';
import { toast } from '@/hooks/use-toast';

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit & { auth?: boolean }): Promise<Response> => {
  const token = authService.getToken();
  const { auth = true, ...restInit } = init || {};

  const headers = new Headers(restInit.headers);
  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const newInit = {
    ...restInit,
    headers,
  };

  if (!(newInit.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, newInit);

  if (response.status === 401) {
    // 检查是否已在登录页，避免重定向循环
    if (window.location.pathname !== '/login') {
      toast({
        title: "会话已过期",
        description: "您的登录已失效，请重新登录。",
        variant: "destructive",
      });
      // 不再调用 authService.logout()，避免循环
      // 直接清除本地存储并重定向
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';

      // 抛出错误，中断当前请求链
      throw new Error('Token expired or invalid. Redirecting to login.');
    }
  }

  return response;
}; 