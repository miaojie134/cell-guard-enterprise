
import React from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { EmployeeImportForm } from "@/components/EmployeeImportForm";
import { EnhancedPhoneImportForm } from "@/components/EnhancedPhoneImportForm";

const ImportData = () => {
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
          <EnhancedPhoneImportForm />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default ImportData;
