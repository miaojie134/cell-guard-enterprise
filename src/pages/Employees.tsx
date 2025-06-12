import React, { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useEmployees, useEmployeeCacheRefresh } from "@/hooks/useEmployees";
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
import { Employee, FrontendEmploymentStatus, FRONTEND_EMPLOYMENT_STATUS } from "@/types";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { AddEmployeeForm } from "@/components/AddEmployeeForm";
import { UpdateEmployeeForm } from "@/components/UpdateEmployeeForm";
import { EmployeeDetailDialog } from "@/components/EmployeeDetailDialog";
import { employeeService } from "@/services/employeeService";
import { useToast } from "@/hooks/use-toast";
import { CreateEmployeeRequest, UpdateEmployeeRequest } from "@/config/api";
import { Plus, Edit, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Trash2,
  Eye,
  MoreHorizontal,
  Filter,
  X
} from 'lucide-react';
import { DepartmentSelector } from '@/components/DepartmentSelector';
import { useDepartmentOptions } from '@/hooks/useDepartments';

// 员工状态映射函数
const mapEmployeeStatusToBadgeStatus = (status: FrontendEmploymentStatus): "active" | "inactive" => {
  return status === FRONTEND_EMPLOYMENT_STATUS.ACTIVE ? "active" : "inactive";
};

// 员工状态显示文本映射函数
const getEmployeeStatusText = (status: FrontendEmploymentStatus): string => {
  return status === FRONTEND_EMPLOYMENT_STATUS.ACTIVE ? "在职" : "离职";
};

// 日期格式化函数 - 将YYYY-MM-DD格式转换为用户友好的格式
const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toLocaleDateString('zh-CN');
  } catch {
    return isoDate;
  }
};

const Employees = () => {
  const { 
    employees, 
    totalItems, 
    totalPages, 
    currentPage, 
    isLoading, 
    error, 
    fetchEmployees, 
    getEmployeeById 
  } = useEmployees();
  
  const { refreshAllEmployeeCaches } = useEmployeeCacheRefresh();
  const { options: departmentOptions } = useDepartmentOptions();
  
  // State
  const [searchParams, setSearchParams] = useState({
    query: "",
    filters: {
      status: "all",
      departmentId: undefined as number | undefined,
    },
    page: 1,
    pageSize: 10,
  });
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();

  // Get current employee
  const currentEmployee = currentEmployeeId ? getEmployeeById(currentEmployeeId) : null;

  // 获取当前选中的部门
  const selectedDepartment = departmentOptions.find(opt => opt.id === searchParams.filters.departmentId);

  // Handle department filter change
  const handleDepartmentFilterChange = (department: any) => {
    console.log('Department filter changed:', department);
    setSearchParams(prev => ({
      ...prev,
      filters: { ...prev.filters, departmentId: department?.id },
      page: 1
    }));
  };

  // Load employees on component mount and when search params change
  useEffect(() => {
    const apiParams = {
      page: searchParams.page,
      limit: searchParams.pageSize,
      search: searchParams.query || undefined,
      employmentStatus: searchParams.filters.status === 'active' ? 'Active' : 
                       searchParams.filters.status === 'inactive' ? 'Departed' : undefined,
      departmentId: searchParams.filters.departmentId,
    };
    
    console.log('Fetching employees with API params:', apiParams);
    fetchEmployees(apiParams);
  }, [searchParams.page, searchParams.pageSize, searchParams.query, searchParams.filters.status, searchParams.filters.departmentId, fetchEmployees]);

  // Handle error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "获取员工列表失败",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Handle search and filters
  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Dialog handlers
  const openDetailsDialog = (employeeId: string) => {
    console.log('openDetailsDialog called with employeeId:', employeeId);
    console.log('Available employees:', employees.map(emp => ({ id: emp.id, employeeId: emp.employeeId, name: emp.name })));
    
    // 直接使用传入的员工ID查找员工，然后使用员工工号
    const employee = getEmployeeById(employeeId);
    console.log('Found employee:', employee);
    
    if (employee) {
      console.log('Setting currentEmployeeId to:', employee.employeeId);
      setCurrentEmployeeId(employee.employeeId);
      setShowDetailsDialog(true);
    } else {
      console.error('Employee not found with id:', employeeId);
      console.error('Available employee IDs:', employees.map(emp => emp.id));
    }
  };

  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const openUpdateDialog = (id: string) => {
    setCurrentEmployeeId(id);
    setShowUpdateDialog(true);
  };

  // 刷新员工列表的辅助函数
  const refreshEmployeeList = () => {
    // 使用全局缓存刷新，这样会同时刷新员工列表和员工选择器的缓存
    refreshAllEmployeeCaches();
    
    // 重新获取当前页面的员工数据
    const apiParams = {
      page: searchParams.page,
      limit: searchParams.pageSize,
      search: searchParams.query || undefined,
      employmentStatus: searchParams.filters.status === 'active' ? 'Active' : 
                       searchParams.filters.status === 'inactive' ? 'Departed' : undefined,
      departmentId: searchParams.filters.departmentId,
    };
    
    fetchEmployees(apiParams);
  };

  const handleCreateEmployee = async (data: CreateEmployeeRequest) => {
    setIsCreating(true);
    try {
      await employeeService.createEmployee(data);
      
      toast({
        title: "创建成功",
        description: "员工已成功创建",
      });
      
      setShowAddDialog(false);
      refreshEmployeeList();
    } catch (error) {
      console.error('Failed to create employee:', error);
      const errorMessage = error instanceof Error ? error.message : '创建员工失败';
      
      toast({
        title: "创建失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateEmployee = async (data: UpdateEmployeeRequest) => {
    if (!currentEmployeeId || !currentEmployee) return;

    setIsUpdating(true);
    try {
      // 使用员工工号
      await employeeService.updateEmployee(currentEmployee.employeeId, data);
      
      toast({
        title: "更新成功",
        description: "员工信息已成功更新",
      });
      
      setShowUpdateDialog(false);
      setCurrentEmployeeId(null);
      refreshEmployeeList();
    } catch (error) {
      console.error('Failed to update employee:', error);
      const errorMessage = error instanceof Error ? error.message : '更新员工失败';
      
      toast({
        title: "更新失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div className="w-full lg:w-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="搜索员工姓名..."
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Select
                value={searchParams.filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-[120px] h-10">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="w-[180px]">
                <DepartmentSelector
                  value={selectedDepartment || null}
                  onChange={handleDepartmentFilterChange}
                  placeholder="选择部门"
                  compact
                />
              </div>
              
              {(searchParams.filters.departmentId || searchParams.filters.status !== "all") && (
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 whitespace-nowrap"
                  onClick={() => setSearchParams(prev => ({
                    ...prev,
                    filters: { status: "all", departmentId: undefined },
                    page: 1
                  }))}
                >
                  <X className="h-4 w-4 mr-1" />
                  清除筛选
                </Button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>部门</th>
                  <th>手机号</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>入职日期</th>
                  <th>离职日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      没有找到符合条件的员工
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.department}</td>
                      <td>{employee.phoneNumber || "-"}</td>
                      <td>{employee.email || "-"}</td>
                      <td>
                        <StatusBadge 
                          status={mapEmployeeStatusToBadgeStatus(employee.status)} 
                          text={getEmployeeStatusText(employee.status)}
                        />
                      </td>
                      <td>{formatDisplayDate(employee.joinDate)}</td>
                      <td>{employee.leaveDate ? formatDisplayDate(employee.leaveDate) : "-"}</td>
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
                            onClick={() => openUpdateDialog(employee.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            totalItems={totalItems}
          />
        </CardContent>
      </Card>
      
      {/* Employee Details Dialog */}
      <EmployeeDetailDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        employeeId={currentEmployeeId}
      />
      
      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新员工</DialogTitle>
            <DialogDescription>
              请填写员工的基本信息。所有标记为 * 的字段都是必填项。
            </DialogDescription>
          </DialogHeader>
          <AddEmployeeForm
            onSubmit={handleCreateEmployee}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Update Employee Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>更新员工信息</DialogTitle>
            <DialogDescription>
              修改员工的基本信息。您可以更新部门、在职状态和入离职日期。
            </DialogDescription>
          </DialogHeader>
          {currentEmployee && (
            <UpdateEmployeeForm
              employee={currentEmployee}
              onSubmit={handleUpdateEmployee}
              isLoading={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Employees;
