import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SearchBar } from "@/components/SearchBar";
import { Filter } from "lucide-react";
import { useDateRangePicker } from "../hooks/useDateRangePicker";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

interface SearchParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  applicantStatus: string;
  applicationDateFrom: string;
  applicationDateTo: string;
  applicationDate: string;
  cancellationDateFrom: string;
  cancellationDateTo: string;
  cancellationDate: string;
  vendor: string;
}

interface PhoneFiltersProps {
  searchParams: SearchParams;
  onSearch: (query: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: SearchParams) => SearchParams) => void;
}

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

const getVendorText = (vendor: string) => {
  const vendorMap: Record<string, string> = {
    '北京联通': '北京联通',
    '北京电信': '北京电信',
    '北京第三方': '北京第三方',
    '长春联通': '长春联通',
  };
  return vendorMap[vendor] || vendor;
};

export const PhoneFilters: React.FC<PhoneFiltersProps> = ({
  searchParams,
  onSearch,
  onFilterChange,
  onUpdateSearchParams,
}) => {
  // 办卡时间筛选
  const applicationDatePicker = useDateRangePicker();
  const cancellationDatePicker = useDateRangePicker();

  // 办卡时间筛选应用
  const handleApplicationDateApply = () => {
    const dateFrom = applicationDatePicker.tempDateRange.from ? 
      applicationDatePicker.formatDateToLocalString(applicationDatePicker.tempDateRange.from) : "";
    const dateTo = applicationDatePicker.tempDateRange.to ? 
      applicationDatePicker.formatDateToLocalString(applicationDatePicker.tempDateRange.to) : "";
    const isSingleDay = dateFrom && dateTo && dateFrom === dateTo;
    
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      applicationDate: isSingleDay ? dateFrom : "",
      applicationDateFrom: isSingleDay ? "" : dateFrom,
      applicationDateTo: isSingleDay ? "" : dateTo,
    }));
    
    applicationDatePicker.applyTempDateRange();
  };

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

  // 清除办卡时间筛选
  const clearApplicationDateFilter = () => {
    applicationDatePicker.clearDateRange();
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      applicationDateFrom: "",
      applicationDateTo: "",
      applicationDate: "",
    }));
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

  // 清除所有筛选
  const clearAllFilters = () => {
    applicationDatePicker.clearDateRange();
    cancellationDatePicker.clearDateRange();
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      status: "",
      vendor: "",
      applicationDateFrom: "",
      applicationDateTo: "",
      applicationDate: "",
      cancellationDateFrom: "",
      cancellationDateTo: "",
      cancellationDate: "",
    }));
  };

  const hasActiveFilters = (
    applicationDatePicker.dateRange.from || 
    applicationDatePicker.dateRange.to || 
    cancellationDatePicker.dateRange.from || 
    cancellationDatePicker.dateRange.to || 
    searchParams.status ||
    searchParams.vendor
  );

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
      <SearchBar
        onSearch={onSearch}
        placeholder="搜索号码、使用人、办卡人、部门..."
      />
      
      <div className="flex flex-wrap gap-2">
        {/* 活跃筛选条件显示区域 */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-300 rounded-md px-3 py-1.5">
            <Filter className="h-3 w-3 text-blue-600" />
            <span className="font-medium">筛选:</span>
            
            {/* 号码状态筛选条件 */}
            {searchParams.status && (
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                <span>号码状态</span>
                <span className="font-medium text-blue-800">{getStatusText(searchParams.status)}</span>
                <button
                  onClick={() => onFilterChange("status", "all")}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除号码状态筛选"
                >
                  ×
                </button>
              </div>
            )}

            {/* 供应商筛选条件 */}
            {searchParams.vendor && (
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                <span>供应商</span>
                <span className="font-medium text-blue-800">{getVendorText(searchParams.vendor)}</span>
                <button
                  onClick={() => onFilterChange("vendor", "all")}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除供应商筛选"
                >
                  ×
                </button>
              </div>
            )}

            {/* 办卡时间筛选条件 */}
            {(applicationDatePicker.dateRange.from || applicationDatePicker.dateRange.to) && (
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                <span>办卡时间</span>
                <span className="font-medium text-blue-800">{applicationDatePicker.getDateDisplay()}</span>
                <button
                  onClick={clearApplicationDateFilter}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除办卡时间筛选"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* 注销时间筛选条件 */}
            {(cancellationDatePicker.dateRange.from || cancellationDatePicker.dateRange.to) && (
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-0.5">
                <span>注销时间</span>
                <span className="font-medium text-blue-800">{cancellationDatePicker.getDateDisplay()}</span>
                <button
                  onClick={clearCancellationDateFilter}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除注销时间筛选"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* 清除所有筛选 */}
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
              title="清除所有筛选"
            >
              清除所有
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 