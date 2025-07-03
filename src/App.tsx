import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Phones from "./pages/Phones";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import RiskPhones from "./pages/RiskPhones";
import ImportData from "./pages/ImportData";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { lazy } from "react";

// 盘点验证相关页面 - 先定义占位组件，后续实现
const VerificationManagement = lazy(() => import('@/pages/verification/VerificationManagement'));
const VerificationCreate = lazy(() => import('@/pages/verification/VerificationCreate'));
const VerificationBatchStatus = lazy(() => import('@/pages/verification/VerificationBatchStatus'));
const VerificationResults = lazy(() => import('@/pages/verification/VerificationResults'));
const VerificationVerification = lazy(() => import('@/pages/verification/EmployeeVerification'));

// 重定向组件：处理旧的或错误的验证链接格式
const VerifyRedirect: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // 重定向到正确的验证路由
    return <Navigate to={`/verification/verify/${token}`} replace />;
  }
  
  // 如果没有token，重定向到首页
  return <Navigate to="/" replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/phones" element={<Phones />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/risk" element={<RiskPhones />} />
                <Route path="/import" element={<ImportData />} />
                
                {/* 验证相关路由 */}
                <Route path="/verification" element={<VerificationManagement />} />
                <Route path="/verification/create" element={<VerificationCreate />} />
                <Route path="/verification/batch/:batchId" element={<VerificationBatchStatus />} />
                <Route path="/verification/results/:batchId" element={<VerificationResults />} />
                
                {/* 员工验证路由（不需要登录） */}
                <Route path="/verification/verify/:token" element={<VerificationVerification />} />
                
                {/* 错误的验证链接重定向 */}
                <Route path="/verify-numbers" element={<VerifyRedirect />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </React.Suspense>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
