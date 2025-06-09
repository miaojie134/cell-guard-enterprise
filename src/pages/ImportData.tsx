
import React from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ImportForm } from "@/components/ImportForm";
import { EmployeeImportForm } from "@/components/EmployeeImportForm";

const ImportData = () => {
  const { importPhones } = useData();
  
  const phoneFields = ["number", "registrant", "registrationDate", "provider", "status"];
  
  return (
    <MainLayout title="数据导入">
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="employees">员工导入</TabsTrigger>
          <TabsTrigger value="phones">号码导入</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees">
          <EmployeeImportForm />
        </TabsContent>
        
        <TabsContent value="phones">
          <ImportForm
            title="手机号码批量导入"
            description="从Excel或CSV文件批量导入手机号码数据，请确保文件格式正确"
            templateFields={phoneFields}
            onImport={importPhones}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default ImportData;
