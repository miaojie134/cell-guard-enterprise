import { toast } from '@/hooks/use-toast';

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit & { auth?: boolean; useEmployeeToken?: boolean }): Promise<Response> => {
  const { auth = true, useEmployeeToken = false, ...restInit } = init || {};

  let token: string | null = null;
  if (useEmployeeToken) {
    token = localStorage.getItem('employee_token');
  } else {
    // This part remains for admin auth
    const { authService } = await import('./authService');
    token = authService.getToken();
  }

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
    const loginPath = useEmployeeToken ? '/employee-login' : '/login';
    const userKey = useEmployeeToken ? 'employee_user' : 'user';
    const tokenKey = useEmployeeToken ? 'employee_token' : 'token';

    if (window.location.pathname !== loginPath) {
      toast({
        title: "会话已过期",
        description: "您的登录已失效，请重新登录。",
        variant: "destructive",
      });
      
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      window.location.href = loginPath;

      throw new Error('Token expired or invalid. Redirecting to login.');
    }
  }

  return response;
};
 