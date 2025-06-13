import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeSelector, type Employee } from "@/components/EmployeeSelector";
import { Loader2 } from "lucide-react";
import { AssignPhoneRequest } from "@/config/api/phone";

interface AssignPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSubmit: (phoneNumber: string, data: AssignPhoneRequest) => void;
  isAssigning: boolean;
}

export const AssignPhoneDialog: React.FC<AssignPhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneNumber,
  onSubmit,
  isAssigning,
}) => {
  const [assignFormData, setAssignFormData] = useState({
    assignmentDate: new Date().toISOString().split('T')[0],
    purpose: "",
  });
  const [assignSelectedEmployee, setAssignSelectedEmployee] = useState<Employee | null>(null);
  const [assignFormErrors, setAssignFormErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    setAssignFormData({
      assignmentDate: new Date().toISOString().split('T')[0],
      purpose: "",
    });
    setAssignSelectedEmployee(null);
    setAssignFormErrors({});
  };

  // 分配表单验证
  const validateAssignForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!assignSelectedEmployee) {
      errors.employee = '请选择使用人';
    }
    
    if (!assignFormData.purpose.trim()) {
      errors.purpose = '请输入使用用途';
    }
    
    if (!assignFormData.assignmentDate) {
      errors.assignmentDate = '请选择分配日期';
    }
    
    setAssignFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理分配提交
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAssignForm()) {
      return;
    }
    
    const assignRequest: AssignPhoneRequest = {
      assignmentDate: assignFormData.assignmentDate,
      employeeId: assignSelectedEmployee!.employeeId,
      purpose: assignFormData.purpose,
    };
    
    onSubmit(phoneNumber, assignRequest);
  };

  // 处理对话框状态变化
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isAssigning) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>分配手机号码</DialogTitle>
          <DialogDescription>
            将手机号码 {phoneNumber} 分配给员工使用
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAssignSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>使用人 *</Label>
              <EmployeeSelector
                value={assignSelectedEmployee}
                onChange={(employee) => {
                  setAssignSelectedEmployee(employee);
                  if (assignFormErrors.employee) {
                    setAssignFormErrors(prev => ({ ...prev, employee: '' }));
                  }
                }}
                placeholder="搜索员工姓名..."
                required
                error={assignFormErrors.employee}
                compact={true}
                enableDynamicSearch={true}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignmentDate">分配日期</Label>
              <Input
                id="assignmentDate"
                name="assignmentDate"
                type="date"
                value={assignFormData.assignmentDate}
                onChange={(e) => {
                  setAssignFormData(prev => ({ ...prev, assignmentDate: e.target.value }));
                  if (assignFormErrors.assignmentDate) {
                    setAssignFormErrors(prev => ({ ...prev, assignmentDate: '' }));
                  }
                }}
                required
                className={assignFormErrors.assignmentDate ? "border-red-500" : ""}
              />
              {assignFormErrors.assignmentDate && (
                <p className="text-sm text-red-500">{assignFormErrors.assignmentDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignPurpose">使用用途</Label>
              <Input
                id="assignPurpose"
                name="purpose"
                placeholder="请输入使用用途"
                value={assignFormData.purpose}
                onChange={(e) => {
                  setAssignFormData(prev => ({ ...prev, purpose: e.target.value }));
                  if (assignFormErrors.purpose) {
                    setAssignFormErrors(prev => ({ ...prev, purpose: '' }));
                  }
                }}
                required
                className={assignFormErrors.purpose ? "border-red-500" : ""}
              />
              {assignFormErrors.purpose && (
                <p className="text-sm text-red-500">{assignFormErrors.purpose}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分配中...
                </>
              ) : (
                "确认分配"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
