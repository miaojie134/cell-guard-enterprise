import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SearchBar } from "@/components/SearchBar";
import { Filter } from "lucide-react";
import { useDateRangePicker } from "@/pages/Phones/hooks/useDateRangePicker";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { PhoneSearchParams, getStatusText, getVendorText } from "@/utils/phoneUtils";

interface FilterConfig {
  status?: boolean;
  applicantStatus?: boolean;
  vendor?: boolean;
  applicationDate?: boolean;
  cancellationDate?: boolean;
}

interface UnifiedPhoneFiltersProps {
  searchParams: PhoneSearchParams;
  onSearch: (query: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onUpdateSearchParams: (updater: (prev: PhoneSearchParams) => PhoneSearchParams) => void;
  
  // 筛选配置
  filterConfig?: FilterConfig;
  
  // 样式配置  
  variant?: "default" | "risk";
  
  // 搜索占位符
  searchPlaceholder?: string;
}

export const UnifiedPhoneFilters: React.FC<UnifiedPhoneFiltersProps> = ({
  searchParams,
  onSearch,
  onFilterChange,
  onUpdateSearchParams,
  filterConfig = {
    status: true,
    applicantStatus: false,
    vendor: true,
    applicationDate: true,
    cancellationDate: true,
  },
  variant = "default",
  searchPlaceholder = "搜索号码、使用人、办卡人、部门...",
}) => {
  // 办卡时间筛选
  const applicationDatePicker = useDateRangePicker();
  const cancellationDatePicker = useDateRangePicker();

  // 同步日期筛选状态
  React.useEffect(() => {
    // 同步办卡时间
    if (searchParams.applicationDate) {
      const date = new Date(searchParams.applicationDate);
      applicationDatePicker.setDateRange({ from: date, to: date });
    } else if (searchParams.applicationDateFrom || searchParams.applicationDateTo) {
      applicationDatePicker.setDateRange({
        from: searchParams.applicationDateFrom ? new Date(searchParams.applicationDateFrom) : undefined,
        to: searchParams.applicationDateTo ? new Date(searchParams.applicationDateTo) : undefined,
      });
    } else {
      // 如果没有任何日期筛选参数，清除办卡时间选择器状态
      applicationDatePicker.setDateRange({ from: undefined, to: undefined });
    }

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
    // 先清除日期选择器状态
    applicationDatePicker.clearDateRange();
    cancellationDatePicker.clearDateRange();
    
    // 然后更新搜索参数
    onUpdateSearchParams(prev => ({
      ...prev,
      page: 1,
      status: "",
      applicantStatus: "",
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
    (filterConfig.applicationDate && (
      searchParams.applicationDate || 
      searchParams.applicationDateFrom || 
      searchParams.applicationDateTo ||
      applicationDatePicker.dateRange.from || 
      applicationDatePicker.dateRange.to
    )) ||
    (filterConfig.cancellationDate && (
      searchParams.cancellationDate ||
      searchParams.cancellationDateFrom ||
      searchParams.cancellationDateTo ||
      cancellationDatePicker.dateRange.from || 
      cancellationDatePicker.dateRange.to
    )) ||
    (filterConfig.status && searchParams.status) ||
    (filterConfig.applicantStatus && searchParams.applicantStatus) ||
    (filterConfig.vendor && searchParams.vendor)
  );

  // 筛选条件区域统一使用蓝色主题（不区分风险号码和普通号码）
  const getFilterBarColor = () => {
    return "text-blue-700 bg-blue-50 border-blue-300";
  };

  const getFilterButtonColor = () => {
    return "bg-white border-blue-200";
  };

  const getFilterIndicatorColor = () => {
    return "text-blue-600";
  };

  const getFilterTextColor = () => {
    return "text-blue-800";
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
      <SearchBar
        onSearch={onSearch}
        placeholder={searchPlaceholder}
      />
      
      <div className="flex flex-wrap gap-2">
        {/* 活跃筛选条件显示区域 */}
        {hasActiveFilters && (
          <div className={`flex items-center gap-2 text-xs ${getFilterBarColor()} rounded-md px-3 py-1.5`}>
            <Filter className={`h-3 w-3 ${getFilterIndicatorColor()}`} />
            <span className="font-medium">筛选:</span>
            
            {/* 号码状态筛选条件 */}
            {filterConfig.status && searchParams.status && (
              <div className={`flex items-center gap-1 ${getFilterButtonColor()} rounded px-2 py-0.5`}>
                <span>号码状态</span>
                <span className={`font-medium ${getFilterTextColor()}`}>{getStatusText(searchParams.status)}</span>
                <button
                  onClick={() => onFilterChange("status", "all")}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除号码状态筛选"
                >
                  ×
                </button>
              </div>
            )}

            {/* 办卡人状态筛选条件 */}
            {filterConfig.applicantStatus && searchParams.applicantStatus && (
              <div className={`flex items-center gap-1 ${getFilterButtonColor()} rounded px-2 py-0.5`}>
                <span>办卡人状态</span>
                <span className={`font-medium ${getFilterTextColor()}`}>
                  {searchParams.applicantStatus === "Active" ? "在职" : "离职"}
                </span>
                <button
                  onClick={() => onFilterChange("applicantStatus", "all")}
                  className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1"
                  title="清除办卡人状态筛选"
                >
                  ×
                </button>
              </div>
            )}

            {/* 供应商筛选条件 */}
            {filterConfig.vendor && searchParams.vendor && (
              <div className={`flex items-center gap-1 ${getFilterButtonColor()} rounded px-2 py-0.5`}>
                <span>供应商</span>
                <span className={`font-medium ${getFilterTextColor()}`}>{getVendorText(searchParams.vendor)}</span>
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
            {filterConfig.applicationDate && (
              searchParams.applicationDate || 
              searchParams.applicationDateFrom || 
              searchParams.applicationDateTo ||
              applicationDatePicker.dateRange.from || 
              applicationDatePicker.dateRange.to
            ) && (
              <div className={`flex items-center gap-1 ${getFilterButtonColor()} rounded px-2 py-0.5`}>
                <span>办卡时间</span>
                <span className={`font-medium ${getFilterTextColor()}`}>
                  {searchParams.applicationDate ? 
                    new Date(searchParams.applicationDate).toLocaleDateString('zh-CN') :
                    (searchParams.applicationDateFrom || searchParams.applicationDateTo) ?
                      `${searchParams.applicationDateFrom ? new Date(searchParams.applicationDateFrom).toLocaleDateString('zh-CN') : '开始'} - ${searchParams.applicationDateTo ? new Date(searchParams.applicationDateTo).toLocaleDateString('zh-CN') : '结束'}` :
                      applicationDatePicker.getDateDisplay()
                  }
                </span>
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
            {filterConfig.cancellationDate && (
              searchParams.cancellationDate ||
              searchParams.cancellationDateFrom ||
              searchParams.cancellationDateTo ||
              cancellationDatePicker.dateRange.from || 
              cancellationDatePicker.dateRange.to
            ) && (
              <div className={`flex items-center gap-1 ${getFilterButtonColor()} rounded px-2 py-0.5`}>
                <span>注销时间</span>
                <span className={`font-medium ${getFilterTextColor()}`}>
                  {searchParams.cancellationDate ? 
                    new Date(searchParams.cancellationDate).toLocaleDateString('zh-CN') :
                    (searchParams.cancellationDateFrom || searchParams.cancellationDateTo) ?
                      `${searchParams.cancellationDateFrom ? new Date(searchParams.cancellationDateFrom).toLocaleDateString('zh-CN') : '开始'} - ${searchParams.cancellationDateTo ? new Date(searchParams.cancellationDateTo).toLocaleDateString('zh-CN') : '结束'}` :
                      cancellationDatePicker.getDateDisplay()
                  }
                </span>
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
              className={`${getFilterIndicatorColor()} hover:text-red-800 underline text-xs`}
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