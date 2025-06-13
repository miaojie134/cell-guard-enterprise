import React, { useState, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { EmployeeSelector, type Employee } from "@/components/EmployeeSelector";
import { Plus, FileText, Pencil, Loader2, AlertCircle, CalendarDays, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePhoneNumbers, usePhoneNumber } from "@/hooks/usePhoneNumbers";
import { CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest, PhoneStatus } from "@/config/api/phone";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

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
    applicationDateFrom: "",
    applicationDateTo: "",
    applicationDate: "",
    cancellationDateFrom: "",
    cancellationDateTo: "",
    cancellationDate: "",
  });

  // 时间筛选状态
  type DateFilterType = 'application' | 'cancellation' | 'none';
  
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('none');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [tempDateRange, setTempDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isWaitingForSecondDate, setIsWaitingForSecondDate] = useState(false);
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 列头筛选器独立状态
  const [applicationDateRange, setApplicationDateRange] = useState<{from?: Date; to?: Date}>({});
  const [tempApplicationDateRange, setTempApplicationDateRange] = useState<{from?: Date; to?: Date}>({});
  const [isApplicationDatePickerOpen, setIsApplicationDatePickerOpen] = useState(false);
  const [isApplicationWaitingForSecondDate, setIsApplicationWaitingForSecondDate] = useState(false);
  const [applicationAutoConfirmTimer, setApplicationAutoConfirmTimer] = useState<NodeJS.Timeout | null>(null);
  
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

  // 安全的日期格式化函数，避免时区问题
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 计算时间筛选的开始和结束时间
  const getTimeFilterDates = () => {
    if (dateFilterType === 'none') {
      return { dateFrom: undefined, dateTo: undefined };
    }
    
    let dateFrom: string | undefined;
    let dateTo: string | undefined;
    
    if (customDateRange.from) {
      dateFrom = formatDateToLocalString(customDateRange.from);
    }
    if (customDateRange.to) {
      dateTo = formatDateToLocalString(customDateRange.to);
    }
    
    return { dateFrom, dateTo };
  };

  // 更新searchParams以包含时间筛选
  const updateSearchParamsWithTimeFilter = () => {
    const { dateFrom, dateTo } = getTimeFilterDates();
    
    // 判断是否为单日选择（开始和结束日期相同）
    const isSingleDay = dateFrom && dateTo && dateFrom === dateTo;
    
    // 调试信息
    if (dateFrom || dateTo) {
      console.log('🗓️ 日期筛选调试信息:', {
        dateFilterType,
        customDateRange,
        计算结果: { dateFrom, dateTo },
        是否单日: isSingleDay,
        原始选择: customDateRange.from ? formatDateToLocalString(customDateRange.from) : null
      });
    }
    
    setSearchParams(prev => ({
      ...prev,
      page: 1, // 重置页码
      // 清空所有时间相关参数
      applicationDateFrom: "",
      applicationDateTo: "",
      applicationDate: "",
      cancellationDateFrom: "",
      cancellationDateTo: "",
      cancellationDate: "",
      // 根据筛选类型和是否单日设置对应参数
      ...(dateFilterType === 'application' && {
        ...(isSingleDay 
          ? { applicationDate: dateFrom }
          : { 
              applicationDateFrom: dateFrom || "", 
              applicationDateTo: dateTo || "" 
            }
        )
      }),
      ...(dateFilterType === 'cancellation' && {
        ...(isSingleDay 
          ? { cancellationDate: dateFrom }
          : { 
              cancellationDateFrom: dateFrom || "", 
              cancellationDateTo: dateTo || "" 
            }
        )
      }),
    }));
  };

  // 监听时间筛选变化
  useEffect(() => {
    updateSearchParamsWithTimeFilter();
  }, [dateFilterType, customDateRange]);

  // 办卡时间列头筛选的独立处理函数
  const updateApplicationDateFilter = () => {
    if (!applicationDateRange.from && !applicationDateRange.to) {
      // 清空办卡时间筛选
      setSearchParams(prev => ({
        ...prev,
        page: 1,
        applicationDateFrom: "",
        applicationDateTo: "",
        applicationDate: "",
      }));
      return;
    }

    const dateFrom = applicationDateRange.from ? formatDateToLocalString(applicationDateRange.from) : "";
    const dateTo = applicationDateRange.to ? formatDateToLocalString(applicationDateRange.to) : "";
    const isSingleDay = dateFrom && dateTo && dateFrom === dateTo;
    
    console.log('🗓️ 办卡时间列头筛选:', {
      applicationDateRange,
      计算结果: { dateFrom, dateTo },
      是否单日: isSingleDay,
    });

    setSearchParams(prev => ({
      ...prev,
      page: 1,
      // 根据单日/范围选择设置参数
      applicationDate: isSingleDay ? dateFrom : "",
      applicationDateFrom: isSingleDay ? "" : dateFrom,
      applicationDateTo: isSingleDay ? "" : dateTo,
    }));
  };

  // 移除自动监听办卡时间筛选变化，改为手动应用
  // useEffect(() => {
  //   updateApplicationDateFilter();
  // }, [applicationDateRange]);

  // 办卡时间筛选的智能日期选择
  const handleApplicationDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setTempApplicationDateRange({});
      return;
    }

    const { from, to } = range;
    
    // 只选择了开始日期
    if (from && !to) {
      setTempApplicationDateRange({ from });
      setIsApplicationWaitingForSecondDate(true);
      
      // 清除之前的定时器
      if (applicationAutoConfirmTimer) {
        clearTimeout(applicationAutoConfirmTimer);
      }
      
      // 500ms后自动确认为单日选择（仅更新临时状态）
      const timer = setTimeout(() => {
        setTempApplicationDateRange({ from, to: from });
        setIsApplicationWaitingForSecondDate(false);
        setApplicationAutoConfirmTimer(null);
      }, 500);
      
      setApplicationAutoConfirmTimer(timer);
    } 
    // 选择了范围
    else if (from && to) {
      // 清除定时器
      if (applicationAutoConfirmTimer) {
        clearTimeout(applicationAutoConfirmTimer);
        setApplicationAutoConfirmTimer(null);
      }
      
      setTempApplicationDateRange({ from, to });
      setIsApplicationWaitingForSecondDate(false);
    }
  };

  // 清除办卡时间筛选定时器
  const clearApplicationAutoConfirmTimer = () => {
    if (applicationAutoConfirmTimer) {
      clearTimeout(applicationAutoConfirmTimer);
      setApplicationAutoConfirmTimer(null);
    }
  };

  // 获取办卡时间临时选择显示
  const getApplicationTempDateDisplay = () => {
    if (tempApplicationDateRange.from && tempApplicationDateRange.to) {
      if (tempApplicationDateRange.from.getTime() === tempApplicationDateRange.to.getTime()) {
        return tempApplicationDateRange.from.toLocaleDateString('zh-CN');
      }
      return `${tempApplicationDateRange.from.toLocaleDateString('zh-CN')} ~ ${tempApplicationDateRange.to.toLocaleDateString('zh-CN')}`;
    }
    if (tempApplicationDateRange.from) {
      return tempApplicationDateRange.from.toLocaleDateString('zh-CN');
    }
    return "";
  };

  // 获取办卡时间筛选显示
  const getApplicationDateDisplay = () => {
    if (applicationDateRange.from && applicationDateRange.to) {
      if (applicationDateRange.from.getTime() === applicationDateRange.to.getTime()) {
        return applicationDateRange.from.toLocaleDateString('zh-CN');
      }
      return `${applicationDateRange.from.toLocaleDateString('zh-CN')} ~ ${applicationDateRange.to.toLocaleDateString('zh-CN')}`;
    }
    if (applicationDateRange.from) {
      return applicationDateRange.from.toLocaleDateString('zh-CN');
    }
    if (applicationDateRange.to) {
      return applicationDateRange.to.toLocaleDateString('zh-CN');
    }
    return "选择日期";
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoConfirmTimer) {
        clearTimeout(autoConfirmTimer);
      }
    };
  }, [autoConfirmTimer]);

  // 清理办卡时间筛选定时器
  useEffect(() => {
    return () => {
      if (applicationAutoConfirmTimer) {
        clearTimeout(applicationAutoConfirmTimer);
      }
    };
  }, [applicationAutoConfirmTimer]);

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

  // 时间筛选处理函数
  const handleDateFilterTypeChange = (value: DateFilterType) => {
    setDateFilterType(value);
    if (value === 'none') {
      setCustomDateRange({});
      setTempDateRange({});
    }
  };

  const applyCustomDateRange = () => {
    setCustomDateRange(tempDateRange);
    setIsDatePickerOpen(false);
    setIsWaitingForSecondDate(false);
    if (autoConfirmTimer) {
      clearTimeout(autoConfirmTimer);
      setAutoConfirmTimer(null);
    }
  };

  // 清理定时器的函数
  const clearAutoConfirmTimer = () => {
    if (autoConfirmTimer) {
      clearTimeout(autoConfirmTimer);
      setAutoConfirmTimer(null);
    }
  };

  // 智能日期选择处理
  const handleSmartDateSelect = (range: DateRange | undefined) => {
    clearAutoConfirmTimer(); // 清除之前的定时器
    
    console.log('📅 日历选择调试:', { 
      range, 
      from: range?.from ? formatDateToLocalString(range.from) : null,
      to: range?.to ? formatDateToLocalString(range.to) : null
    });
    
    if (!range || !range.from) {
      setTempDateRange({});
      setIsWaitingForSecondDate(false);
      return;
    }

    // 如果已经有完整的范围选择，直接设置
    if (range.to && range.from.getTime() !== range.to.getTime()) {
      setTempDateRange({
        from: range.from,
        to: range.to
      });
      setIsWaitingForSecondDate(false);
      return;
    }

    // 第一次点击日期
    setTempDateRange({
      from: range.from,
      to: range.from // 临时设为相同日期，表示单日选择
    });
    setIsWaitingForSecondDate(true);

    // 设置自动确认定时器（800ms后自动确认为单日选择）
    const timer = setTimeout(() => {
      setIsWaitingForSecondDate(false);
      setAutoConfirmTimer(null);
      // 如果用户没有选择第二个日期，保持单日选择
    }, 800);
    
    setAutoConfirmTimer(timer);
  };

  const getCustomDateDisplay = () => {
    if (!customDateRange.from && !customDateRange.to) {
      return '选择日期';
    }
    
    const startStr = customDateRange.from 
      ? format(customDateRange.from, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    const endStr = customDateRange.to 
      ? format(customDateRange.to, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    
    // 如果开始和结束日期相同，显示单个日期
    if (startStr && endStr && startStr === endStr) {
      return startStr;
    }
    
    if (startStr && endStr) {
      return `${startStr} 至 ${endStr}`;
    } else if (startStr) {
      return `从 ${startStr} 开始`;
    } else if (endStr) {
      return `到 ${endStr} 结束`;
    }
    
    return '选择日期';
  };

  const getTempDateDisplay = () => {
    if (!tempDateRange.from && !tempDateRange.to) {
      return '选择日期';
    }
    
    const startStr = tempDateRange.from 
      ? format(tempDateRange.from, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    const endStr = tempDateRange.to 
      ? format(tempDateRange.to, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    
    // 如果开始和结束日期相同，显示单个日期
    if (startStr && endStr && startStr === endStr) {
      return startStr;
    }
    
    if (startStr && endStr) {
      return `${startStr} 至 ${endStr}`;
    } else if (startStr) {
      return `从 ${startStr} 开始`;
    } else if (endStr) {
      return `到 ${endStr} 结束`;
    }
    
    return '选择日期';
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
                        <div className="flex flex-wrap gap-2">
              
              {/* 活跃筛选条件显示区域 - 替换注销时间筛选器的位置 */}
              {(applicationDateRange.from || applicationDateRange.to || dateFilterType === 'cancellation' || searchParams.status) ? (
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-300 rounded-md px-3 py-1.5">
                  <Filter className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">筛选:</span>
                  
                  {/* 号码状态筛选条件 */}
                  {searchParams.status && (
                    <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                      <span>号码状态</span>
                      <span className="font-medium text-blue-800">{getStatusText(searchParams.status)}</span>
                      <button
                        onClick={() => {
                          handleFilterChange("status", "all");
                        }}
                        className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                        title="清除号码状态筛选"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  


                  {/* 办卡时间筛选条件 */}
                  {(applicationDateRange.from || applicationDateRange.to) && (
                    <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                      <span>办卡时间</span>
                      <span className="font-medium text-blue-800">{getApplicationDateDisplay()}</span>
                      <button
                        onClick={() => {
                          setApplicationDateRange({});
                          setTempApplicationDateRange({});
                          setSearchParams(prev => ({
                            ...prev,
                            page: 1,
                            applicationDateFrom: "",
                            applicationDateTo: "",
                            applicationDate: "",
                          }));
                        }}
                        className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                        title="清除办卡时间筛选"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {/* 注销时间筛选条件 */}
                  {dateFilterType === 'cancellation' && (customDateRange.from || customDateRange.to) && (
                    <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                      <span>注销时间</span>
                      <span className="font-medium text-blue-800">{getCustomDateDisplay()}</span>
                      <button
                        onClick={() => {
                          setCustomDateRange({});
                          setTempDateRange({});
                          setDateFilterType('none');
                        }}
                        className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                        title="清除注销时间筛选"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {/* 注销时间筛选器 */}
                  {dateFilterType === 'cancellation' && !(customDateRange.from || customDateRange.to) && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">注销时间:</span>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 text-xs min-w-16 max-w-none hover:bg-transparent"
                            onClick={() => {
                              setTempDateRange(customDateRange);
                              setIsDatePickerOpen(true);
                            }}
                          >
                            <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">选择日期</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-center border-b pb-1">
                              {isWaitingForSecondDate ? (
                                <span className="text-blue-600 animate-pulse">
                                  已选择 {getTempDateDisplay()}
                                </span>
                              ) : tempDateRange.from || tempDateRange.to ? (
                                <span>选择: {getTempDateDisplay()}</span>
                              ) : (
                                <span>点击日期（智能识别单日/范围选择）</span>
                              )}
                            </div>
                            
                            <CalendarComponent
                              mode="range"
                              selected={tempDateRange as DateRange}
                              onSelect={handleSmartDateSelect}
                              locale={zhCN}
                              numberOfMonths={1}
                              className="rounded-md border p-1"
                              classNames={{
                                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                                cell: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-xs font-medium",
                                nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                                table: "w-full border-collapse space-y-1",
                                row: "flex w-full mt-1"
                              }}
                            />
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTempDateRange({});
                                  setCustomDateRange({});
                                  setDateFilterType('none');
                                  setIsWaitingForSecondDate(false);
                                  clearAutoConfirmTimer();
                                }}
                                className="flex-1 h-6 text-xs px-1"
                              >
                                清空
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsDatePickerOpen(false);
                                  setIsWaitingForSecondDate(false);
                                  clearAutoConfirmTimer();
                                }}
                                className="flex-1 h-6 text-xs px-1"
                              >
                                取消
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setCustomDateRange(tempDateRange);
                                  setIsDatePickerOpen(false);
                                  setIsWaitingForSecondDate(false);
                                  if (autoConfirmTimer) {
                                    clearTimeout(autoConfirmTimer);
                                    setAutoConfirmTimer(null);
                                  }
                                }}
                                className="flex-1 h-6 text-xs px-1"
                                disabled={!tempDateRange.from}
                              >
                                应用
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  
                  {/* 清除所有筛选 */}
                  <button
                    onClick={() => {
                      setApplicationDateRange({});
                      setTempApplicationDateRange({});
                      setCustomDateRange({});
                      setTempDateRange({});
                      setDateFilterType('none');
                      setSearchParams(prev => ({
                        ...prev,
                        page: 1,
                        status: "",
                        applicationDateFrom: "",
                        applicationDateTo: "",
                        applicationDate: "",
                        cancellationDateFrom: "",
                        cancellationDateTo: "",
                        cancellationDate: "",
                      }));
                    }}
                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                    title="清除所有筛选"
                  >
                    清除所有
                  </button>
                </div>
              ) : (
                /* 注销时间筛选入口 - 无筛选时显示 */
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilterType('cancellation')}
                  className="h-8 text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  注销时间筛选
                </Button>
              )}
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
                    <th>
                      <div className="flex items-center gap-1">
                        <span>办卡时间</span>
                        <Popover open={isApplicationDatePickerOpen} onOpenChange={setIsApplicationDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${applicationDateRange.from || applicationDateRange.to ? 'text-blue-600' : ''}`}
                              title={applicationDateRange.from || applicationDateRange.to ? `筛选: ${getApplicationDateDisplay()}` : "筛选办卡时间"}
                              onClick={() => {
                                setTempApplicationDateRange(applicationDateRange);
                                setIsApplicationDatePickerOpen(true);
                              }}
                            >
                              <Filter className="h-3 w-3" />
                              {(applicationDateRange.from || applicationDateRange.to) && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-center border-b pb-1">
                                {isApplicationWaitingForSecondDate ? (
                                  <span className="text-blue-600 animate-pulse">
                                    已选择 {getApplicationTempDateDisplay()}
                                  </span>
                                ) : tempApplicationDateRange.from || tempApplicationDateRange.to ? (
                                  <span>选择: {getApplicationTempDateDisplay()}</span>
                                ) : (
                                  <span>点击日期（智能识别单日/范围选择）</span>
                                )}
                              </div>
                              
                              <CalendarComponent
                                mode="range"
                                selected={tempApplicationDateRange as DateRange}
                                onSelect={handleApplicationDateSelect}
                                locale={zhCN}
                                numberOfMonths={1}
                                className="rounded-md border p-1"
                                classNames={{
                                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                                  cell: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                  day: "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "text-xs font-medium",
                                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                                  table: "w-full border-collapse space-y-1",
                                  row: "flex w-full mt-1"
                                }}
                              />
                              
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTempApplicationDateRange({});
                                    setApplicationDateRange({});
                                    setIsApplicationWaitingForSecondDate(false);
                                    clearApplicationAutoConfirmTimer();
                                    
                                    // 清空筛选条件
                                    setSearchParams(prev => ({
                                      ...prev,
                                      page: 1,
                                      applicationDateFrom: "",
                                      applicationDateTo: "",
                                      applicationDate: "",
                                    }));
                                  }}
                                  className="flex-1 h-6 text-xs px-1"
                                >
                                  清空
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIsApplicationDatePickerOpen(false);
                                    setIsApplicationWaitingForSecondDate(false);
                                    clearApplicationAutoConfirmTimer();
                                  }}
                                  className="flex-1 h-6 text-xs px-1"
                                >
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // 应用筛选时才真正触发搜索
                                    setApplicationDateRange(tempApplicationDateRange);
                                    
                                    // 手动调用筛选更新
                                    const dateFrom = tempApplicationDateRange.from ? formatDateToLocalString(tempApplicationDateRange.from) : "";
                                    const dateTo = tempApplicationDateRange.to ? formatDateToLocalString(tempApplicationDateRange.to) : "";
                                    const isSingleDay = dateFrom && dateTo && dateFrom === dateTo;
                                    
                                    console.log('🗓️ 办卡时间列头筛选应用:', {
                                      tempApplicationDateRange,
                                      计算结果: { dateFrom, dateTo },
                                      是否单日: isSingleDay,
                                    });
                                    
                                    setSearchParams(prev => ({
                                      ...prev,
                                      page: 1,
                                      // 根据单日/范围选择设置参数
                                      applicationDate: isSingleDay ? dateFrom : "",
                                      applicationDateFrom: isSingleDay ? "" : dateFrom,
                                      applicationDateTo: isSingleDay ? "" : dateTo,
                                    }));
                                    
                                    setIsApplicationDatePickerOpen(false);
                                    setIsApplicationWaitingForSecondDate(false);
                                    if (applicationAutoConfirmTimer) {
                                      clearTimeout(applicationAutoConfirmTimer);
                                      setApplicationAutoConfirmTimer(null);
                                    }
                                  }}
                                  className="flex-1 h-6 text-xs px-1"
                                  disabled={!tempApplicationDateRange.from}
                                >
                                  应用
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center gap-1">
                        <span>号码状态</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${searchParams.status ? 'text-blue-600' : ''}`}
                              title="筛选号码状态"
                            >
                              <Filter className="h-3 w-3" />
                              {searchParams.status && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-center border-b pb-1">
                                选择号码状态
                              </div>
                              
                              <div className="space-y-1">
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "all");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    !searchParams.status || searchParams.status === "all" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  全部状态
                                </button>
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "idle");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    searchParams.status === "idle" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  闲置
                                </button>
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "in_use");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    searchParams.status === "in_use" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  使用中
                                </button>
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "pending_deactivation");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    searchParams.status === "pending_deactivation" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  待注销
                                </button>
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "deactivated");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    searchParams.status === "deactivated" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  已注销
                                </button>
                                <button
                                  onClick={() => {
                                    handleFilterChange("status", "user_reported");
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                                    searchParams.status === "user_reported" 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : ''
                                  }`}
                                >
                                  待核实-用户报告
                                </button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </th>
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
                      <td className="text-sm">
                        {phone.applicationDate ? new Date(phone.applicationDate).toLocaleDateString('zh-CN') : '-'}
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
                      <td colSpan={9} className="text-center py-4">
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
            <DialogDescription>
              查看手机号码的完整信息和使用历史记录
            </DialogDescription>
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
                          <th className="px-3 py-2 text-left font-medium text-gray-900">员工</th>
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
                  placeholder="搜索员工姓名..."
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
