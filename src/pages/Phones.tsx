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
import { Textarea } from "@/components/ui/textarea";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { EmployeeSelector, type Employee } from "@/components/EmployeeSelector";
import { Plus, FileText, Pencil, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePhoneNumbers, usePhoneNumber } from "@/hooks/usePhoneNumbers";
import { useEmployeesForSelector } from "@/hooks/useEmployees";
import { CreatePhoneRequest } from "@/config/api/phone";
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
  const [currentPhoneId, setCurrentPhoneId] = useState<string | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    phoneNumber: "",
    purpose: "",
    vendor: "",
    remarks: "",
    status: "闲置" as "闲置" | "在用" | "待注销" | "已注销" | "待核实-办卡人离职",
    applicationDate: new Date().toISOString().split('T')[0],
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 使用API hook获取数据
  const {
    phoneNumbers,
    pagination,
    isLoading,
    error,
    createPhone,
    updatePhone,
    deletePhone,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePhoneNumbers(searchParams);

  // 获取员工列表
  const { activeEmployees, isLoading: isLoadingEmployees, refreshEmployees } = useEmployeesForSelector({
    employmentStatus: 'Active',
    limit: 100,
  });

  // 获取当前选中的手机号码详情
  const { phoneNumber: currentPhone } = usePhoneNumber(currentPhoneId || "");

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
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      errors.employee = '请选择申请人';
    }
    
    if (!formData.purpose.trim()) {
      errors.purpose = '请输入号码用途';
    }
    
    if (!formData.vendor.trim()) {
      errors.vendor = '请选择运营商';
    }
    
    if (!formData.applicationDate) {
      errors.applicationDate = '请选择申请日期';
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
      status: "闲置",
      applicationDate: new Date().toISOString().split('T')[0],
    });
    setSelectedEmployee(null);
    setFormErrors({});
    setShowAddDialog(true);
  };

  const openEditDialog = (id: string) => {
    const phone = phoneNumbers.find(p => p.id === id);
    if (phone) {
      setCurrentPhoneId(id);
      setFormData({
        phoneNumber: phone.phoneNumber,
        purpose: phone.purpose,
        vendor: phone.vendor,
        remarks: phone.remarks || "",
        status: phone.status as "闲置" | "在用" | "待注销" | "已注销" | "待核实-办卡人离职",
        applicationDate: phone.applicationDate,
      });
      // 对于编辑，我们不需要员工选择器，因为申请人不应该被修改
      setShowEditDialog(true);
    }
  };

  const openDetailsDialog = (id: string) => {
    setCurrentPhoneId(id);
    setShowDetailsDialog(true);
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPhoneId) {
      updatePhone({
        id: currentPhoneId,
        data: {
          phoneNumber: formData.phoneNumber,
          purpose: formData.purpose,
          vendor: formData.vendor,
          remarks: formData.remarks,
          status: formData.status,
          updatedAt: new Date().toISOString(),
        },
      });
      setShowEditDialog(false);
      setCurrentPhoneId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确认删除此手机号码吗？')) {
      deletePhone(id);
    }
  };

  // 状态映射
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      '闲置': '闲置',
      '在用': '在用', 
      '待注销': '待注销',
      '已注销': '已注销',
      '待核实-办卡人离职': '待核实',
      '待核实-用户报告': '待核实',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: string): "active" | "inactive" | "pending" | "cancelled" | "risk" => {
    const variantMap: Record<string, "active" | "inactive" | "pending" | "cancelled" | "risk"> = {
      '闲置': 'inactive',
      '在用': 'active',
      '待注销': 'pending',
      '已注销': 'cancelled',
      '待核实-办卡人离职': 'risk',
      '待核实-用户报告': 'risk',
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
                  <SelectItem value="闲置">闲置</SelectItem>
                  <SelectItem value="在用">在用</SelectItem>
                  <SelectItem value="待注销">待注销</SelectItem>
                  <SelectItem value="已注销">已注销</SelectItem>
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
                            onClick={() => openDetailsDialog(phone.id)}
                            className="h-8 w-8"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">详情</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => openEditDialog(phone.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新手机号码</DialogTitle>
            <DialogDescription>
              请填写新手机号码的详细信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="space-y-4 py-2">
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
                <Label>申请人 *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <EmployeeSelector
                      value={selectedEmployee}
                      onChange={setSelectedEmployee}
                      employees={activeEmployees}
                      isLoading={isLoadingEmployees}
                      placeholder="搜索员工姓名或工号..."
                      required
                      error={formErrors.employee}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={refreshEmployees}
                    disabled={isLoadingEmployees}
                    title="刷新员工列表"
                  >
                    {isLoadingEmployees ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="applicationDate">申请日期</Label>
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
                  required
                  className={formErrors.purpose ? "border-red-500" : ""}
                />
                {formErrors.purpose && (
                  <p className="text-sm text-red-500">{formErrors.purpose}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">初始状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    status: value as "闲置" | "在用" | "待注销" | "已注销" | "待核实-办卡人离职"
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="闲置">闲置</SelectItem>
                    <SelectItem value="在用">在用</SelectItem>
                    <SelectItem value="待注销">待注销</SelectItem>
                    <SelectItem value="已注销">已注销</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
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
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">手机号码</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="请输入手机号码"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  required
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">号码状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    status: value as "闲置" | "在用" | "待注销" | "已注销" | "待核实-办卡人离职"
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="闲置">闲置</SelectItem>
                    <SelectItem value="在用">在用</SelectItem>
                    <SelectItem value="待注销">待注销</SelectItem>
                    <SelectItem value="已注销">已注销</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>手机号码详情</DialogTitle>
          </DialogHeader>
          {currentPhone && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">手机号码</Label>
                  <p>{currentPhone.phoneNumber}</p>
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
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Phones;
