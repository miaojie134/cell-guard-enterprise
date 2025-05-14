
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Employee, 
  PhoneNumber, 
  PhoneUsageHistory, 
  PaginatedData, 
  SearchParams 
} from "@/types";
import { useToast } from "@/hooks/use-toast";

// Sample data
import { sampleEmployees, samplePhoneNumbers, samplePhoneHistory } from "@/data/sampleData";

interface DataContextType {
  // Employees
  employees: Employee[];
  getEmployees: (params?: SearchParams) => PaginatedData<Employee>;
  getEmployeeById: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  
  // Phone Numbers
  phoneNumbers: PhoneNumber[];
  getPhoneNumbers: (params?: SearchParams) => PaginatedData<PhoneNumber>;
  getPhoneById: (id: string) => PhoneNumber | undefined;
  addPhone: (phone: Omit<PhoneNumber, "id">) => void;
  updatePhone: (id: string, data: Partial<PhoneNumber>) => void;
  
  // Phone Usage
  phoneHistory: PhoneUsageHistory[];
  getPhoneHistory: (phoneId: string) => PhoneUsageHistory[];
  assignPhone: (phoneId: string, employeeId: string) => void;
  recoverPhone: (phoneId: string) => void;
  
  // Risk Management
  getRiskPhones: () => PhoneNumber[];
  
  // Import Data
  importEmployees: (data: any[]) => Promise<{success: number, failed: number, errors: string[]}>;
  importPhones: (data: any[]) => Promise<{success: number, failed: number, errors: string[]}>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneHistory, setPhoneHistory] = useState<PhoneUsageHistory[]>([]);
  const { toast } = useToast();

  // Load sample data
  useEffect(() => {
    setEmployees(sampleEmployees);
    setPhoneNumbers(samplePhoneNumbers);
    setPhoneHistory(samplePhoneHistory);
  }, []);

  // Employee functions
  const getEmployees = (params?: SearchParams): PaginatedData<Employee> => {
    let filtered = [...employees];

    // Apply search query
    if (params?.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(
        (emp) => 
          emp.name.toLowerCase().includes(query) || 
          emp.employeeId.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (params?.filters) {
      if (params.filters.status) {
        filtered = filtered.filter(emp => emp.status === params.filters!.status);
      }
      if (params.filters.department) {
        filtered = filtered.filter(emp => emp.department === params.filters!.department);
      }
    }

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const total = filtered.length;
    const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
    };
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const addEmployee = (employee: Omit<Employee, "id">): void => {
    const newEmployee: Employee = {
      ...employee,
      id: String(Date.now()),
    };
    setEmployees(prev => [...prev, newEmployee]);
    toast({
      title: "添加成功",
      description: `已添加员工 ${employee.name}`,
    });
  };

  const updateEmployee = (id: string, data: Partial<Employee>): void => {
    const employeeIndex = employees.findIndex(emp => emp.id === id);
    
    if (employeeIndex === -1) {
      toast({
        title: "操作失败",
        description: "未找到该员工",
        variant: "destructive",
      });
      return;
    }
    
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex] = {
      ...updatedEmployees[employeeIndex],
      ...data,
    };
    setEmployees(updatedEmployees);
    
    // If employee is marked as inactive, check for assigned phones
    if (data.status === "inactive") {
      const employeeId = employees[employeeIndex].employeeId;
      
      // Update phone numbers where this employee is the registrant
      const updatedPhones = phoneNumbers.map(phone => {
        if (phone.registrantId === employeeId) {
          return { 
            ...phone, 
            registrantStatus: "inactive" 
          };
        }
        return phone;
      });
      
      setPhoneNumbers(updatedPhones);
      
      toast({
        title: "员工状态已更新",
        description: "相关手机号码信息已一并更新",
      });
    } else {
      toast({
        title: "更新成功",
        description: "员工信息已更新",
      });
    }
  };

  // Phone functions
  const getPhoneNumbers = (params?: SearchParams): PaginatedData<PhoneNumber> => {
    let filtered = [...phoneNumbers];

    // Apply search query
    if (params?.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(
        (phone) => 
          phone.number.toLowerCase().includes(query) || 
          phone.registrant.toLowerCase().includes(query) ||
          (phone.currentUser && phone.currentUser.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (params?.filters) {
      if (params.filters.status) {
        filtered = filtered.filter(phone => phone.status === params.filters!.status);
      }
      if (params.filters.registrantStatus) {
        filtered = filtered.filter(phone => phone.registrantStatus === params.filters!.registrantStatus);
      }
      if (params.filters.provider) {
        filtered = filtered.filter(phone => phone.provider === params.filters!.provider);
      }
    }

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const total = filtered.length;
    const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
    };
  };

  const getPhoneById = (id: string): PhoneNumber | undefined => {
    return phoneNumbers.find(phone => phone.id === id);
  };

  const addPhone = (phone: Omit<PhoneNumber, "id">): void => {
    const newPhone: PhoneNumber = {
      ...phone,
      id: String(Date.now()),
    };
    setPhoneNumbers(prev => [...prev, newPhone]);
    toast({
      title: "添加成功",
      description: `已添加手机号 ${phone.number}`,
    });
  };

  const updatePhone = (id: string, data: Partial<PhoneNumber>): void => {
    const phoneIndex = phoneNumbers.findIndex(phone => phone.id === id);
    
    if (phoneIndex === -1) {
      toast({
        title: "操作失败",
        description: "未找到该手机号",
        variant: "destructive",
      });
      return;
    }
    
    const updatedPhones = [...phoneNumbers];
    updatedPhones[phoneIndex] = {
      ...updatedPhones[phoneIndex],
      ...data,
    };
    setPhoneNumbers(updatedPhones);
    toast({
      title: "更新成功",
      description: "手机号信息已更新",
    });
  };

  // Phone Usage functions
  const getPhoneHistory = (phoneId: string): PhoneUsageHistory[] => {
    return phoneHistory.filter(history => history.phoneId === phoneId);
  };

  const assignPhone = (phoneId: string, employeeId: string): void => {
    const phoneIndex = phoneNumbers.findIndex(phone => phone.id === phoneId);
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (phoneIndex === -1 || !employee) {
      toast({
        title: "操作失败",
        description: "未找到手机号或员工",
        variant: "destructive",
      });
      return;
    }
    
    // Update phone status and assign to employee
    const updatedPhones = [...phoneNumbers];
    updatedPhones[phoneIndex] = {
      ...updatedPhones[phoneIndex],
      currentUser: employee.name,
      currentUserId: employee.employeeId,
      status: "active",
    };
    setPhoneNumbers(updatedPhones);
    
    // Add usage history
    const newHistory: PhoneUsageHistory = {
      id: String(Date.now()),
      phoneId,
      userId: employee.employeeId,
      userName: employee.name,
      startDate: new Date().toISOString().split("T")[0],
    };
    setPhoneHistory(prev => [...prev, newHistory]);
    
    toast({
      title: "分配成功",
      description: `手机号 ${phoneNumbers[phoneIndex].number} 已分配给 ${employee.name}`,
    });
  };

  const recoverPhone = (phoneId: string): void => {
    const phoneIndex = phoneNumbers.findIndex(phone => phone.id === phoneId);
    
    if (phoneIndex === -1) {
      toast({
        title: "操作失败",
        description: "未找到该手机号",
        variant: "destructive",
      });
      return;
    }
    
    // Update phone status
    const updatedPhones = [...phoneNumbers];
    updatedPhones[phoneIndex] = {
      ...updatedPhones[phoneIndex],
      currentUser: undefined,
      currentUserId: undefined,
      status: "inactive",
    };
    setPhoneNumbers(updatedPhones);
    
    // Update usage history
    const updatedHistory = phoneHistory.map(history => {
      if (history.phoneId === phoneId && !history.endDate) {
        return {
          ...history,
          endDate: new Date().toISOString().split("T")[0],
        };
      }
      return history;
    });
    setPhoneHistory(updatedHistory);
    
    toast({
      title: "回收成功",
      description: `手机号 ${phoneNumbers[phoneIndex].number} 已回收`,
    });
  };

  // Risk Management functions
  const getRiskPhones = (): PhoneNumber[] => {
    return phoneNumbers.filter(
      phone => phone.registrantStatus === "inactive" && phone.status !== "cancelled"
    );
  };

  // Import functions
  const importEmployees = async (data: any[]): Promise<{success: number, failed: number, errors: string[]}> => {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    const newEmployees: Employee[] = [];
    
    data.forEach((item, index) => {
      try {
        // Validate required fields
        if (!item.employeeId || !item.name || !item.department) {
          throw new Error(`行 ${index + 1}: 缺少必填字段`);
        }
        
        // Check for duplicate employee IDs
        if (employees.some(emp => emp.employeeId === item.employeeId) || 
            newEmployees.some(emp => emp.employeeId === item.employeeId)) {
          throw new Error(`行 ${index + 1}: 员工工号 ${item.employeeId} 已存在`);
        }
        
        const newEmployee: Employee = {
          id: String(Date.now() + index),
          employeeId: item.employeeId,
          name: item.name,
          department: item.department,
          status: item.status || "active",
          joinDate: item.joinDate || new Date().toISOString().split("T")[0],
          leaveDate: item.leaveDate || undefined,
        };
        
        newEmployees.push(newEmployee);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(error instanceof Error ? error.message : `行 ${index + 1}: 未知错误`);
      }
    });
    
    if (newEmployees.length > 0) {
      setEmployees(prev => [...prev, ...newEmployees]);
    }
    
    return result;
  };

  const importPhones = async (data: any[]): Promise<{success: number, failed: number, errors: string[]}> => {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    const newPhones: PhoneNumber[] = [];
    
    data.forEach((item, index) => {
      try {
        // Validate required fields
        if (!item.number || !item.registrant || !item.registrationDate || !item.provider) {
          throw new Error(`行 ${index + 1}: 缺少必填字段`);
        }
        
        // Check for duplicate numbers
        if (phoneNumbers.some(phone => phone.number === item.number) || 
            newPhones.some(phone => phone.number === item.number)) {
          throw new Error(`行 ${index + 1}: 手机号码 ${item.number} 已存在`);
        }
        
        // Find registrant
        const registrant = employees.find(emp => 
          emp.name === item.registrant || emp.employeeId === item.registrantId
        );
        
        const newPhone: PhoneNumber = {
          id: String(Date.now() + index),
          number: item.number,
          registrant: registrant?.name || item.registrant,
          registrantId: registrant?.employeeId || item.registrantId || "unknown",
          registrantStatus: registrant?.status || "active",
          registrationDate: item.registrationDate,
          provider: item.provider,
          status: item.status || "inactive",
          notes: item.notes,
        };
        
        newPhones.push(newPhone);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(error instanceof Error ? error.message : `行 ${index + 1}: 未知错误`);
      }
    });
    
    if (newPhones.length > 0) {
      setPhoneNumbers(prev => [...prev, ...newPhones]);
    }
    
    return result;
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        getEmployees,
        getEmployeeById,
        addEmployee,
        updateEmployee,
        
        phoneNumbers,
        getPhoneNumbers,
        getPhoneById,
        addPhone,
        updatePhone,
        
        phoneHistory,
        getPhoneHistory,
        assignPhone,
        recoverPhone,
        
        getRiskPhones,
        
        importEmployees,
        importPhones,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
