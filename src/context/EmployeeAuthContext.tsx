import React, { createContext, useContext, useState, useEffect } from "react";
import { EmployeeInfo, EmployeeLoginPayload } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

interface EmployeeAuthContextType {
  employee: EmployeeInfo | null;
  isEmployeeAuthenticated: boolean;
  isEmployeeLoading: boolean;
  employeeLogin: (credentials: EmployeeLoginPayload) => Promise<void>;
  employeeLogout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | null>(null);

export const EmployeeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [isEmployeeLoading, setEmployeeLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedEmployee = localStorage.getItem("employee_user");
        const token = localStorage.getItem("employee_token");
        
        // A simple check if token exists. A real app should validate it.
        if (savedEmployee && token) {
          setEmployee(JSON.parse(savedEmployee));
        } else {
          localStorage.removeItem("employee_user");
          localStorage.removeItem("employee_token");
        }
      } catch (error) {
        console.error("Error during employee auth initialization:", error);
        localStorage.removeItem("employee_user");
        localStorage.removeItem("employee_token");
      } finally {
        setEmployeeLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const employeeLogin = async (credentials: EmployeeLoginPayload) => {
    setEmployeeLoading(true);
    try {
      const { employee: employeeData } = await authService.employeeLogin(credentials);
      
      setEmployee(employeeData);
      // The service already stores the token and user info in localStorage
      
      toast({
        title: "登录成功",
        description: `欢迎您，${employeeData.fullName}`,
      });
      
      // Navigate to employee dashboard (to be created)
      navigate("/employee/dashboard"); 

    } catch (error) {
      console.error('Employee login failed:', error);
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setEmployeeLoading(false);
    }
  };

  const employeeLogout = () => {
    // In a real app, you might want to call a backend logout endpoint
    setEmployee(null);
    localStorage.removeItem("employee_user");
    localStorage.removeItem("employee_token");
    toast({
      title: "退出成功",
      description: "您已安全退出员工服务",
    });
    navigate("/employee-login");
  };

  return (
    <EmployeeAuthContext.Provider value={{
      employee,
      isEmployeeAuthenticated: !!employee,
      isEmployeeLoading,
      employeeLogin,
      employeeLogout,
    }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error("useEmployeeAuth must be used within an EmployeeAuthProvider");
  }
  return context;
};
