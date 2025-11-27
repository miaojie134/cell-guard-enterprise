import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Filter } from "lucide-react";
import { useDateRangePicker } from "../hooks/useDateRangePicker";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { PhoneSearchParams } from "@/utils/phoneUtils";

interface PhoneTableHeaderProps {
  searchParams: Partial<PhoneSearchParams>;
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: Partial<PhoneSearchParams>) => Partial<PhoneSearchParams>) => void;
  variant?: "default" | "risk";
  showColumns?: {
    currentUser?: boolean;
    applicant?: boolean;
    applicantStatus?: boolean;
    purpose?: boolean;
    cancellationDate?: boolean;
  };
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'idle': '闲置',
    'in_use': '使用中', 
    'pending_deactivation': '待注销',
    'deactivated': '已注销',
    'risk_pending': '待核实-办卡人离职',
    'user_reported': '待核实-用户报告',
    'suspended': '停机保号',
    'card_replacing': '补卡中',
  };
  return statusMap[status] || status;
};

const getVendorText = (vendor: string) => {
  const vendorMap: Record<string, string> = {
    '北京联通': '北京联通',
    '北京电信': '北京电信',
    '北京第三方': '北京第三方',
    '长春联通': '长春联通',
  };
  return vendorMap[vendor] || vendor;
};

export const PhoneTableHeader: React.FC<PhoneTableHeaderProps> = ({
  searchParams,
  onFilterChange,
  onUpdateSearchParams,
  variant = "default",
  showColumns = {
    currentUser: true,
    applicant: true,
    applicantStatus: true,
    purpose: true,
    cancellationDate: true,
  },
}) => {
  // 办卡时间筛选
  const cancellationDatePicker = useDateRangePicker();
  
  // 供应商筛选器状态
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // 同步日期筛选状态
  React.useEffect(() => {
    // 同步注销时间
    if (searchParams.cancellationDate) {
      const date = new Date(searchParams.cancellationDate);
      cancellationDatePicker.setDateRange({ from: date, to: date });
    } else if (searchParams.cancellationDateFrom || searchParams.cancellationDateTo) {
      cancellationDatePicker.setDateRange({
        from: searchParams.cancellationDateFrom ? new Date(searchParams.cancellationDateFrom) : undefined,
        to: searchParams.cancellationDateTo ? new Date(searchParams.cancellationDateTo) : undefined,
      });
    } else {
      // 如果没有任何日期筛选参数，清除注销时间选择器状态
      cancellationDatePicker.setDateRange({ from: undefined, to: undefined });
    }
  }, [searchParams.applicationDate, searchParams.applicationDateFrom, searchParams.applicationDateTo, 
      searchParams.cancellationDate, searchParams.cancellationDateFrom, searchParams.cancellationDateTo]);

  // 注销时间筛选应用
  const handleCancellationDateApply = () => {
    const dateFrom = cancellationDatePicker.tempDateRange.from ? 
      cancellationDatePicker.formatDateToLocalString(cancellationDatePicker.tempDateRange.from) : "";
    const dateTo = cancellationDatePicker.tempDateRange.to ? 
      cancellationDatePicker.formatDateToLocalString(cancellationDatePicker.tempDateRange.to) : "";
    const isSingleDay = dateFrom && dateTo && dateFrom === dateTo;
    
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      cancellationDate: isSingleDay ? dateFrom : "",
      cancellationDateFrom: isSingleDay ? "" : dateFrom,
      cancellationDateTo: isSingleDay ? "" : dateTo,
    }));
    
    cancellationDatePicker.applyTempDateRange();
  };

  // 清除注销时间筛选
  const clearCancellationDateFilter = () => {
    cancellationDatePicker.clearDateRange();
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      cancellationDateFrom: "",
      cancellationDateTo: "",
      cancellationDate: "",
    }));
  };

  return (
    <tr>
      <th className="min-w-[120px]">号码</th>
      {showColumns.currentUser && (
        <th className="hidden sm:table-cell">当前使用人</th>
      )}
      {showColumns.applicant && <th>办卡人</th>}
      {showColumns.applicantStatus && <th>办卡人状态</th>}
      <th className="hidden md:table-cell">部门</th>
      <th className="hidden md:table-cell">办卡时间</th>
      <th>
        <div className="flex items-center gap-1">
          <span>号码状态</span>
          {variant !== "risk" && (
          <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${searchParams.status ? 'text-blue-600' : ''}`}
                title={searchParams.status ? `筛选: ${getStatusText(searchParams.status)}` : "筛选号码状态"}
              >
                <Filter className="h-3 w-3" />
                {searchParams.status && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium border-b pb-1">筛选号码状态</div>
                
                <div className="space-y-1">
                  <Button
                    variant={searchParams.status === "" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onFilterChange("status", "");
                      setIsStatusOpen(false);
                    }}
                    className="w-full justify-start h-7 text-xs"
                  >
                    全部状态
                  </Button>
                  
                  {[
                    { value: 'idle', label: '闲置' },
                    { value: 'in_use', label: '使用中' },
                    { value: 'pending_deactivation_user', label: '待注销（员工上报）' },
                    { value: 'pending_deactivation_admin', label: '待注销（系统标记）' },
                    { value: 'deactivated', label: '已注销' },
                    { value: 'suspended', label: '停机保号' },
                    { value: 'card_replacing', label: '补卡中' },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      variant={searchParams.status === item.value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        onFilterChange("status", item.value);
                        setIsStatusOpen(false);
                      }}
                      className="w-full justify-start h-7 text-xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          )}
        </div>
      </th>
      {showColumns.cancellationDate && (
        <th className="hidden lg:table-cell">
          <div className="flex items-center gap-1">
            <span>注销时间</span>
            <Popover open={cancellationDatePicker.isPickerOpen} onOpenChange={cancellationDatePicker.setIsPickerOpen}>
              <PopoverTrigger asChild>
                              <Button
                variant="ghost"
                size="sm"
                className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${
                  searchParams.cancellationDate ||
                  searchParams.cancellationDateFrom ||
                  searchParams.cancellationDateTo ||
                  cancellationDatePicker.dateRange.from || 
                  cancellationDatePicker.dateRange.to ? 'text-blue-600' : ''
                }`}
                title={
                  searchParams.cancellationDate ||
                  searchParams.cancellationDateFrom ||
                  searchParams.cancellationDateTo ||
                  cancellationDatePicker.dateRange.from || 
                  cancellationDatePicker.dateRange.to ? 
                    `筛选: ${
                      searchParams.cancellationDate ? 
                        new Date(searchParams.cancellationDate).toLocaleDateString('zh-CN') :
                        (searchParams.cancellationDateFrom || searchParams.cancellationDateTo) ?
                          `${searchParams.cancellationDateFrom ? new Date(searchParams.cancellationDateFrom).toLocaleDateString('zh-CN') : '开始'} - ${searchParams.cancellationDateTo ? new Date(searchParams.cancellationDateTo).toLocaleDateString('zh-CN') : '结束'}` :
                          cancellationDatePicker.getDateDisplay()
                    }` : 
                    "筛选注销时间"
                }
                onClick={() => {
                  cancellationDatePicker.setTempDateRange(cancellationDatePicker.dateRange);
                  cancellationDatePicker.setIsPickerOpen(true);
                }}
              >
                <Filter className="h-3 w-3" />
                {(searchParams.cancellationDate ||
                  searchParams.cancellationDateFrom ||
                  searchParams.cancellationDateTo ||
                  cancellationDatePicker.dateRange.from || 
                  cancellationDatePicker.dateRange.to) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-center border-b pb-1">
                    {cancellationDatePicker.isWaitingForSecondDate ? (
                      <span className="text-blue-600 animate-pulse">
                        已选择 {cancellationDatePicker.getTempDateDisplay()}
                      </span>
                    ) : cancellationDatePicker.tempDateRange.from || cancellationDatePicker.tempDateRange.to ? (
                      <span>选择: {cancellationDatePicker.getTempDateDisplay()}</span>
                    ) : (
                      <span>点击日期（智能识别单日/范围选择）</span>
                    )}
                  </div>
                  
                  <CalendarComponent
                    mode="range"
                    selected={cancellationDatePicker.tempDateRange as DateRange}
                    onSelect={cancellationDatePicker.handleDateSelect}
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
                      onClick={clearCancellationDateFilter}
                      className="flex-1 h-6 text-xs px-1"
                    >
                      清空
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancellationDatePicker.cancelSelection}
                      className="flex-1 h-6 text-xs px-1"
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCancellationDateApply}
                      className="flex-1 h-6 text-xs px-1"
                      disabled={!cancellationDatePicker.tempDateRange.from}
                    >
                      应用
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </th>
      )}
      <th className="hidden md:table-cell">
        <div className="flex items-center gap-1">
          <span>运营商</span>
          <Popover open={isVendorOpen} onOpenChange={setIsVendorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${searchParams.vendor ? 'text-blue-600' : ''}`}
                title={searchParams.vendor ? `筛选: ${getVendorText(searchParams.vendor)}` : "筛选运营商"}
              >
                <Filter className="h-3 w-3" />
                {searchParams.vendor && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-3" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium border-b pb-1">筛选运营商</div>
                
                <div className="space-y-1">
                  <Button
                    variant={searchParams.vendor === "" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onFilterChange("vendor", "");
                      setIsVendorOpen(false);
                    }}
                    className="w-full justify-start h-7 text-xs"
                  >
                    全部运营商
                  </Button>
                  
                  {['北京联通', '北京电信', '北京第三方', '长春联通'].map((vendor) => (
                    <Button
                      key={vendor}
                      variant={searchParams.vendor === vendor ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        onFilterChange("vendor", vendor);
                        setIsVendorOpen(false);
                      }}
                      className="w-full justify-start h-7 text-xs"
                    >
                      {vendor}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </th>
      {showColumns.purpose && (
        <th className="hidden lg:table-cell">用途</th>
      )}
      <th className="min-w-[140px]">操作</th>
    </tr>
  );
}; 
