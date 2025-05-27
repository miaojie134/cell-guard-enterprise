
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useEmployees } from "@/hooks/useEmployees";
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
import { Plus, Edit, ExternalLink, Loader2 } from "lucide-react";

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
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  // Get current employee
  const currentEmployee = currentEmployeeId ? getEmployeeById(currentEmployeeId) : null;

  // Load employees on component mount and when search params change
  useEffect(() => {
    const apiParams = {
      page: searchParams.page,
      limit: searchParams.pageSize,
      search: searchParams.query || undefined,
      employmentStatus: searchParams.filters.status === 'active' ? 'Active' : 
                       searchParams.filters.status === 'inactive' ? 'Departed' : undefined,
    };
    
    fetchEmployees(apiParams);
  }, [searchParams]);

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

  // Dialog handlers
  const openDetailsDialog = (id: string) => {
    setCurrentEmployeeId(id);
    setShowDetailsDialog(true);
  };

  return (
    <MainLayout title="员工管理">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>员工列表</CardTitle>
          <Button disabled>
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
                  <SelectItem value="all">全部状态</SelectItem>
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
                  <SelectItem value="all">全部部门</SelectItem>
                  <SelectItem value="市场部">市场部</SelectItem>
                  <SelectItem value="销售部">销售部</SelectItem>
                  <SelectItem value="财务部">财务部</SelectItem>
                  <SelectItem value="IT部">IT部</SelectItem>
                  <SelectItem value="人力资源部">人力资源部</SelectItem>
                </SelectContent>
              </Select>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      没有找到符合条件的员工
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
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
                            disabled
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
                <h3 className="text-lg font-medium mb-2">关联的手机号码信息</h3>
                <p className="text-sm text-muted-foreground">
                  手机号码相关功能暂未实现，将在后续版本中添加。
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Employees;
