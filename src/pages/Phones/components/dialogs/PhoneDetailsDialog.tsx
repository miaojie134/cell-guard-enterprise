import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

interface PhoneDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneData: PhoneNumber | null;
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

export const PhoneDetailsDialog: React.FC<PhoneDetailsDialogProps> = ({
  open,
  onOpenChange,
  phoneData,
}) => {
  if (!phoneData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>手机号码详情</DialogTitle>
          <DialogDescription>
            查看手机号码的完整信息和使用历史记录
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-medium mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">手机号码</Label>
                <p className="font-medium">{phoneData.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">状态</Label>
                <p>{getStatusText(phoneData.status)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">办卡人</Label>
                <p>{phoneData.applicantName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">当前使用人</Label>
                <p>{phoneData.currentUserName || "-"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">运营商</Label>
                <p>{phoneData.vendor}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">办卡日期</Label>
                <p>{phoneData.applicationDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">创建时间</Label>
                <p>{phoneData.createdAt}</p>
              </div>
              {phoneData.cancellationDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">注销日期</Label>
                  <p>{phoneData.cancellationDate}</p>
                </div>
              )}
              <div className="col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">用途</Label>
                <p>{phoneData.purpose || "-"}</p>
              </div>
              {phoneData.remarks && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">备注</Label>
                  <p>{phoneData.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* 使用历史记录 */}
          {phoneData.usageHistory && phoneData.usageHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">使用历史记录</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">员工</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">开始日期</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">结束日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {phoneData.usageHistory
                      .sort((a, b) => {
                        // 首先按使用状态排序：正在使用中的(endDate为空)排在前面
                        const aIsActive = !a.endDate || a.endDate === '';
                        const bIsActive = !b.endDate || b.endDate === '';
                        
                        if (aIsActive && !bIsActive) return -1;
                        if (!aIsActive && bIsActive) return 1;
                        
                        // 相同状态下，按开始时间降序排序（最新的在前）
                        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                      })
                      .map((usage, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">{usage.employeeId}</td>
                        <td className="px-3 py-2">{usage.startDate}</td>
                        <td className="px-3 py-2">{usage.endDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
