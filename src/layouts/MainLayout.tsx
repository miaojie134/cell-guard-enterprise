
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
      if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering content until authentication is confirmed
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 p-4 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
