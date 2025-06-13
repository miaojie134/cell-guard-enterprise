import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UpdatePhoneRequest, PhoneStatus } from "@/config/api/phone";

interface PhoneNumber {
  phoneNumber: string;
  purpose: string;
  vendor: string;
  remarks?: string;
  status: string;
  cancellationDate?: string;
}

interface EditPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneData: PhoneNumber | null;
  onSubmit: (phoneNumber: string, data: UpdatePhoneRequest) => void;
  isUpdating: boolean;
}

export const EditPhoneDialog: React.FC<EditPhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneData,
  onSubmit,
  isUpdating,
}) => {
  const [formData, setFormData] = useState({
    purpose: "",
    vendor: "",
    remarks: "",
    status: "idle" as PhoneStatus,
    cancellationDate: "",
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 当phoneData变化时更新表单数据
  useEffect(() => {
    if (phoneData) {
      setFormData({
        purpose: phoneData.purpose,
        vendor: phoneData.vendor,
        remarks: phoneData.remarks || "",
        status: phoneData.status as PhoneStatus,
        cancellationDate: phoneData.cancellationDate || "",
      });
      setFormErrors({});
    }
  }, [phoneData]);

  // 编辑表单验证
  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!phoneData) {
      errors.general = '找不到要编辑的手机号码';
      setFormErrors(errors);
      return false;
    }
    
    // 如果状态改为已注销，必须填写注销日期
    if (formData.status === 'deactivated' && !formData.cancellationDate) {
      errors.cancellationDate = '设置为已注销状态时必须选择注销日期';
    }
    
    // 检查是否有字段被修改
    const hasChanges = 
      formData.purpose !== phoneData.purpose ||
      formData.vendor !== phoneData.vendor ||
      formData.remarks !== (phoneData.remarks || "") ||
      formData.status !== phoneData.status ||
      formData.cancellationDate !== (phoneData.cancellationDate || "");
    
    if (!hasChanges) {
      errors.general = '请至少修改一个字段';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEditForm() || !phoneData) {
      return;
    }
    
    // 只发送已修改的字段
    const updateRequest: UpdatePhoneRequest = {};
    
    if (formData.purpose !== phoneData.purpose) {
      updateRequest.purpose = formData.purpose;
    }
    if (formData.vendor !== phoneData.vendor) {
      updateRequest.vendor = formData.vendor;
    }
    if (formData.remarks !== (phoneData.remarks || "")) {
      updateRequest.remarks = formData.remarks;
    }
    if (formData.status !== phoneData.status) {
      updateRequest.status = formData.status;
    }
    
    // 只有当前状态为已注销时，才可能发送注销日期字段
    if (formData.status === 'deactivated') {
      if (formData.status !== phoneData.status || formData.cancellationDate !== (phoneData.cancellationDate || "")) {
        updateRequest.cancellationDate = formData.cancellationDate;
      }
    }
    
    onSubmit(phoneData.phoneNumber, updateRequest);
  };

  // 表单变化处理
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除相关字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (formErrors.general) {
      setFormErrors(prev => ({ ...prev, general: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑手机号码</DialogTitle>
          <DialogDescription>
            修改手机号码信息
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {formErrors.general && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {formErrors.general}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">手机号码</Label>
              <Input
                id="phoneNumber"
                value={phoneData?.phoneNumber || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">运营商</Label>
              <Select 
                value={formData.vendor} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, vendor: value }));
                  if (formErrors.general) {
                    setFormErrors(prev => ({ ...prev, general: '' }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择运营商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="中国移动">中国移动</SelectItem>
                  <SelectItem value="中国联通">中国联通</SelectItem>
                  <SelectItem value="中国电信">中国电信</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">用途</Label>
              <Input
                id="purpose"
                name="purpose"
                placeholder="请输入号码用途"
                value={formData.purpose}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">号码状态</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    status: value as PhoneStatus,
                    // 如果从已注销状态切换到其他状态，清空注销日期
                    cancellationDate: value === 'deactivated' ? prev.cancellationDate : ""
                  }));
                  if (formErrors.general) {
                    setFormErrors(prev => ({ ...prev, general: '' }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">闲置</SelectItem>
                  <SelectItem value="pending_deactivation">待注销</SelectItem>
                  <SelectItem value="deactivated">已注销</SelectItem>
                  <SelectItem value="user_reported">待核实-用户报告</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 当状态为已注销时，显示注销日期选择器 */}
            {formData.status === 'deactivated' && (
              <div className="space-y-2">
                <Label htmlFor="cancellationDate">注销日期 *</Label>
                <Input
                  id="cancellationDate"
                  name="cancellationDate"
                  type="date"
                  value={formData.cancellationDate}
                  onChange={handleFormChange}
                  required
                  className={formErrors.cancellationDate ? "border-red-500" : ""}
                />
                {formErrors.cancellationDate && (
                  <p className="text-sm text-red-500">{formErrors.cancellationDate}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="remarks">备注</Label>
              <Input
                id="remarks"
                name="remarks"
                placeholder="请输入备注信息"
                value={formData.remarks}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
