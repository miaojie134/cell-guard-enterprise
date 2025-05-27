
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查本地存储中的用户信息和token
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        const hasValidToken = authService.isTokenValid();
        
        console.log('Auth initialization:', { savedUser: !!savedUser, hasValidToken });
        
        if (savedUser && hasValidToken) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log("User loaded from localStorage:", parsedUser);
        } else {
          // 清除无效的数据
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          console.log("Cleared invalid auth data");
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Starting login process for:', username);
      
      const loginResponse = await authService.login({ username, password });
      
      // 将后端返回的用户信息转换为前端User类型
      const userData: User = {
        id: loginResponse.user.id,
        username: loginResponse.user.username,
        role: loginResponse.user.role as "admin" | "user",
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      console.log("Login successful, user data:", userData);
      
      toast({
        title: "登录成功",
        description: `欢迎回来，${userData.username}`,
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Login failed:', error);
      
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process');
      await authService.logout();
      
      setUser(null);
      console.log("Logout successful");
      
      toast({
        title: "退出成功",
        description: "您已安全退出系统",
      });
      
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      
      // 即使API调用失败，也要清除前端状态
      setUser(null);
      
      toast({
        title: "退出登录",
        description: error instanceof Error ? error.message : "已清除本地登录状态",
        variant: "destructive",
      });
      
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
