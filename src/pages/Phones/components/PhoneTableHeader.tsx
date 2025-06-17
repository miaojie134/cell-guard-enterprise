import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
}

interface PhoneTableHeaderProps {
  searchParams: SearchParams;
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

export const PhoneTableHeader: React.FC<PhoneTableHeaderProps> = ({
  searchParams,
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

  return (
    <tr>
      <th className="min-w-[120px]">号码</th>
      <th className="hidden sm:table-cell">当前使用人</th>
      <th>办卡人</th>
      <th>办卡人状态</th>
      <th className="hidden md:table-cell">
        <div className="flex items-center gap-1">
          <span>办卡时间</span>
          <Popover open={applicationDatePicker.isPickerOpen} onOpenChange={applicationDatePicker.setIsPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${applicationDatePicker.dateRange.from || applicationDatePicker.dateRange.to ? 'text-blue-600' : ''}`}
                title={applicationDatePicker.dateRange.from || applicationDatePicker.dateRange.to ? `筛选: ${applicationDatePicker.getDateDisplay()}` : "筛选办卡时间"}
                onClick={() => {
                  applicationDatePicker.setTempDateRange(applicationDatePicker.dateRange);
                  applicationDatePicker.setIsPickerOpen(true);
                }}
              >
                <Filter className="h-3 w-3" />
                {(applicationDatePicker.dateRange.from || applicationDatePicker.dateRange.to) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium text-center border-b pb-1">
                  {applicationDatePicker.isWaitingForSecondDate ? (
                    <span className="text-blue-600 animate-pulse">
                      已选择 {applicationDatePicker.getTempDateDisplay()}
                    </span>
                  ) : applicationDatePicker.tempDateRange.from || applicationDatePicker.tempDateRange.to ? (
                    <span>选择: {applicationDatePicker.getTempDateDisplay()}</span>
                  ) : (
                    <span>点击日期（智能识别单日/范围选择）</span>
                  )}
                </div>
                
                <CalendarComponent
                  mode="range"
                  selected={applicationDatePicker.tempDateRange as DateRange}
                  onSelect={applicationDatePicker.handleDateSelect}
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
                    onClick={clearApplicationDateFilter}
                    className="flex-1 h-6 text-xs px-1"
                  >
                    清空
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={applicationDatePicker.cancelSelection}
                    className="flex-1 h-6 text-xs px-1"
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplicationDateApply}
                    className="flex-1 h-6 text-xs px-1"
                    disabled={!applicationDatePicker.tempDateRange.from}
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
                    onClick={() => onFilterChange("status", "")}
                    className="w-full justify-start h-7 text-xs"
                  >
                    全部状态
                  </Button>
                  
                  {['idle', 'in_use', 'pending_deactivation', 'deactivated', 'risk_pending', 'user_reported'].map((status) => (
                    <Button
                      key={status}
                      variant={searchParams.status === status ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onFilterChange("status", status)}
                      className="w-full justify-start h-7 text-xs"
                    >
                      {getStatusText(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </th>
      <th className="hidden lg:table-cell">
        <div className="flex items-center gap-1">
          <span>注销时间</span>
          <Popover open={cancellationDatePicker.isPickerOpen} onOpenChange={cancellationDatePicker.setIsPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative h-5 w-5 p-0 hover:bg-gray-100 ${cancellationDatePicker.dateRange.from || cancellationDatePicker.dateRange.to ? 'text-blue-600' : ''}`}
                title={cancellationDatePicker.dateRange.from || cancellationDatePicker.dateRange.to ? `筛选: ${cancellationDatePicker.getDateDisplay()}` : "筛选注销时间"}
                onClick={() => {
                  cancellationDatePicker.setTempDateRange(cancellationDatePicker.dateRange);
                  cancellationDatePicker.setIsPickerOpen(true);
                }}
              >
                <Filter className="h-3 w-3" />
                {(cancellationDatePicker.dateRange.from || cancellationDatePicker.dateRange.to) && (
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
      <th className="hidden md:table-cell">运营商</th>
      <th className="hidden lg:table-cell">用途</th>
      <th className="min-w-[140px]">操作</th>
    </tr>
  );
}; 