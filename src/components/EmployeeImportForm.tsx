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
import { employeeImportService } from "@/services/employeeImportService";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    reason: string;
    rowData: string[];
    rowNumber: number;
  }>;
}

export const EmployeeImportForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await employeeImportService.importEmployees(file);
      
      const importResult: ImportResult = {
        success: response.data.successCount,
        failed: response.data.errorCount,
        errors: response.data.errors,
      };
      
      setResult(importResult);
      
      if (response.data.errorCount === 0) {
        toast({
          title: "导入成功",
          description: `成功导入 ${response.data.successCount} 位员工`,
        });
      } else {
        toast({
          title: "部分导入成功",
          description: `成功导入 ${response.data.successCount} 位员工，${response.data.errorCount} 条记录失败`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入过程中发生错误';
      setResult({
        success: 0,
        failed: 0,
        errors: [{ reason: errorMessage, rowData: [], rowNumber: 0 }],
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
    try {
      employeeImportService.downloadCsvTemplate();
      toast({
        title: "模板下载成功",
        description: "已下载员工导入模板",
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "模板下载失败，请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>员工数据批量导入</CardTitle>
        <CardDescription>
          从CSV文件批量导入员工数据，请确保文件格式正确
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
              <AlertTitle>导入结果</AlertTitle>
              <AlertDescription>
                成功: {result.success} 条记录
                {result.failed > 0 && (
                  <>
                    <br />
                    失败: {result.failed} 条记录
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          第{error.rowNumber}行: {error.reason}
                          {error.rowData.length > 0 && ` (数据: ${error.rowData.join(', ')})`}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...还有 {result.errors.length - 5} 个错误</li>
                      )}
                    </ul>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
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
          请确保数据格式正确，避免导入重复或无效数据
        </p>
      </CardFooter>
    </Card>
  );
};

export default EmployeeImportForm; 