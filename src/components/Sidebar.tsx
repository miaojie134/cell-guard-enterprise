
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
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      name: "仪表盘",
      path: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-5 w-5" />,
    },
    {
      name: "号码管理",
      path: "/phones",
      icon: <Phone className="mr-2 h-5 w-5" />,
    },
    {
      name: "员工管理",
      path: "/employees",
      icon: <User className="mr-2 h-5 w-5" />,
    },
    {
      name: "风险号码",
      path: "/risk",
      icon: <AlertTriangle className="mr-2 h-5 w-5" />,
    },
    {
      name: "数据导入",
      path: "/import",
      icon: <Upload className="mr-2 h-5 w-5" />,
    },
  ];

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="px-6 py-6">
        <h2 className="text-xl font-bold text-sidebar-primary">企业号码管理</h2>
      </div>

      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
          onClick={logout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span className="font-medium">退出登录</span>
        </Button>
      </div>
    </div>
  );
};
