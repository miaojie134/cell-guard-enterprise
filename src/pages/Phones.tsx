import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { EmployeeSelector, type Employee } from "@/components/EmployeeSelector";
import { Plus, FileText, Pencil, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePhoneNumbers, usePhoneNumber } from "@/hooks/usePhoneNumbers";
import { CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest, PhoneStatus } from "@/config/api/phone";
import { Link } from "react-router-dom";

const Phones = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // State
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    applicantStatus: "",
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");
  
  // 表单状态
  const [formData, setFormData] = useState({
    phoneNumber: "",
    purpose: "",
    vendor: "",
    remarks: "",
    status: "idle" as PhoneStatus,
    applicationDate: new Date().toISOString().split('T')[0],
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 分配表单状态
  const [assignFormData, setAssignFormData] = useState({
    assignmentDate: new Date().toISOString().split('T')[0],
    purpose: "",
  });
  const [assignSelectedEmployee, setAssignSelectedEmployee] = useState<Employee | null>(null);
  const [assignFormErrors, setAssignFormErrors] = useState<Record<string, string>>({});

  // 使用API hook获取数据
  const {
    phoneNumbers,
    pagination,
    isLoading,
    error,
    createPhone,
    updatePhone,
    deletePhone,
    assignPhone,
    unassignPhone,
    isCreating,
    isUpdating,
    isDeleting,
    isAssigning,
    isUnassigning,
  } = usePhoneNumbers(searchParams);

  // 获取当前选中的手机号码详情
  const { phoneNumber: currentPhone } = usePhoneNumber(currentPhoneNumber || "");

  // 检查认证状态
  if (!isAuthenticated) {
    return (
      <MainLayout title="号码管理">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              需要登录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>您需要先登录才能访问号码管理功能。</p>
            <Link to="/login">
              <Button>前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // Handle search and filters
  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, search: query, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams(prev => ({ ...prev, limit: pageSize, page: 1 }));
  };

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除相关字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  // Dialog handlers
  const openAddDialog = () => {
    setFormData({
      phoneNumber: "",
      purpose: "",
      vendor: "",
      remarks: "",
      status: "idle",
      applicationDate: new Date().toISOString().split('T')[0],
    });
    setSelectedEmployee(null);
    setFormErrors({});
    setShowAddDialog(true);
  };

  const openEditDialog = (phoneNumber: string) => {
    const phone = phoneNumbers.find(p => p.phoneNumber === phoneNumber);
    if (phone) {
      setCurrentPhoneNumber(phoneNumber);
      setFormData({
        phoneNumber: phone.phoneNumber,
        purpose: phone.purpose,
        vendor: phone.vendor,
        remarks: phone.remarks || "",
        status: phone.status as PhoneStatus,
        applicationDate: phone.applicationDate,
      });
      // 清除之前的错误信息
      setFormErrors({});
      // 对于编辑，我们不需要员工选择器，因为办卡人不应该被修改
      setShowEditDialog(true);
    }
  };

  const openDetailsDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowDetailsDialog(true);
  };

  const openAssignDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setAssignFormData({
      assignmentDate: new Date().toISOString().split('T')[0],
      purpose: "",
    });
    setAssignSelectedEmployee(null);
    setAssignFormErrors({});
    setShowAssignDialog(true);
  };

  const openUnassignDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowUnassignDialog(true);
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const createRequest: CreatePhoneRequest = {
      phoneNumber: formData.phoneNumber,
      applicantEmployeeId: selectedEmployee!.employeeId,
      applicationDate: formData.applicationDate,
      status: formData.status,
      purpose: formData.purpose,
      vendor: formData.vendor,
      remarks: formData.remarks,
    };
    
    createPhone(createRequest);
    setShowAddDialog(false);
  };

  // 编辑表单验证
  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // 获取原始数据
    const originalPhone = phoneNumbers.find(p => p.phoneNumber === currentPhoneNumber);
    if (!originalPhone) {
      errors.general = '找不到要编辑的手机号码';
      setFormErrors(errors);
      return false;
    }
    
    // 检查是否有字段被修改
    const hasChanges = 
      formData.purpose !== originalPhone.purpose ||
      formData.vendor !== originalPhone.vendor ||
      formData.remarks !== (originalPhone.remarks || "") ||
      formData.status !== originalPhone.status;
    
    if (!hasChanges) {
      errors.general = '请至少修改一个字段';
      setFormErrors(errors);
      return false;
    }
    
    setFormErrors({});
    return true;
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }
    
    if (currentPhoneNumber) {
      // 获取原始数据以比较变化
      const originalPhone = phoneNumbers.find(p => p.phoneNumber === currentPhoneNumber);
      if (!originalPhone) return;
      
      // 只发送已修改的字段
      const updateRequest: UpdatePhoneRequest = {};
      
      if (formData.purpose !== originalPhone.purpose) {
        updateRequest.purpose = formData.purpose;
      }
      if (formData.vendor !== originalPhone.vendor) {
        updateRequest.vendor = formData.vendor;
      }
      if (formData.remarks !== (originalPhone.remarks || "")) {
        updateRequest.remarks = formData.remarks;
      }
      if (formData.status !== originalPhone.status) {
        updateRequest.status = formData.status;
      }
      
      updatePhone({
        phoneNumber: currentPhoneNumber,
        data: updateRequest,
      });
      setShowEditDialog(false);
      setCurrentPhoneNumber("");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确认删除此手机号码吗？')) {
      deletePhone(id);
    }
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
    
    assignPhone({ phoneNumber: currentPhoneNumber, data: assignRequest });
    setShowAssignDialog(false);
  };

  // 处理回收提交
  const handleUnassignSubmit = () => {
    const unassignRequest: UnassignPhoneRequest = {
      reclaimDate: new Date().toISOString().split('T')[0],
    };
    
    unassignPhone({ phoneNumber: currentPhoneNumber, data: unassignRequest });
    setShowUnassignDialog(false);
  };

  // 状态映射
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

  return (
    <MainLayout title="号码管理">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>手机号码列表</CardTitle>
          <Button onClick={openAddDialog} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            添加号码
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="搜索号码、使用人、办卡人..."
            />
            <div className="flex space-x-2">
              <Select
                value={searchParams.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="号码状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="idle">闲置</SelectItem>
                  <SelectItem value="in_use">使用中</SelectItem>
                  <SelectItem value="pending_deactivation">待注销</SelectItem>
                  <SelectItem value="deactivated">已注销</SelectItem>
                  <SelectItem value="user_reported">待核实-用户报告</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.applicantStatus || "all"}
                onValueChange={(value) => handleFilterChange("applicantStatus", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="办卡人状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="Active">在职</SelectItem>
                  <SelectItem value="Departed">已离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                加载失败: {error.message}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>号码</th>
                    <th>当前使用人</th>
                    <th>办卡人</th>
                    <th>办卡人状态</th>
                    <th>号码状态</th>
                    <th>运营商</th>
                    <th>用途</th>
                    <th>操作</th>
                  </tr>
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
                      <td>
                        <StatusBadge 
                          status={getStatusVariant(phone.status)} 
                          text={getStatusText(phone.status)} 
                        />
                      </td>
                      <td>{phone.vendor}</td>
                      <td>{phone.purpose}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => openDetailsDialog(phone.phoneNumber)}
                            className="h-8 w-8"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">详情</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => openEditDialog(phone.phoneNumber)}
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
                              onClick={() => openUnassignDialog(phone.phoneNumber)}
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
                              onClick={() => openAssignDialog(phone.phoneNumber)}
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
                      <td colSpan={8} className="text-center py-4">
                        没有找到符合条件的手机号码
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          {pagination && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              totalItems={pagination.totalItems}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Add Phone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加新手机号码</DialogTitle>
            {/* <DialogDescription>
              请填写新手机号码的详细信息
            </DialogDescription> */}
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
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
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  placeholder="搜索员工姓名或工号..."
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
                    <SelectItem value="中国移动">中国移动</SelectItem>
                    <SelectItem value="中国联通">中国联通</SelectItem>
                    <SelectItem value="中国电信">中国电信</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.vendor && (
                  <p className="text-sm text-red-500">{formErrors.vendor}</p>
                )}
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
                    <SelectItem value="in_use">使用中</SelectItem>
                    <SelectItem value="pending_deactivation">待注销</SelectItem>
                    <SelectItem value="deactivated">已注销</SelectItem>
                    <SelectItem value="user_reported">待核实-用户报告</SelectItem>
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
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
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

      {/* Edit Phone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑手机号码</DialogTitle>
            <DialogDescription>
              修改手机号码信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
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
                  name="phoneNumber"
                  placeholder="请输入手机号码"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">运营商</Label>
                <Select value={formData.vendor} onValueChange={(value) => setFormData(prev => ({ ...prev, vendor: value }))}>
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
                    <SelectItem value="deactivated">已注销</SelectItem>
                    <SelectItem value="user_reported">待核实-用户报告</SelectItem>
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
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
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

      {/* Details Phone Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>手机号码详情</DialogTitle>
          </DialogHeader>
          {currentPhone && (
            <div className="space-y-6 py-2">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">手机号码</Label>
                    <p className="font-medium">{currentPhone.phoneNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">状态</Label>
                    <p>{getStatusText(currentPhone.status)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">办卡人</Label>
                    <p>{currentPhone.applicantName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">办卡人工号</Label>
                    <p>{currentPhone.applicantEmployeeId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">当前使用人</Label>
                    <p>{currentPhone.currentUserName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">运营商</Label>
                    <p>{currentPhone.vendor}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">办卡日期</Label>
                    <p>{currentPhone.applicationDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">创建时间</Label>
                    <p>{currentPhone.createdAt}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">用途</Label>
                    <p>{currentPhone.purpose}</p>
                  </div>
                  {currentPhone.remarks && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">备注</Label>
                      <p>{currentPhone.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 使用历史记录 */}
              {currentPhone.usageHistory && currentPhone.usageHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">使用历史记录</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">员工工号</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">开始日期</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">结束日期</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentPhone.usageHistory
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
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Phone Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>分配手机号码</DialogTitle>
            <DialogDescription>
              将手机号码 {currentPhoneNumber} 分配给员工使用
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>使用人 *</Label>
                <EmployeeSelector
                  value={assignSelectedEmployee}
                  onChange={setAssignSelectedEmployee}
                  placeholder="搜索员工姓名或工号..."
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
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
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

      {/* Unassign Phone Dialog */}
      <Dialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>回收手机号码</DialogTitle>
            <DialogDescription>
              确认要回收手机号码 {currentPhoneNumber} 吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              回收后，该号码将变为闲置状态，当前使用人信息将被清空。此操作不可撤销。
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowUnassignDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleUnassignSubmit} 
              disabled={isUnassigning}
              variant="destructive"
            >
              {isUnassigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  回收中...
                </>
              ) : (
                "确认回收"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Phones;
