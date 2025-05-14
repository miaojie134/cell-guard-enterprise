
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
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ImportResult } from "@/types";

interface ImportFormProps {
  title: string;
  description: string;
  templateFields: string[];
  onImport: (data: any[]) => Promise<ImportResult>;
}

export const ImportForm: React.FC<ImportFormProps> = ({
  title,
  description,
  templateFields,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

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
    try {
      // In a real app, we'd use a proper CSV/Excel parser
      // For this demo, we'll simulate parsing with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on file name
      const mockData = Array(10).fill(null).map((_, i) => {
        const item: Record<string, any> = {};
        templateFields.forEach(field => {
          item[field] = `${field}_${i + 1}`;
        });
        return item;
      });
      
      const importResult = await onImport(mockData);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: 0,
        failed: 0,
        errors: ["导入过程中发生错误，请检查文件格式是否正确。"],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // In a real app, this would generate a proper template file
    alert("下载模板功能将在正式版本中提供");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed rounded-md p-8 text-center">
            {file ? (
              <div className="space-y-2">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFile(null)}
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
                    支持 .xlsx, .xls, .csv 格式
                  </p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
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
                        <li key={i}>{error}</li>
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
        <p>请确保数据格式正确，避免导入重复或无效数据</p>
      </CardFooter>
    </Card>
  );
};

export default ImportForm;
