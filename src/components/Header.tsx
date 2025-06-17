import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  const getUserRoleDisplay = () => {
    if (!user) return "";
    
    switch (user.role) {
      case "super_admin":
        return "超级管理员";
      case "regional_admin":
        return "区域管理员";
      case "admin":
        return "管理员";
      case "user":
        return "用户";
      default:
        return user.role;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (user?.role) {
      case "super_admin":
        return "default";
      case "regional_admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <header className="border-b px-4 py-2 bg-white flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-3">
        <div className="text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">欢迎，</span>
            <span className="font-medium">{user?.name || user?.username}</span>
            <Badge variant={getRoleBadgeVariant() as any} className="text-xs">
              {getUserRoleDisplay()}
            </Badge>
          </div>
          {user?.departmentPermissions && user.departmentPermissions.length > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              管理 {user.departmentPermissions.length} 个部门
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-xs">
          {user?.username[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
};
