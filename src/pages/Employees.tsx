
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Edit, ExternalLink } from "lucide-react";

const Employees = () => {
  const { getEmployees, getEmployeeById, addEmployee, updateEmployee } = useData();
  
  // State
  const [searchParams, setSearchParams] = useState({
    query: "",
    filters: {
      status: "",
      department: "",
    },
    page: 1,
    pageSize: 10,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    employeeId: "",
    name: "",
    department: "",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
  });

  // Get employee data
  const { data: employees, total } = getEmployees(searchParams);
  const totalPages = Math.ceil(total / searchParams.pageSize);
  const currentEmployee = currentEmployeeId ? getEmployeeById(currentEmployeeId) : null;

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
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dialog handlers
  const openAddDialog = () => {
    setFormData({
      employeeId: "",
      name: "",
      department: "",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (id: string) => {
    const employee = getEmployeeById(id);
    if (employee) {
      setCurrentEmployeeId(id);
      setFormData({
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        status: employee.status,
        joinDate: employee.joinDate,
        leaveDate: employee.leaveDate,
      });
      setShowEditDialog(true);
    }
  };

  const openDetailsDialog = (id: string) => {
    setCurrentEmployeeId(id);
    setShowDetailsDialog(true);
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      employeeId: formData.employeeId || "",
      name: formData.name || "",
      department: formData.department || "",
      status: formData.status as "active" | "inactive",
      joinDate: formData.joinDate || new Date().toISOString().split("T")[0],
    });
    setShowAddDialog(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEmployeeId) {
      const updates: Partial<Employee> = {
        department: formData.department,
        status: formData.status as "active" | "inactive",
      };
      
      // Only add leaveDate if status is inactive
      if (formData.status === "inactive" && !formData.leaveDate) {
        updates.leaveDate = new Date().toISOString().split("T")[0];
      }
      
      updateEmployee(currentEmployeeId, updates);
      setShowEditDialog(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      status: value as "active" | "inactive",
      // If changing to inactive, set leaveDate to today if not already set
      leaveDate: value === "inactive" ? (prev.leaveDate || new Date().toISOString().split("T")[0]) : prev.leaveDate,
    }));
  };

  return (
    <MainLayout title="员工管理">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>员工列表</CardTitle>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            添加员工
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="搜索员工姓名、工号..."
            />
            <div className="flex space-x-2">
              <Select
                value={searchParams.filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="在职状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={searchParams.filters.department}
                onValueChange={(value) => handleFilterChange("department", value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部部门</SelectItem>
                  <SelectItem value="市场部">市场部</SelectItem>
                  <SelectItem value="销售部">销售部</SelectItem>
                  <SelectItem value="财务部">财务部</SelectItem>
                  <SelectItem value="IT部">IT部</SelectItem>
                  <SelectItem value="人力资源部">人力资源部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>工号</th>
                  <th>姓名</th>
                  <th>部门</th>
                  <th>状态</th>
                  <th>入职日期</th>
                  <th>离职日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId}</td>
                    <td>{employee.name}</td>
                    <td>{employee.department}</td>
                    <td>
                      <StatusBadge 
                        status={employee.status} 
                        text={employee.status === "active" ? "在职" : "离职"}
                      />
                    </td>
                    <td>{employee.joinDate}</td>
                    <td>{employee.leaveDate || "-"}</td>
                    <td>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDetailsDialog(employee.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(employee.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      没有找到符合条件的员工
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
      
      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新员工</DialogTitle>
            <DialogDescription>
              请填写新员工的详细信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">工号</Label>
                  <Input
                    id="employeeId"
                    name="employeeId"
                    placeholder="请输入工号"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="请输入姓名"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="市场部">市场部</SelectItem>
                      <SelectItem value="销售部">销售部</SelectItem>
                      <SelectItem value="财务部">财务部</SelectItem>
                      <SelectItem value="IT部">IT部</SelectItem>
                      <SelectItem value="人力资源部">人力资源部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">入职日期</Label>
                  <Input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
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
      
      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑员工信息</DialogTitle>
            <DialogDescription>
              修改员工的部门和在职状态
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>员工信息</Label>
                <div className="p-2 bg-muted rounded-md">
                  <p><span className="font-medium">工号:</span> {formData.employeeId}</p>
                  <p><span className="font-medium">姓名:</span> {formData.name}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="市场部">市场部</SelectItem>
                    <SelectItem value="销售部">销售部</SelectItem>
                    <SelectItem value="财务部">财务部</SelectItem>
                    <SelectItem value="IT部">IT部</SelectItem>
                    <SelectItem value="人力资源部">人力资源部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">在职状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">在职</SelectItem>
                      <SelectItem value="inactive">离职</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.status === "inactive" && (
                  <div className="space-y-2">
                    <Label htmlFor="leaveDate">离职日期</Label>
                    <Input
                      id="leaveDate"
                      name="leaveDate"
                      type="date"
                      value={formData.leaveDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                )}
              </div>
              
              {formData.status === "inactive" && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  注意: 标记员工为离职状态后，系统将自动标记其办理的手机号码为风险状态。
                </div>
              )}
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
      
      {/* Employee Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>员工详情</DialogTitle>
          </DialogHeader>
          {currentEmployee && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">工号</h4>
                  <p className="text-lg font-medium">{currentEmployee.employeeId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">姓名</h4>
                  <p className="text-lg font-medium">{currentEmployee.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">部门</h4>
                  <p className="text-lg font-medium">{currentEmployee.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">状态</h4>
                  <p className="text-lg font-medium">
                    <StatusBadge 
                      status={currentEmployee.status} 
                      text={currentEmployee.status === "active" ? "在职" : "离职"} 
                    />
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">入职日期</h4>
                  <p className="text-lg font-medium">{currentEmployee.joinDate}</p>
                </div>
                {currentEmployee.leaveDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">离职日期</h4>
                    <p className="text-lg font-medium">{currentEmployee.leaveDate}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">办理的手机号码</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>号码</th>
                      <th>使用人</th>
                      <th>状态</th>
                      <th>办卡日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* This would normally come from phone data */}
                    <tr>
                      <td>13812345678</td>
                      <td>{currentEmployee.name}</td>
                      <td><StatusBadge status="active" /></td>
                      <td>2023-01-15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">当前使用的手机号码</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>号码</th>
                      <th>办卡人</th>
                      <th>状态</th>
                      <th>办卡日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* This would normally come from phone data */}
                    <tr>
                      <td>13812345678</td>
                      <td>{currentEmployee.name}</td>
                      <td><StatusBadge status="active" /></td>
                      <td>2023-01-15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Employees;
