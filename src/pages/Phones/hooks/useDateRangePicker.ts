import { useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";

export interface DateRangeState {
  dateRange: { from?: Date; to?: Date };
  tempDateRange: { from?: Date; to?: Date };
  isPickerOpen: boolean;
  isWaitingForSecondDate: boolean;
  autoConfirmTimer: NodeJS.Timeout | null;
}

export const useDateRangePicker = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [tempDateRange, setTempDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isWaitingForSecondDate, setIsWaitingForSecondDate] = useState(false);
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<NodeJS.Timeout | null>(null);

  // 安全的日期格式化函数
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 智能日期选择处理
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setTempDateRange({});
      return;
    }

    const { from, to } = range;

    if (from && !to) {
      setTempDateRange({ from });
      setIsWaitingForSecondDate(true);

      if (autoConfirmTimer) {
        clearTimeout(autoConfirmTimer);
      }

      const timer = setTimeout(() => {
        setTempDateRange({ from, to: from });
        setIsWaitingForSecondDate(false);
        setAutoConfirmTimer(null);
      }, 500);

      setAutoConfirmTimer(timer);
    } else if (from && to) {
      if (autoConfirmTimer) {
        clearTimeout(autoConfirmTimer);
        setAutoConfirmTimer(null);
      }

      setTempDateRange({ from, to });
      setIsWaitingForSecondDate(false);
    }
  };

  // 清除定时器
  const clearAutoConfirmTimer = () => {
    if (autoConfirmTimer) {
      clearTimeout(autoConfirmTimer);
      setAutoConfirmTimer(null);
    }
  };

  // 获取临时选择显示
  const getTempDateDisplay = () => {
    if (tempDateRange.from && tempDateRange.to) {
      if (tempDateRange.from.getTime() === tempDateRange.to.getTime()) {
        return tempDateRange.from.toLocaleDateString('zh-CN');
      }
      return `${tempDateRange.from.toLocaleDateString('zh-CN')} ~ ${tempDateRange.to.toLocaleDateString('zh-CN')}`;
    }
    if (tempDateRange.from) {
      return tempDateRange.from.toLocaleDateString('zh-CN');
    }
    return "";
  };

  // 获取日期显示
  const getDateDisplay = (placeholder = "选择日期") => {
    if (dateRange.from && dateRange.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        return dateRange.from.toLocaleDateString('zh-CN');
      }
      return `${dateRange.from.toLocaleDateString('zh-CN')} ~ ${dateRange.to.toLocaleDateString('zh-CN')}`;
    }
    if (dateRange.from) {
      return dateRange.from.toLocaleDateString('zh-CN');
    }
    if (dateRange.to) {
      return dateRange.to.toLocaleDateString('zh-CN');
    }
    return placeholder;
  };

  // 清空日期选择
  const clearDateRange = () => {
    setTempDateRange({});
    setDateRange({});
    setIsWaitingForSecondDate(false);
    clearAutoConfirmTimer();
  };

  // 应用临时选择
  const applyTempDateRange = () => {
    setDateRange(tempDateRange);
    setIsPickerOpen(false);
    setIsWaitingForSecondDate(false);
    if (autoConfirmTimer) {
      clearTimeout(autoConfirmTimer);
      setAutoConfirmTimer(null);
    }
  };

  // 取消选择
  const cancelSelection = () => {
    setIsPickerOpen(false);
    setIsWaitingForSecondDate(false);
    clearAutoConfirmTimer();
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoConfirmTimer) {
        clearTimeout(autoConfirmTimer);
      }
    };
  }, [autoConfirmTimer]);

  return {
    dateRange,
    setDateRange,
    tempDateRange,
    setTempDateRange,
    isPickerOpen,
    setIsPickerOpen,
    isWaitingForSecondDate,
    formatDateToLocalString,
    handleDateSelect,
    clearAutoConfirmTimer,
    getTempDateDisplay,
    getDateDisplay,
    clearDateRange,
    applyTempDateRange,
    cancelSelection,
  };
}; 