import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  AlertTriangle,
  LayoutDashboard,
  Upload,
  LogOut,
  Building2,
  ClipboardCheck,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasMenuPermission } from "@/utils/permissions";

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  // 所有可能的菜单项
  const allNavItems = [
    {
      name: "仪表盘",
      path: "/dashboard",
      icon: LayoutDashboard,
      key: "dashboard",
    },
    {
      name: "号码管理",
      path: "/phones",
      icon: Phone,
      key: "phones",
    },
    {
      name: "风险号码",
      path: "/risk",
      icon: AlertTriangle,
      key: "risk",
    },
    {
      name: "盘点管理",
      path: "/inventory",
      icon: ClipboardCheck,
      key: "inventory",
    },
    {
      name: "员工管理",
      path: "/employees",
      icon: User,
      key: "employees",
    },
    {
      name: "部门管理",
      path: "/departments",
      icon: Building2,
      key: "departments",
    },
    {
      name: "用户管理",
      path: "/users",
      icon: Users,
      key: "users",
    },
    {
      name: "数据导入",
      path: "/import",
      icon: Upload,
      key: "import",
    },
  ];

  // 根据用户权限过滤菜单项
  const navItems = allNavItems.filter((item) => hasMenuPermission(user, item.key));

  return (
    <div
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-48"
      )}
    >
      <div className="px-4 py-4">
        <div className="flex flex-col items-center space-y-3">
          <img
            src="https://kael.knowbox.cn/html/static/media/xiaohe-logo.c6f6c06b.png"
            alt="logo"
            className={cn(
              "h-12 w-auto object-contain transition-all duration-300",
              isCollapsed ? "w-8" : "w-auto"
            )}
          />
          {/* <h2 className="text-lg font-bold text-sidebar-primary text-center">小盒手机号码管理</h2> */}
        </div>
      </div>

      <nav className="flex-1 px-3 pb-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isCollapsed ? "justify-center" : ""
                    )
                  }
                >
                  <Icon className={cn(isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!isCollapsed && <span className="font-medium ml-2">{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg text-sm",
            isCollapsed ? "justify-center" : ""
          )}
          onClick={logout}
        >
          <LogOut className={cn(isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!isCollapsed && <span className="font-medium ml-2">退出登录</span>}
        </Button>
      </div>
    </div>
  );
};
