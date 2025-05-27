import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将ISO时间格式转换为YYYY-MM-DD格式
 * @param isoString ISO时间字符串，如 "2025-05-27T00:00:00Z"
 * @returns 格式化后的日期字符串，如 "2025-05-27"
 */
export function formatDateFromISO(isoString: string): string {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Invalid date format:', isoString);
    return isoString;
  }
}
