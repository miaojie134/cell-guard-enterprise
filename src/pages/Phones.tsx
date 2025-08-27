import React, { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";
import { Plus, Loader2, AlertCircle, FileText, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { hasManagePermission } from "@/utils/permissions";
import { usePhoneNumbers, usePhoneNumber } from "@/hooks/usePhoneNumbers";
import { useDepartmentOptions } from "@/hooks/useDepartments";
import { CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest } from "@/config/api/phone";

// 导入新的统一组件
import { UnifiedPhoneTable, ActionConfig } from "@/components/UnifiedPhoneTable";
import { UnifiedPhoneFilters } from "@/components/UnifiedPhoneFilters";
import { PhoneSearchParams, hasUsageHistory } from "@/utils/phoneUtils";

// 导入对话框组件
import {
  AddPhoneDialog,
  EditPhoneDialog,
  PhoneDetailsDialog,
  AssignPhoneDialog,
  UnassignPhoneDialog,
  DeletePhoneDialog,
} from "./Phones/components/dialogs";

const Phones = () => {
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // 获取部门选项数据来映射部门名称
  const { options: departmentOptions } = useDepartmentOptions();
  
  // State
  const [searchParams, setSearchParams] = useState<PhoneSearchParams>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    applicantStatus: "",
    applicationDateFrom: "",
    applicationDateTo: "",
    applicationDate: "",
    cancellationDateFrom: "",
    cancellationDateTo: "",
    cancellationDate: "",
    vendor: "",
  });
  
  // 对话框状态
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");

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

  // 监听创建操作完成，自动关闭新增对话框
  const [wasCreating, setWasCreating] = useState(false);
  useEffect(() => {
    if (wasCreating && !isCreating) {
      // 创建操作完成（无论成功或失败），关闭对话框
      setShowAddDialog(false);
      setWasCreating(false);
    }
    if (isCreating && !wasCreating) {
      setWasCreating(true);
    }
  }, [isCreating, wasCreating]);

  // 监听更新操作完成，自动关闭编辑对话框
  const [wasUpdating, setWasUpdating] = useState(false);
  useEffect(() => {
    if (wasUpdating && !isUpdating) {
      // 更新操作完成（无论成功或失败），关闭对话框
      setShowEditDialog(false);
      setCurrentPhoneNumber("");
      setWasUpdating(false);
    }
    if (isUpdating && !wasUpdating) {
      setWasUpdating(true);
    }
  }, [isUpdating, wasUpdating]);

  // 监听分配操作完成，自动关闭分配对话框
  const [wasAssigning, setWasAssigning] = useState(false);
  useEffect(() => {
    if (wasAssigning && !isAssigning) {
      setShowAssignDialog(false);
      setWasAssigning(false);
    }
    if (isAssigning && !wasAssigning) {
      setWasAssigning(true);
    }
  }, [isAssigning, wasAssigning]);

  // 监听回收操作完成，自动关闭回收对话框
  const [wasUnassigning, setWasUnassigning] = useState(false);
  useEffect(() => {
    if (wasUnassigning && !isUnassigning) {
      setShowUnassignDialog(false);
      setWasUnassigning(false);
    }
    if (isUnassigning && !wasUnassigning) {
      setWasUnassigning(true);
    }
  }, [isUnassigning, wasUnassigning]);

  // 监听删除操作完成，自动关闭删除对话框
  const [wasDeleting, setWasDeleting] = useState(false);
  useEffect(() => {
    if (wasDeleting && !isDeleting) {
      setShowDeleteDialog(false);
      setCurrentPhoneNumber("");
      setWasDeleting(false);
    }
    if (isDeleting && !wasDeleting) {
      setWasDeleting(true);
    }
  }, [isDeleting, wasDeleting]);

  // 获取当前选中的手机号码详情 - 只有在认证完成且有手机号码时才查询
  const { phoneNumber: currentPhone } = usePhoneNumber(
    (isAuthenticated && currentPhoneNumber) ? currentPhoneNumber : ""
  );

  // 检查认证状态 - 添加加载状态检查
  if (authLoading) {
    return (
      <MainLayout title="号码管理">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">正在加载...</span>
        </div>
      </MainLayout>
    );
  }

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

  // Dialog handlers
  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const openEditDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowEditDialog(true);
  };

  const openDetailsDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowDetailsDialog(true);
  };

  const openAssignDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowAssignDialog(true);
  };

  const openUnassignDialog = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber);
    setShowUnassignDialog(true);
  };

  const openDeleteDialog = (phoneNumber: string) => {
    // 双重检查：确保没有使用历史才能删除
    const phone = phoneNumbers.find(p => p.phoneNumber === phoneNumber);
    if (phone && hasUsageHistory(phone)) {
      toast({
        title: '无法删除',
        description: '该号码存在使用历史记录，不允许删除',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentPhoneNumber(phoneNumber);
    setShowDeleteDialog(true);
  };

  // Submit handlers
  const handleAddSubmit = (data: CreatePhoneRequest) => {
    createPhone(data);
    // 不再立即关闭对话框，等待API调用完成
  };

  const handleEditSubmit = (phoneNumber: string, data: UpdatePhoneRequest) => {
    updatePhone({ phoneNumber, data });
    // 不再立即关闭对话框，等待API调用完成
  };

  const handleAssignSubmit = (phoneNumber: string, data: AssignPhoneRequest) => {
    assignPhone({ phoneNumber, data });
    // 不再立即关闭对话框，等待API调用完成
  };

  const handleUnassignSubmit = (phoneNumber: string, data: UnassignPhoneRequest) => {
    unassignPhone({ phoneNumber, data });
    // 不再立即关闭对话框，等待API调用完成
  };

  const handleDeleteSubmit = (phoneNumber: string) => {
    deletePhone(phoneNumber);
    // 不再立即关闭对话框，等待API调用完成
  };

  // 获取当前编辑的手机号码数据（使用useMemo避免不必要的对象重新创建）
  const phoneDataForEdit = useMemo(() => {
    if (!currentPhoneNumber) return null;
    const phone = phoneNumbers.find(p => p.phoneNumber === currentPhoneNumber);
    return phone ? {
      phoneNumber: phone.phoneNumber,
      purpose: phone.purpose,
      vendor: phone.vendor,
      remarks: phone.remarks || "",
      status: phone.status,
      cancellationDate: phone.cancellationDate || "",
    } : null;
  }, [currentPhoneNumber, phoneNumbers]);

  // 配置操作按钮
  const actions: ActionConfig[] = [
    {
      key: "details",
      label: "详情",
      icon: <FileText className="h-3 w-3" />,
      variant: "outline",
      size: "icon",
      onClick: openDetailsDialog,
      className: "w-7 h-7",
    },
    {
      key: "edit",
      label: "编辑",
      icon: <Pencil className="h-3 w-3" />,
      variant: "outline",
      size: "icon",
      onClick: openEditDialog,
      disabled: (phone) => !hasManagePermission(user, phone.departmentId),
      className: "w-7 h-7",
    },
    {
      key: "assign",
      label: "分配",
      variant: "outline",
      size: "sm",
      onClick: openAssignDialog,
      disabled: (phone) => !hasManagePermission(user, phone.departmentId),
      show: (phone) => !phone.currentUserName,
      className: "px-2 text-xs",
    },
    {
      key: "unassign",
      label: "回收",
      variant: "outline",
      size: "sm",
      onClick: openUnassignDialog,
      disabled: (phone) => !hasManagePermission(user, phone.departmentId),
      show: (phone) => !!phone.currentUserName,
      className: "px-2 text-xs",
    },
    {
      key: "delete",
      label: "删除",
      icon: <Trash2 className="h-3 w-3" />,
      variant: "ghost",
      size: "icon",
      onClick: openDeleteDialog,
      disabled: (phone) => hasUsageHistory(phone) || !hasManagePermission(user, phone.departmentId),
      show: (phone) => !hasUsageHistory(phone),
      className: "w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50",
      title: "删除号码",
    },
  ];

  // 加载状态映射
  const loadingStates = {
    edit: isUpdating,
    assign: isAssigning,
    unassign: isUnassigning,
    delete: isDeleting,
  };

  return (
    <MainLayout title="号码管理">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>手机号码列表</CardTitle>
          <Button onClick={openAddDialog} disabled={isCreating || !hasManagePermission(user)}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            添加号码
          </Button>
        </CardHeader>
        <CardContent>
          <UnifiedPhoneFilters
            searchParams={searchParams}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onUpdateSearchParams={setSearchParams}
            filterConfig={{
              status: true,
              vendor: true,
              applicationDate: true,
              cancellationDate: true,
            }}
            variant="default"
            searchPlaceholder="搜索号码、使用人、办卡人、部门..."
          />
          
          <UnifiedPhoneTable
            phoneNumbers={phoneNumbers}
            isLoading={isLoading}
            error={error}
            searchParams={searchParams}
            user={user}
            departmentOptions={departmentOptions}
            onFilterChange={handleFilterChange}
            onUpdateSearchParams={setSearchParams}
            actions={actions}
            showColumns={{
              currentUser: true,
              purpose: true,
              cancellationDate: true,
            }}
            variant="default"
            emptyText="没有找到符合条件的手机号码"
            loadingStates={loadingStates}
          />
          
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
      
      {/* 对话框组件 */}
      <AddPhoneDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddSubmit}
        isCreating={isCreating}
      />
      
      <EditPhoneDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        phoneData={phoneDataForEdit}
        onSubmit={handleEditSubmit}
        isUpdating={isUpdating}
      />
      
      <PhoneDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        phoneData={currentPhone}
      />
      
      <AssignPhoneDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        phoneNumber={currentPhoneNumber}
        onSubmit={handleAssignSubmit}
        isAssigning={isAssigning}
      />
      
      <UnassignPhoneDialog
        open={showUnassignDialog}
        onOpenChange={setShowUnassignDialog}
        phoneNumber={currentPhoneNumber}
        onSubmit={handleUnassignSubmit}
        isUnassigning={isUnassigning}
      />
      
      <DeletePhoneDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        phoneNumber={currentPhoneNumber}
        onSubmit={handleDeleteSubmit}
        isDeleting={isDeleting}
        hasUsageHistory={
          currentPhoneNumber 
            ? hasUsageHistory(phoneNumbers.find(p => p.phoneNumber === currentPhoneNumber) || { phoneNumber: "", applicantName: "", applicantEmployeeId: "", applicantStatus: "", applicationDate: "", status: "", vendor: "" })
            : false
        }
      />
    </MainLayout>
  );
};

export default Phones; 