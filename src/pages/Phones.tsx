import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { hasManagePermission } from "@/utils/permissions";
import { usePhoneNumbers, usePhoneNumber } from "@/hooks/usePhoneNumbers";
import { CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest } from "@/config/api/phone";

// 导入拆分的组件
import { PhoneFilters } from "./Phones/components/PhoneFilters";
import { PhoneTable } from "./Phones/components/PhoneTable";
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
  const { isAuthenticated, user } = useAuth();
  
  // State
  const [searchParams, setSearchParams] = useState({
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
    if (phone?.usageHistory && phone.usageHistory.length > 0) {
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
    setShowAddDialog(false);
  };

  const handleEditSubmit = (phoneNumber: string, data: UpdatePhoneRequest) => {
    updatePhone({ phoneNumber, data });
    setShowEditDialog(false);
    setCurrentPhoneNumber("");
  };

  const handleAssignSubmit = (phoneNumber: string, data: AssignPhoneRequest) => {
    assignPhone({ phoneNumber, data });
    setShowAssignDialog(false);
  };

  const handleUnassignSubmit = (phoneNumber: string, data: UnassignPhoneRequest) => {
    unassignPhone({ phoneNumber, data });
    setShowUnassignDialog(false);
  };

  const handleDeleteSubmit = (phoneNumber: string) => {
    deletePhone(phoneNumber);
    setShowDeleteDialog(false);
    setCurrentPhoneNumber("");
  };

  // 获取当前编辑的手机号码数据
  const getCurrentPhoneForEdit = () => {
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
          <PhoneFilters
            searchParams={searchParams}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onUpdateSearchParams={setSearchParams}
          />
          
          <PhoneTable
            phoneNumbers={phoneNumbers}
            isLoading={isLoading}
            error={error}
            searchParams={searchParams}
            isUpdating={isUpdating}
            isAssigning={isAssigning}
            isUnassigning={isUnassigning}
            isDeleting={isDeleting}
            user={user}
            onFilterChange={handleFilterChange}
            onUpdateSearchParams={setSearchParams}
            onOpenDetails={openDetailsDialog}
            onOpenEdit={openEditDialog}
            onOpenAssign={openAssignDialog}
            onOpenUnassign={openUnassignDialog}
            onOpenDelete={openDeleteDialog}
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
        phoneData={getCurrentPhoneForEdit()}
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
            ? (phoneNumbers.find(p => p.phoneNumber === currentPhoneNumber)?.usageHistory?.length ?? 0) > 0 
            : false
        }
      />
    </MainLayout>
  );
};

export default Phones; 