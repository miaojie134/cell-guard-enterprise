import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Edit } from "lucide-react";
import { PhoneNumber } from "@/types";
import { EmployeeSelector, Employee as SelectorEmployee } from "@/components/EmployeeSelector";
import { PhoneStatus, RiskHandleAction } from "@/config/api/phone";
import { useEmployeesForSelector } from "@/hooks/useEmployees";
import { useRiskPhoneNumbers } from "@/hooks/usePhoneNumbers";

// 处理表单数据类型
interface RiskHandlingForm {
  action: RiskHandleAction | '';
  notes: string;
  newApplicantId?: string; // 新办卡人ID（变更办卡人时使用）
}

const RiskPhones = () => {
  // State
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    applicantStatus: "",
    sortBy: "",
    sortOrder: "desc" as const,
  });
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");
  const [formData, setFormData] = useState<RiskHandlingForm>({
    action: '',
    notes: '',
    newApplicantId: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<SelectorEmployee | null>(null);

  // 获取在职员工列表
  const { activeEmployees, isLoading: isLoadingEmployees } = useEmployeesForSelector({
    employmentStatus: 'Active',
    limit: 100,
  });

  // 获取风险号码数据
  const {
    riskPhoneNumbers,
    riskPhonePagination,
    riskPhoneLoading,
    riskPhoneError,
    handleRiskPhone,
    isHandlingRiskPhone,
  } = useRiskPhoneNumbers(searchParams);

  const currentPhone = riskPhoneNumbers.find(phone => phone.phoneNumber === currentPhoneNumber);

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
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // 重置员工选择器
    if (name === 'action' && value !== 'change_applicant') {
      setSelectedEmployee(null);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (employee: SelectorEmployee | null) => {
    setSelectedEmployee(employee);
    if (employee) {
      setFormData(prev => ({ ...prev, newApplicantId: employee.employeeId }));
    } else {
      setFormData(prev => ({ ...prev, newApplicantId: '' }));
    }
  };

  // Dialog handlers
  const openEditDialog = (id: string) => {
    const phone = riskPhoneNumbers.find(p => p.phoneNumber === id);
    if (phone) {
      setCurrentPhoneNumber(id);
      setFormData({
        action: '',
        notes: '',
        newApplicantId: '',
      });
      setSelectedEmployee(null);
      setShowEditDialog(true);
    }
  };

  // Submit handlers
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPhoneNumber || !formData.action) return;

    // 构造处理风险号码的请求数据
    const handleData: any = {
      action: formData.action,
      remarks: formData.notes,
    };

    // 根据不同的处理方式，添加特定参数
    if (formData.action === 'change_applicant') {
      // 变更办卡人：需要新办卡人ID
      if (!selectedEmployee) return;
      handleData.newApplicantEmployeeId = selectedEmployee.employeeId;
    }

    handleRiskPhone({ phoneNumber: currentPhoneNumber, data: handleData });
    setShowEditDialog(false);
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
    <MainLayout title="风险号码">
      <Card className="border-red-200">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <CardTitle className="text-red-700">风险号码管理</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4">
            以下号码的办卡人已经离职，请尽快处理这些号码，可以将其进行回收、转移或注销。
          </p>
          
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="搜索手机号码、办卡人姓名或当前使用人..."
            />
            <div className="flex space-x-2">
              <Select
                value={searchParams.applicantStatus || "all"}
                onValueChange={(value) => handleFilterChange("applicantStatus", value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="办卡人状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部办卡人</SelectItem>
                  <SelectItem value="Active">在职</SelectItem>
                  <SelectItem value="Departed">离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {riskPhoneLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">正在加载风险号码...</p>
            </div>
          )}
          
          {riskPhoneError && (
            <div className="text-center py-8">
              <p className="text-red-600">加载失败: {riskPhoneError.message}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="mt-2"
              >
                重试
              </Button>
            </div>
          )}
          
          {!riskPhoneLoading && !riskPhoneError && (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>号码</th>
                      <th>办卡人</th>
                      <th>办卡人状态</th>
                      <th>当前使用人</th>
                      <th>状态</th>
                      <th>供应商</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskPhoneNumbers.map((phone) => (
                      <tr key={phone.phoneNumber}>
                        <td>{phone.phoneNumber}</td>
                        <td>{phone.applicantName}</td>
                        <td><StatusBadge status="inactive" text="已离职" /></td>
                        <td>{phone.currentUserName || "-"}</td>
                        <td><StatusBadge status={getStatusVariant(phone.status)} text={getStatusText(phone.status)} /></td>
                        <td>{phone.vendor}</td>
                        <td>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(phone.phoneNumber)}
                            disabled={isHandlingRiskPhone}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {riskPhoneNumbers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          恭喜，没有发现风险号码
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {riskPhoneNumbers.length > 0 && riskPhonePagination && (
                <Pagination
                  currentPage={searchParams.page}
                  totalPages={riskPhonePagination.totalPages}
                  pageSize={searchParams.limit}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  totalItems={riskPhonePagination.totalItems}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Phone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>处理风险号码</DialogTitle>
            <DialogDescription>
              请选择如何处理此风险号码
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-2">
              {currentPhone && (
                <div className="space-y-2">
                  <Label>手机号码信息</Label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-1 text-sm">
                    <p><span className="font-medium">号码:</span> {currentPhone.phoneNumber}</p>
                    <p><span className="font-medium">办卡人:</span> {currentPhone.applicantName} <span className="text-red-600">(已离职)</span></p>
                    <p><span className="font-medium">当前使用人:</span> {currentPhone.currentUserName || "未分配"}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="action">处理方式</Label>
                <Select
                  value={formData.action}
                  onValueChange={(value) => handleSelectChange("action", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择处理方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change_applicant">变更办卡人</SelectItem>
                    <SelectItem value="reclaim">回收号码</SelectItem>
                    <SelectItem value="deactivate">注销号码</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 变更办卡人 */}
              {formData.action === "change_applicant" && (
                <div className="space-y-2">
                  <Label>新办卡人</Label>
                  <EmployeeSelector
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    employees={activeEmployees}
                    isLoading={isLoadingEmployees}
                    placeholder="选择新的办卡人..."
                    required
                    compact={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    将办卡责任转移给在职员工，通常转给当前使用人
                  </p>
                </div>
              )}

              {/* 回收号码 */}
              {formData.action === "reclaim" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                  <p className="text-blue-800 font-medium">回收说明：</p>
                  <ul className="text-blue-700 mt-1 space-y-1">
                    <li>• 号码状态将变为"闲置"</li>
                    <li>• 清除当前使用人信息</li>
                    <li>• 可重新分配给其他员工</li>
                  </ul>
                </div>
              )}

              {/* 注销号码 */}
              {formData.action === "deactivate" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm">
                  <p className="text-orange-800 font-medium">注销说明：</p>
                  <ul className="text-orange-700 mt-1 space-y-1">
                    <li>• 号码将永久注销</li>
                    <li>• 无法再次使用</li>
                    <li>• 此操作不可逆</li>
                  </ul>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">处理备注</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="请描述处理原因和详细情况..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button 
                type="submit" 
                variant={formData.action === "deactivate" ? "destructive" : "default"}
                disabled={!formData.action || isHandlingRiskPhone}
              >
                {isHandlingRiskPhone ? "处理中..." : (
                  <>
                    {formData.action === "change_applicant" && "确认变更"}
                    {formData.action === "reclaim" && "确认回收"}
                    {formData.action === "deactivate" && "确认注销"}
                    {!formData.action && "请选择处理方式"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default RiskPhones;
