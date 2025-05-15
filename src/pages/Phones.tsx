import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneNumber } from "@/types";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, FileText, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Phones = () => {
  const { 
    getPhoneNumbers, 
    getPhoneById, 
    addPhone, 
    updatePhone, 
    employees, 
    getPhoneHistoryByPhoneId,
    assignPhone,
    recoverPhone
  } = useData();
  const { toast } = useToast();
  
  // State
  const [searchParams, setSearchParams] = useState({
    query: "",
    filters: {
      status: "all",
      registrantStatus: "all",
    },
    page: 1,
    pageSize: 10,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [currentPhoneId, setCurrentPhoneId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<PhoneNumber>>({
    number: "",
    registrant: "",
    registrantId: "",
    registrationDate: new Date().toISOString().split("T")[0],
    provider: "",
    status: "inactive",
    notes: "",
  });

  // Get phone data
  const { data: phones, total } = getPhoneNumbers(searchParams);
  const totalPages = Math.ceil(total / searchParams.pageSize);
  const currentPhone = currentPhoneId ? getPhoneById(currentPhoneId) : null;
  
  // Filter inactive phones for assignment
  const availablePhones = phones.filter(phone => phone.status === "inactive");
  
  // Filter active employees for assignment
  const activeEmployees = employees.filter(emp => emp.status === "active");

  // Handle search and filters
  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dialog handlers
  const openAddDialog = () => {
    setFormData({
      number: "",
      registrant: "",
      registrantId: "",
      registrationDate: new Date().toISOString().split("T")[0],
      provider: "",
      status: "inactive",
      notes: "",
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (id: string) => {
    const phone = getPhoneById(id);
    if (phone) {
      setCurrentPhoneId(id);
      setFormData({
        number: phone.number,
        provider: phone.provider,
        status: phone.status,
        notes: phone.notes,
      });
      setShowEditDialog(true);
    }
  };

  const openDetailsDialog = (id: string) => {
    setCurrentPhoneId(id);
    setShowDetailsDialog(true);
  };
  
  const openAssignDialog = (id: string) => {
    setCurrentPhoneId(id);
    setSelectedEmployeeId("");
    setShowAssignDialog(true);
  };

  const openRecoverDialog = (id: string) => {
    setCurrentPhoneId(id);
    setShowRecoverDialog(true);
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find selected employee
    const selectedEmployee = employees.find(emp => emp.id === formData.registrantId);
    
    addPhone({
      number: formData.number || "",
      registrant: selectedEmployee?.name || formData.registrant || "",
      registrantId: selectedEmployee?.employeeId || "",
      registrantStatus: selectedEmployee?.status || "active",
      registrationDate: formData.registrationDate || new Date().toISOString().split("T")[0],
      provider: formData.provider || "",
      status: formData.status as "active" | "inactive" | "pending" | "cancelled",
      notes: formData.notes,
    });
    setShowAddDialog(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPhoneId) {
      updatePhone(currentPhoneId, {
        provider: formData.provider,
        status: formData.status as "active" | "inactive" | "pending" | "cancelled",
        notes: formData.notes,
      });
      setShowEditDialog(false);
    }
  };
  
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPhoneId && selectedEmployeeId) {
      assignPhone(currentPhoneId, selectedEmployeeId);
      
      const phone = getPhoneById(currentPhoneId);
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      
      toast({
        title: "分配成功",
        description: `成功将号码 ${phone?.number} 分配给 ${employee?.name}`,
      });
      
      setShowAssignDialog(false);
      setSelectedEmployeeId("");
    }
  };
  
  const handleRecoverPhone = () => {
    if (currentPhoneId) {
      const phone = getPhoneById(currentPhoneId);
      recoverPhone(currentPhoneId);
      
      toast({
        title: "回收成功",
        description: `成功从 ${phone?.currentUser || "用户"} 回收号码 ${phone?.number}`,
      });
      
      setShowRecoverDialog(false);
    }
  };

  return (
    <MainLayout title="号码管理">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>手机号码列表</CardTitle>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
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
                value={searchParams.filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="号码状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">在用</SelectItem>
                  <SelectItem value="inactive">闲置</SelectItem>
                  <SelectItem value="pending">待开通</SelectItem>
                  <SelectItem value="cancelled">已注销</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.filters.registrantStatus}
                onValueChange={(value) => handleFilterChange("registrantStatus", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="办卡人状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">已离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>号码</th>
                  <th>使用人</th>
                  <th>办卡人</th>
                  <th>办卡人状态</th>
                  <th>号码状态</th>
                  <th>办卡日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((phone) => (
                  <tr key={phone.id}>
                    <td>{phone.number}</td>
                    <td>{phone.currentUser || "-"}</td>
                    <td>{phone.registrant}</td>
                    <td>
                      <StatusBadge 
                        status={phone.registrantStatus} 
                        text={phone.registrantStatus === "active" ? "在职" : "已离职"} 
                      />
                    </td>
                    <td><StatusBadge status={phone.status} /></td>
                    <td>{phone.registrationDate}</td>
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
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">编辑</span>
                        </Button>
                        {phone.status === "inactive" ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openAssignDialog(phone.id)}
                            className="text-xs"
                          >
                            分配
                          </Button>
                        ) : phone.status === "active" ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openRecoverDialog(phone.id)}
                            className="text-xs"
                          >
                            回收
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {phones.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      没有找到符合条件的手机号码
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={searchParams.page}
            totalPages={totalPages}
            pageSize={searchParams.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            totalItems={total}
          />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">手机号码</Label>
                  <Input
                    id="number"
                    name="number"
                    placeholder="请输入手机号码"
                    value={formData.number}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDate">办卡日期</Label>
                  <Input
                    id="registrationDate"
                    name="registrationDate"
                    type="date"
                    value={formData.registrationDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrantId">选择办卡人</Label>
                  <Select
                    value={formData.registrantId}
                    onValueChange={(value) => handleSelectChange("registrantId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrant">或手动输入办卡人</Label>
                  <Input
                    id="registrant"
                    name="registrant"
                    placeholder="外部人员姓名"
                    value={formData.registrant}
                    onChange={handleFormChange}
                    disabled={!!formData.registrantId}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">供应商</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => handleSelectChange("provider", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="中国移动">中国移动</SelectItem>
                      <SelectItem value="中国联通">中国联通</SelectItem>
                      <SelectItem value="中国电信">中国电信</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">初始状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inactive">闲置</SelectItem>
                      <SelectItem value="active">在用</SelectItem>
                      <SelectItem value="pending">待开通</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="添加备注信息..."
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button type="submit">添加</Button>
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
                <Label>手机号码</Label>
                <Input value={formData.number} disabled />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">供应商</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => handleSelectChange("provider", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="中国移动">中国移动</SelectItem>
                      <SelectItem value="中国联通">中国联通</SelectItem>
                      <SelectItem value="中国电信">中国电信</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inactive">闲置</SelectItem>
                      <SelectItem value="active">在用</SelectItem>
                      <SelectItem value="pending">待开通</SelectItem>
                      <SelectItem value="cancelled">已注销</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="添加备注信息..."
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Phone Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>手机号码详情</DialogTitle>
          </DialogHeader>
          {currentPhone && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">号码</h4>
                    <p className="text-lg font-medium">{currentPhone.number}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">办卡人</h4>
                    <p className="text-lg font-medium">
                      {currentPhone.registrant}
                      {" "}
                      <StatusBadge 
                        status={currentPhone.registrantStatus} 
                        text={currentPhone.registrantStatus === "active" ? "在职" : "已离职"} 
                      />
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">当前使用人</h4>
                    <p className="text-lg font-medium">{currentPhone.currentUser || "未分配"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">状态</h4>
                    <p className="text-lg font-medium">
                      <StatusBadge status={currentPhone.status} />
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">供应商</h4>
                    <p className="text-lg font-medium">{currentPhone.provider}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">办卡日期</h4>
                    <p className="text-lg font-medium">{currentPhone.registrationDate}</p>
                  </div>
                </div>
              </div>
              
              {currentPhone.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">备注</h4>
                  <p className="text-sm mt-1">{currentPhone.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">使用历史</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>使用人</th>
                      <th>开始使用日期</th>
                      <th>结束使用日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPhoneId && getPhoneHistoryByPhoneId(currentPhoneId).map((history) => (
                      <tr key={history.id}>
                        <td>{history.userName}</td>
                        <td>{history.startDate}</td>
                        <td>{history.endDate || "-"}</td>
                      </tr>
                    ))}
                    {currentPhoneId && getPhoneHistoryByPhoneId(currentPhoneId).length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4">
                          暂无使用历史记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Assign Phone Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分配号码</DialogTitle>
            <DialogDescription>
              将号码分配给员工使用
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="space-y-4 py-2">
              {currentPhone && (
                <div className="p-3 bg-muted rounded-md text-sm mb-4">
                  <p><span className="font-medium">号码:</span> {currentPhone.number}</p>
                  <p><span className="font-medium">供应商:</span> {currentPhone.provider}</p>
                  <p><span className="font-medium">状态:</span> <StatusBadge status={currentPhone.status} /></p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="employeeId">选择员工</Label>
                <Select
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.length > 0 ? (
                      activeEmployees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employeeId} - {employee.department})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        无可用员工
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEmployeeId && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p><span className="font-medium">员工姓名:</span> {employees.find(emp => emp.id === selectedEmployeeId)?.name}</p>
                  <p><span className="font-medium">员工工号:</span> {employees.find(emp => emp.id === selectedEmployeeId)?.employeeId}</p>
                  <p><span className="font-medium">所属部门:</span> {employees.find(emp => emp.id === selectedEmployeeId)?.department}</p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowAssignDialog(false)}>
                取消
              </Button>
              <Button type="submit" disabled={!selectedEmployeeId}>分配</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Phone Recovery Confirmation Dialog */}
      <AlertDialog open={showRecoverDialog} onOpenChange={setShowRecoverDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认回收号码</AlertDialogTitle>
            <AlertDialogDescription>
              {currentPhone ? (
                <div className="space-y-2">
                  <p>您确定要回收以下号码吗？</p>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p><span className="font-medium">号码:</span> {currentPhone.number}</p>
                    <p><span className="font-medium">当前使用人:</span> {currentPhone.currentUser || "未分配"}</p>
                    <p><span className="font-medium">供应商:</span> {currentPhone.provider}</p>
                  </div>
                  <p>回收后，该号码将变为闲置状态，并清空使用人信息。</p>
                </div>
              ) : (
                <p>确定要回收选中的号码吗？</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecoverPhone}>确认回收</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Phones;
