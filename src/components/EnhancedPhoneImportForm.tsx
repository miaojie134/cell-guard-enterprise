import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { enhancedImportPhones, EnhancedImportResult, EnhancedImportData } from "@/services/phoneService";
import { APIResponse } from "@/config/api/base";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    rowData: string[];
    reason: string;
  }>;
  message: string;
}

const STORAGE_KEY = 'enhanced_phone_import_result';

export const EnhancedPhoneImportForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const { toast } = useToast();

  // 状态中文映射
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'idle': '闲置',
      'in_use': '使用中',
      'pending_deactivation': '待注销',
      'pending_deactivation_user': '待注销（员工上报）',
      'pending_deactivation_admin': '待注销（系统标记）',
      'deactivated': '已注销',
      'risk_pending': '待核实-办卡人离职',
      'user_reported': '待核实-用户报告',
      'suspended': '停机保号',
      'card_replacing': '补卡中'
    };
    return statusLabels[status] || status;
  };

  // 英文状态到中文状态的映射（用于失败记录显示）
  const getChineseStatus = (englishStatus: string): string => {
    const statusMap: Record<string, string> = {
      'idle': '闲置',
      'in_use': '使用中',
      'pending_deactivation': '待注销',
      'pending_deactivation_user': '待注销（员工上报）',
      'pending_deactivation_admin': '待注销（系统标记）',
      'deactivated': '已注销',
      'risk_pending': '待核实-办卡人离职',
      'user_reported': '待核实-用户报告',
      'suspended': '停机保号',
      'card_replacing': '补卡中'
    };
    return statusMap[englishStatus] || englishStatus;
  };

  // 保存导入结果到localStorage
  const saveImportResult = (importResult: ImportResult) => {
    try {
      const dataToSave = {
        ...importResult,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存导入结果失败:', error);
    }
  };

  // 从localStorage恢复导入结果
  const loadImportResult = (): ImportResult | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.timestamp) {
          const savedTime = new Date(data.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff <= 24) {
            return {
              success: data.success,
              failed: data.failed,
              errors: data.errors || [],
              message: data.message
            };
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('恢复导入结果失败:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  };

  // 清除保存的导入结果
  const clearImportResult = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setHasRestoredData(false);
  };

  // 组件初始化时恢复之前的导入结果
  React.useEffect(() => {
    const savedResult = loadImportResult();
    if (savedResult) {
      setResult(savedResult);
      setHasRestoredData(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // 开始新的导入前，清除之前的结果和恢复状态
    setResult(null);
    setHasRestoredData(false);
    localStorage.removeItem(STORAGE_KEY);

    setIsLoading(true);
    try {
      const response: APIResponse<EnhancedImportResult> = await enhancedImportPhones(file);
      
      // 根据实际API响应结构解析数据
      let importData: EnhancedImportData;
      
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        
        if (typeof data.successCount === 'number' && typeof data.errorCount === 'number') {
          importData = {
            message: data.message || '导入完成',
            successCount: data.successCount,
            errorCount: data.errorCount,
            errors: Array.isArray(data.errors) ? data.errors : []
          };
        } else if (data.data && typeof data.data === 'object' && 
                   typeof data.data.successCount === 'number' && 
                   typeof data.data.errorCount === 'number') {
          importData = {
            message: data.data.message || data.message || '导入完成',
            successCount: data.data.successCount,
            errorCount: data.data.errorCount,
            errors: Array.isArray(data.data.errors) ? data.data.errors : []
          };
        } else {
          throw new Error('API响应格式错误：无法解析导入结果数据');
        }
      } else {
        throw new Error('API响应格式错误：data字段格式不正确');
      }
      
      const newResult: ImportResult = {
        success: importData.successCount,
        failed: importData.errorCount,
        errors: importData.errors,
        message: importData.message
      };
      
      setResult(newResult);
      saveImportResult(newResult);
      
      if (importData.errorCount === 0) {
        toast({
          title: "导入成功",
          description: `成功导入 ${importData.successCount} 个手机号码`,
        });
      } else {
        toast({
          title: "部分导入成功",
          description: `成功导入 ${importData.successCount} 个，${importData.errorCount} 个失败`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('导入错误:', error);
      const errorMessage = error instanceof Error ? error.message : "导入过程中发生错误，请检查文件格式是否正确。";
      setResult({
        success: 0,
        failed: 0,
        errors: [],
        message: errorMessage
      });
      
      toast({
        title: "导入失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // 创建CSV模板文件（使用中文状态）
    const headers = ['phoneNumber', 'applicantName', 'applicationDate', 'currentUserName', 'status', 'purpose', 'vendor', 'departmentName', 'remarks', 'assignmentDate', 'applicantEmail', 'currentUserEmail'];
    const sampleData = [
      ['13800138001', '张三', '2023-01-15', '', '闲置', '办公用', '中国移动', '技术部', '备用号码', '', 'zhangsan@company.com', ''],
      ['13800138002', '李四', '2023-01-16', '王五', '使用中', '客户联系', '中国联通', '销售部', '重要号码', '2023-02-01', 'lisi@company.com', 'wangwu@company.com'],
      ['13800138003', '赵六', '2022-12-01', '', '已注销', '个人使用', '中国电信', '人事部', '已停用', '', 'zhaoliu@company.com', '']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.join(','))
      .join('\n');
    
    // 添加UTF-8 BOM来避免中文乱码
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '手机号码导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "模板下载成功",
      description: "已下载手机号码导入模板",
    });
  };

  const downloadErrorRecords = () => {
    if (!result || !result.errors || result.errors.length === 0) return;

    // 创建失败记录CSV文件
    const headers = ['行号', 'phoneNumber', 'applicantName', 'applicationDate', 'currentUserName', 'status', 'purpose', 'vendor', 'departmentName', 'remarks', 'assignmentDate', 'applicantEmail', 'currentUserEmail', '失败原因'];
    const errorData = result.errors.map(error => {
      // 后端返回的数据结构：phoneNumber, applicantName, applicationDate, currentUserName, status, purpose, vendor, departmentName, remarks, assignmentDate, (可能包含)applicantEmail, currentUserEmail
      // 前端模板结构：phoneNumber, applicantName, applicationDate, currentUserName, status, purpose, vendor, departmentName, remarks, assignmentDate, applicantEmail, currentUserEmail
      const originalData = [...error.rowData];
      
      // 转换状态字段（第5个字段，索引为4）为中文
      if (originalData[4]) {
        originalData[4] = getChineseStatus(originalData[4]);
      }
      
      // 如果是旧格式（10字段），需要在末尾添加两个空的邮箱字段
      // 如果是新格式（12字段），直接使用
      const adjustedRowData = originalData.length === 10 
        ? [...originalData, '', '']  // 旧格式，末尾添加两个空邮箱字段
        : originalData;              // 新格式，直接使用
      
      const row = [
        error.rowNumber.toString(),
        ...adjustedRowData,
        error.reason
      ];
      return row;
    });
    
    const csvContent = [headers, ...errorData]
      .map(row => row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
      .join('\n');
    
    // 添加UTF-8 BOM来避免中文乱码
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // 生成带时间戳的文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
    link.setAttribute('download', `导入失败记录_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "下载成功",
      description: "已下载失败记录文件",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>手机号码批量导入</CardTitle>
        <CardDescription>
          从CSV文件批量导入手机号码数据，支持完整的资产状态管理
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            {file ? (
              <div className="space-y-3">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="font-medium text-green-800">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFile(null)}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  更换文件
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">点击或拖拽文件到此处上传</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    支持 .csv 格式
                  </p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>选择文件</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
          
          {result && (
            <Alert variant={result.failed > 0 ? "destructive" : "default"}>
              {result.failed > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle className="flex items-center justify-between">
                <span>导入结果</span>
                <Button 
                  type="button" 
                  variant="ghost"
                  size="sm"
                  onClick={clearImportResult}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  清除
                </Button>
              </AlertTitle>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div className="space-x-4">
                    <span>成功: {result.success} 条记录</span>
                    {result.failed > 0 && <span>失败: {result.failed} 条记录</span>}
                  </div>
                  {result.failed > 0 && (
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorRecords}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载失败记录
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              下载模板
            </Button>
            <Button 
              type="submit" 
              disabled={!file || isLoading}
            >
              {isLoading ? "导入中..." : "开始导入"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm text-muted-foreground">
        <p>
          手机号码状态值支持：闲置、使用中、待注销、已注销、待核实-办卡人离职、待核实-用户报告
        </p>
      </CardFooter>
    </Card>
  );
};

export default EnhancedPhoneImportForm; 
