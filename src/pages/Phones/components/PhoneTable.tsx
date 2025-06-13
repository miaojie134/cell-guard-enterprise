import React from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Pencil, Loader2 } from "lucide-react";
import { PhoneTableHeader } from "./PhoneTableHeader";

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
}

interface PhoneTableProps {
  phoneNumbers: PhoneNumber[];
  isLoading: boolean;
  error: Error | null;
  searchParams: SearchParams;
  isUpdating: boolean;
  isAssigning: boolean;
  isUnassigning: boolean;
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: SearchParams) => SearchParams) => void;
  onOpenDetails: (phoneNumber: string) => void;
  onOpenEdit: (phoneNumber: string) => void;
  onOpenAssign: (phoneNumber: string) => void;
  onOpenUnassign: (phoneNumber: string) => void;
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'idle': '闲置',
    'in_use': '使用中', 
    'pending_deactivation': '待注销',
    'deactivated': '已注销',
    'risk_pending': '待核实-办卡人离职',
    'user_reported': '待核实-用户报告',
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
  };
  return variantMap[status] || 'inactive';
};

export const PhoneTable: React.FC<PhoneTableProps> = ({
  phoneNumbers,
  isLoading,
  error,
  searchParams,
  isUpdating,
  isAssigning,
  isUnassigning,
  onFilterChange,
  onUpdateSearchParams,
  onOpenDetails,
  onOpenEdit,
  onOpenAssign,
  onOpenUnassign,
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
              <td>{phone.phoneNumber}</td>
              <td>{phone.currentUserName || "-"}</td>
              <td>{phone.applicantName}</td>
              <td>
                <StatusBadge 
                  status={phone.applicantStatus === "Active" ? "active" : "inactive"} 
                  text={phone.applicantStatus === "Active" ? "在职" : "已离职"} 
                />
              </td>
              <td className="text-sm">
                {phone.applicationDate ? new Date(phone.applicationDate).toLocaleDateString('zh-CN') : '-'}
              </td>
              <td>
                <StatusBadge 
                  status={getStatusVariant(phone.status)} 
                  text={getStatusText(phone.status)} 
                />
              </td>
              <td className="text-sm">
                {phone.cancellationDate ? new Date(phone.cancellationDate).toLocaleDateString('zh-CN') : '-'}
              </td>
              <td>{phone.vendor}</td>
              <td>{phone.purpose}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onOpenDetails(phone.phoneNumber)}
                    className="h-8 w-8"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">详情</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onOpenEdit(phone.phoneNumber)}
                    className="h-8 w-8"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                    <span className="sr-only">编辑</span>
                  </Button>
                  {/* 分配/回收按钮 */}
                  {phone.currentUserName ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onOpenUnassign(phone.phoneNumber)}
                      disabled={isUnassigning}
                      className="h-8 px-2 text-xs"
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
                      disabled={isAssigning}
                      className="h-8 px-2 text-xs"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "分配"
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {phoneNumbers.length === 0 && !isLoading && (
            <tr>
              <td colSpan={10} className="text-center py-4">
                没有找到符合条件的手机号码
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}; 