// src/config/api/inventory.ts

// API 基础配置
import { API_CONFIG } from './base';

// 定义盘点相关的API端点
export const API_INVENTORY_ENDPOINTS = {
  ADMIN_TASKS: `${API_CONFIG.BASE_URL}/inventory/tasks`,
  EMPLOYEE_TASKS_BASE: `${API_CONFIG.BASE_URL}/employee/inventory/tasks`,
  EMPLOYEE_ACTIVE_TASKS: `${API_CONFIG.BASE_URL}/employee/inventory/tasks/active`,
};
