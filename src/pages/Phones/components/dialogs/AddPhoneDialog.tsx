import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { EmployeeSelector, type Employee } from "@/components/EmployeeSelector";
import { Loader2 } from "lucide-react";
import { CreatePhoneRequest, PhoneStatus } from "@/config/api/phone";
import { VENDORS } from "@/utils/phoneUtils";

interface AddPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePhoneRequest) => void;
  isCreating: boolean;
}

export const AddPhoneDialog: React.FC<AddPhoneDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    vendor: "",
    remarks: "",
    status: "idle" as PhoneStatus,
    applicationDate: new Date().toISOString().split('T')[0],
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dialogKey, setDialogKey] = useState(0);

  // 监听对话框打开状态，每次打开时重置表单并生成新的key
  useEffect(() => {
    if (open) {
      resetForm();
      setDialogKey(prev => prev + 1); // 生成新的key强制重新渲染
    }
  }, [open]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      phoneNumber: "",
      vendor: "",
      remarks: "",
      status: "idle",
      applicationDate: new Date().toISOString().split('T')[0],
    });
    setSelectedEmployee(null);
    setFormErrors({});
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = '请输入手机号码';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = '请输入有效的手机号码';
    }
    
    if (!selectedEmployee) {
      errors.employee = '请选择办卡人';
    }
    
    if (!formData.vendor.trim()) {
      errors.vendor = '请选择运营商';
    }
    
    if (!formData.applicationDate) {
      errors.applicationDate = '请选择办卡日期';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 表单变化处理
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除相关字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const createRequest: CreatePhoneRequest = {
      phoneNumber: formData.phoneNumber,
      applicantEmployeeId: selectedEmployee!.employeeId,
      applicationDate: formData.applicationDate,
      status: formData.status,
      vendor: formData.vendor,
      remarks: formData.remarks,
    };
    
    onSubmit(createRequest);
  };

  // 处理对话框状态变化
  const handleOpenChange = (newOpen: boolean) => {
    // 如果正在创建中，不允许关闭对话框
    if (!newOpen && isCreating) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加新手机号码</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">手机号码</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="请输入手机号码"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                required
                className={formErrors.phoneNumber ? "border-red-500" : ""}
              />
              {formErrors.phoneNumber && (
                <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>办卡人 *</Label>
              <EmployeeSelector
                key={dialogKey}
                value={selectedEmployee}
                onChange={(employee) => {
                  setSelectedEmployee(employee);
                  if (formErrors.employee) {
                    setFormErrors(prev => ({ ...prev, employee: '' }));
                  }
                }}
                placeholder="搜索员工姓名..."
                required
                error={formErrors.employee}
                compact={true}
                enableDynamicSearch={true}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="applicationDate">办卡日期</Label>
              <Input
                id="applicationDate"
                name="applicationDate"
                type="date"
                value={formData.applicationDate}
                onChange={handleFormChange}
                required
                className={formErrors.applicationDate ? "border-red-500" : ""}
              />
              {formErrors.applicationDate && (
                <p className="text-sm text-red-500">{formErrors.applicationDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendor">运营商</Label>
              <Select 
                value={formData.vendor} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, vendor: value }));
                  if (formErrors.vendor) {
                    setFormErrors(prev => ({ ...prev, vendor: '' }));
                  }
                }}
              >
                <SelectTrigger className={formErrors.vendor ? "border-red-500" : ""}>
                  <SelectValue placeholder="选择运营商" />
                </SelectTrigger>
                <SelectContent>
                  {VENDORS.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.vendor && (
                <p className="text-sm text-red-500">{formErrors.vendor}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">初始状态</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  status: value as PhoneStatus
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">闲置</SelectItem>
                  <SelectItem value="pending_deactivation">待注销</SelectItem>
                  <SelectItem value="suspended">停机保号</SelectItem>
                  <SelectItem value="card_replacing">补卡中</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                "添加"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 