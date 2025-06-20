import { APIResponse, API_CONFIG } from '@/config/api';
import { apiFetch } from './api';

export interface EmployeeImportResponse {
  data: {
    errorCount: number;
    errors: Array<{
      reason: string;
      rowData: string[];
      rowNumber: number;
    }>;
    message: string;
    successCount: number;
  };
  message: string;
  status: string;
}

export interface EmployeeImportError {
  details: string;
  error: string;
}

export class EmployeeImportService {
  /**
   * 批量导入员工数据
   * @param file CSV文件
   * @returns 导入结果
   */
  async importEmployees(file: File): Promise<EmployeeImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(`${API_CONFIG.BASE_URL}/employees/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData: EmployeeImportError = await response.json();
        throw new Error(errorData.details || errorData.error || '请求错误');
      } else if (response.status === 401) {
        throw new Error('未认证，Token无效/过期');
      } else {
        throw new Error(`导入失败: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  /**
 * 生成CSV模板内容
 * @returns CSV模板字符串
 */
  generateCsvTemplate(): string {
    const headers = ['fullName', 'phoneNumber', 'email', 'department', 'hireDate'];
    const sampleData = [
      ['张三', '13800138001', 'zhangsan@knowbox.cn', '技术部', '2024-01-15'],
      ['李四', '138****9077', 'lisi@knowbox.cn', '市场部', '2024-02-01'],
      ['王五', '159****8888', 'wangwu@knowbox.cn', '人事部', '2024-03-01'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * 下载CSV模板
   */
  downloadCsvTemplate(): void {
    const csvContent = this.generateCsvTemplate();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', '员工导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const employeeImportService = new EmployeeImportService(); 