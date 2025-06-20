import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Pencil, Loader2, Trash2, Edit } from "lucide-react";
import { hasManagePermission } from "@/utils/permissions";
import { User } from "@/types";
import { DepartmentOption } from "@/config/api";
import { 
  BasePhoneNumber, 
  PhoneSearchParams,
  getStatusText,
  getStatusVariant,
  getDepartmentName,
  getApplicantStatusText,
  getApplicantStatusVariant,
  formatDate,
  hasUsageHistory
} from "@/utils/phoneUtils";
import { PhoneTableHeader } from "@/pages/Phones/components/PhoneTableHeader";

// 操作按钮配置类型
export interface ActionConfig {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onClick: (phoneNumber: string) => void;
  disabled?: (phone: BasePhoneNumber) => boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  show?: (phone: BasePhoneNumber) => boolean;
}

interface UnifiedPhoneTableProps {
  phoneNumbers: BasePhoneNumber[];
  isLoading: boolean;
  error: Error | null;
  searchParams: PhoneSearchParams;
  user: User | null;
  departmentOptions: DepartmentOption[];
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: PhoneSearchParams) => PhoneSearchParams) => void;
  
  // 操作配置
  actions: ActionConfig[];
  
  // 表格配置
  showColumns?: {
    currentUser?: boolean;
    purpose?: boolean;
    cancellationDate?: boolean;
  };
  
  // 样式配置
  variant?: "default" | "risk"; // 风险号码使用特殊样式
  
  // 空状态文本
  emptyText?: string;
  
  // 加载状态
  loadingStates?: {
    [actionKey: string]: boolean;
  };
}

export const UnifiedPhoneTable: React.FC<UnifiedPhoneTableProps> = ({
  phoneNumbers,
  isLoading,
  error,
  searchParams,
  user,
  departmentOptions,
  onFilterChange,
  onUpdateSearchParams,
  actions,
  showColumns = {
    currentUser: true,
    purpose: true,
    cancellationDate: true,
  },
  variant = "default",
  emptyText = "没有找到符合条件的手机号码",
  loadingStates = {},
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        加载失败: {error.message}
      </div>
    );
  }

  // 计算表格列数
  const getColSpan = () => {
    let count = 6; // 号码、办卡人、办卡人状态、部门、办卡时间、状态、供应商、操作
    if (showColumns.currentUser) count += 1;
    if (showColumns.purpose) count += 1;
    if (showColumns.cancellationDate) count += 1;
    return count;
  };

  // 渲染操作按钮
  const renderActions = (phone: BasePhoneNumber) => {
    return (
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => {
          // 检查是否显示此操作
          if (action.show && !action.show(phone)) {
            return null;
          }

          const isDisabled = action.disabled ? action.disabled(phone) : false;
          const isLoading = loadingStates[action.key] || false;

          return (
            <Button
              key={action.key}
              variant={action.variant || "outline"}
              size={action.size || "sm"}
              onClick={() => action.onClick(phone.phoneNumber)}
              disabled={isDisabled || isLoading}
              className={`h-7 shrink-0 ${action.className || ""}`}
              title={action.title}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                action.icon
              )}
              {action.size !== "icon" && (
                <span className={action.icon ? "ml-1" : ""}>{action.label}</span>
              )}
              <span className="sr-only">{action.label}</span>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <PhoneTableHeader
            searchParams={searchParams}
            onFilterChange={onFilterChange}
            onUpdateSearchParams={onUpdateSearchParams}
            variant={variant}
            showColumns={showColumns}
          />
        </thead>
        <tbody>
          {phoneNumbers.map((phone) => (
            <tr key={phone.id || phone.phoneNumber}>
              <td className="min-w-[120px]">{phone.phoneNumber}</td>
              
              {showColumns.currentUser && (
                <td className="hidden sm:table-cell">{phone.currentUserName || "-"}</td>
              )}
              
              <td className="max-w-[80px] truncate" title={phone.applicantName}>
                {phone.applicantName}
              </td>
              
              <td>
                <StatusBadge 
                  status={getApplicantStatusVariant(phone.applicantStatus)} 
                  text={getApplicantStatusText(phone.applicantStatus)} 
                />
              </td>
              
              <td className="hidden md:table-cell max-w-[100px] truncate" 
                  title={getDepartmentName(phone.departmentId, departmentOptions)}>
                {getDepartmentName(phone.departmentId, departmentOptions)}
              </td>
              
              <td className="hidden md:table-cell text-sm">
                {formatDate(phone.applicationDate)}
              </td>
              
              <td>
                <StatusBadge 
                  status={getStatusVariant(phone.status)} 
                  text={getStatusText(phone.status)} 
                />
              </td>
              
              {showColumns.cancellationDate && (
                <td className="hidden lg:table-cell text-sm">
                  {formatDate(phone.cancellationDate)}
                </td>
              )}
              
              <td className="hidden md:table-cell max-w-[80px] truncate" title={phone.vendor}>
                {phone.vendor}
              </td>
              
              {showColumns.purpose && (
                <td className="hidden lg:table-cell max-w-[80px] truncate" title={phone.purpose}>
                  {phone.purpose}
                </td>
              )}
              
              <td className="min-w-[140px]">
                {renderActions(phone)}
              </td>
            </tr>
          ))}
          
          {phoneNumbers.length === 0 && !isLoading && (
            <tr>
              <td colSpan={getColSpan()} className="text-center py-4">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}; 