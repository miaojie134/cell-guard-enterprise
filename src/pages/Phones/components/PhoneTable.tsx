import React from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Pencil, Loader2, Trash2 } from "lucide-react";
import { hasManagePermission } from "@/utils/permissions";
import { User } from "@/types";
import { PhoneTableHeader } from "./PhoneTableHeader";
import { DepartmentOption } from "@/config/api";

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  currentUserName?: string;
  applicantName: string;
  applicantEmployeeId: string;
  applicantStatus: string;
  applicationDate: string;
  status: string;
  cancellationDate?: string;
  vendor: string;
  purpose: string;
  remarks?: string;
  createdAt: string;
  usageHistory?: Array<{
    employeeId: string;
    startDate: string;
    endDate?: string;
  }>;
  departmentId: number;
}

interface SearchParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  applicantStatus: string;
  applicationDateFrom: string;
  applicationDateTo: string;
  applicationDate: string;
  cancellationDateFrom: string;
  cancellationDateTo: string;
  cancellationDate: string;
  vendor: string;
}

interface PhoneTableProps {
  phoneNumbers: PhoneNumber[];
  isLoading: boolean;
  error: Error | null;
  searchParams: SearchParams;
  isUpdating: boolean;
  isAssigning: boolean;
  isUnassigning: boolean;
  isDeleting: boolean;
  user: User | null;
  departmentOptions: DepartmentOption[];
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: SearchParams) => SearchParams) => void;
  onOpenDetails: (phoneNumber: string) => void;
  onOpenEdit: (phoneNumber: string) => void;
  onOpenAssign: (phoneNumber: string) => void;
  onOpenUnassign: (phoneNumber: string) => void;
  onOpenDelete: (phoneNumber: string) => void;
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'idle': '闲置',
    'in_use': '使用中', 
    'pending_deactivation': '待注销',
    'deactivated': '已注销',
    'risk_pending': '待核实-办卡人离职',
    'user_reported': '待核实-用户报告',
    'suspended': '停机保号',
    'card_replacing': '补卡中',
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string): "active" | "inactive" | "pending" | "cancelled" | "risk" => {
  const variantMap: Record<string, "active" | "inactive" | "pending" | "cancelled" | "risk"> = {
    'idle': 'inactive',
    'in_use': 'active',
    'pending_deactivation': 'pending',
    'deactivated': 'cancelled',
    'risk_pending': 'risk',
    'user_reported': 'risk',
    'suspended': 'pending',
    'card_replacing': 'pending',
  };
  return variantMap[status] || 'inactive';
};

// 部门映射
const getDepartmentName = (departmentId: number | undefined, departmentOptions: DepartmentOption[]) => {
  if (!departmentId) {
    return '未分配部门';
  }
  const department = departmentOptions.find(dept => dept.id === departmentId);
  return department ? department.name : `部门ID: ${departmentId}`;
};

export const PhoneTable: React.FC<PhoneTableProps> = ({
  phoneNumbers,
  isLoading,
  error,
  searchParams,
  isUpdating,
  isAssigning,
  isUnassigning,
  isDeleting,
  user,
  departmentOptions,
  onFilterChange,
  onUpdateSearchParams,
  onOpenDetails,
  onOpenEdit,
  onOpenAssign,
  onOpenUnassign,
  onOpenDelete,
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

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <PhoneTableHeader
            searchParams={searchParams}
            onFilterChange={onFilterChange}
            onUpdateSearchParams={onUpdateSearchParams}
          />
        </thead>
        <tbody>
          {phoneNumbers.map((phone) => (
            <tr key={phone.id}>
              <td className="min-w-[120px]">{phone.phoneNumber}</td>
              <td className="hidden sm:table-cell">{phone.currentUserName || "-"}</td>
              <td className="max-w-[80px] truncate" title={phone.applicantName}>{phone.applicantName}</td>
              <td>
                <StatusBadge 
                  status={phone.applicantStatus === "Active" ? "active" : "inactive"} 
                  text={phone.applicantStatus === "Active" ? "在职" : "离职"} 
                />
              </td>
              <td className="hidden md:table-cell max-w-[100px] truncate" title={getDepartmentName(phone.departmentId, departmentOptions)}>
                {getDepartmentName(phone.departmentId, departmentOptions)}
              </td>
              <td className="hidden md:table-cell text-sm">
                {phone.applicationDate ? new Date(phone.applicationDate).toLocaleDateString('zh-CN') : '-'}
              </td>
              <td>
                <StatusBadge 
                  status={getStatusVariant(phone.status)} 
                  text={getStatusText(phone.status)} 
                />
              </td>
              <td className="hidden lg:table-cell text-sm">
                {phone.cancellationDate ? new Date(phone.cancellationDate).toLocaleDateString('zh-CN') : '-'}
              </td>
              <td className="hidden md:table-cell max-w-[80px] truncate" title={phone.vendor}>{phone.vendor}</td>
              <td className="hidden lg:table-cell max-w-[80px] truncate" title={phone.purpose}>{phone.purpose}</td>
              <td className="min-w-[140px]">
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onOpenDetails(phone.phoneNumber)}
                    className="h-7 w-7 shrink-0"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="sr-only">详情</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onOpenEdit(phone.phoneNumber)}
                    className="h-7 w-7 shrink-0"
                    disabled={isUpdating || !hasManagePermission(user, phone.departmentId)}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Pencil className="h-3 w-3" />
                    )}
                    <span className="sr-only">编辑</span>
                  </Button>
                  {/* 分配/回收按钮 */}
                  {phone.currentUserName ? (
                                      <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onOpenUnassign(phone.phoneNumber)}
                    disabled={isUnassigning || !hasManagePermission(user, phone.departmentId)}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {isUnassigning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "回收"
                    )}
                  </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onOpenAssign(phone.phoneNumber)}
                      disabled={isAssigning || !hasManagePermission(user, phone.departmentId)}
                      className="h-7 px-2 text-xs shrink-0"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "分配"
                      )}
                    </Button>
                  )}
                  {/* 删除按钮 - 低调样式，仅当没有使用历史时显示 */}
                  {(() => {
                    const hasUsageHistory = phone.usageHistory && phone.usageHistory.length > 0;
                    
                    if (!hasUsageHistory) {
                      return (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onOpenDelete(phone.phoneNumber)}
                          disabled={isDeleting || !hasManagePermission(user, phone.departmentId)}
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                          title="删除号码"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          <span className="sr-only">删除</span>
                        </Button>
                      );
                    } else {
                      return (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled
                          className="h-7 w-7 text-gray-300 cursor-not-allowed shrink-0"
                          title="有使用历史记录的号码不能删除"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">不可删除</span>
                        </Button>
                      );
                    }
                  })()}
                </div>
              </td>
            </tr>
          ))}
          {phoneNumbers.length === 0 && !isLoading && (
            <tr>
              <td colSpan={11} className="text-center py-4">
                没有找到符合条件的手机号码
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}; 