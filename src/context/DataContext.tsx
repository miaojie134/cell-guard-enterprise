import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  Employee,
  PhoneNumber,
  PhoneUsage,
  PhoneAssign,
  ImportResult,
  PhoneUsageHistory,
  FRONTEND_EMPLOYMENT_STATUS,
  FRONTEND_PHONE_STATUS,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { sampleEmployees, samplePhoneNumbers, samplePhoneHistory } from "@/data/sampleData";

type DataContextType = {
  employees: Employee[];
  phoneNumbers: PhoneNumber[];
  phoneUsage: PhoneUsage[];
  phoneAssigns: PhoneAssign[];
  loading: boolean;
  error: string | null;
  getEmployeeById: (id: string) => Employee | undefined;
  getPhoneById: (id: string) => PhoneNumber | null;
  getPhoneNumbers: (searchParams: any) => {
    data: PhoneNumber[];
    total: number;
  };
  getEmployees: (searchParams: any) => {
    data: Employee[];
    total: number;
  };
  getRiskPhones: () => PhoneNumber[];
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addPhone: (phone: Omit<PhoneNumber, "id">) => void;
  updatePhone: (id: string, updates: Partial<PhoneNumber>) => void;
  deletePhone: (id: string) => void;
  assignPhone: (phoneId: string, employeeId: string) => void;
  recoverPhone: (phoneId: string) => void;
  getPhoneAssignsByEmployeeId: (employeeId: string) => PhoneAssign[];
  getPhoneAssignsByPhoneId: (phoneId: string) => PhoneAssign[];
  getPhoneHistoryByPhoneId: (phoneId: string) => PhoneUsageHistory[];
  updatePhoneAssign: (id: string, updates: Partial<PhoneAssign>) => void;
  importEmployees: (data: Omit<Employee, "id">[]) => Promise<ImportResult>;
  importPhones: (data: Omit<PhoneNumber, "id">[]) => Promise<ImportResult>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(samplePhoneNumbers);
  const [phoneUsage, setPhoneUsage] = useState<PhoneUsage[]>([]);
  const [phoneAssigns, setPhoneAssigns] = useState<PhoneAssign[]>([]);
  const [phoneHistory, setPhoneHistory] = useState<PhoneUsageHistory[]>(samplePhoneHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      try {
        // Load employees
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
          setEmployees(JSON.parse(storedEmployees));
        } else {
          // Use sample data if no stored data
          setEmployees(sampleEmployees);
          // Save sample data to localStorage
          localStorage.setItem("employees", JSON.stringify(sampleEmployees));
        }

        // Load phone numbers
        const storedPhoneNumbers = localStorage.getItem("phoneNumbers");
        if (storedPhoneNumbers) {
          setPhoneNumbers(JSON.parse(storedPhoneNumbers));
        } else {
          // Use sample data if no stored data
          setPhoneNumbers(samplePhoneNumbers);
          // Save sample data to localStorage
          localStorage.setItem("phoneNumbers", JSON.stringify(samplePhoneNumbers));
        }

        // Load phone usage history
        const storedPhoneHistory = localStorage.getItem("phoneHistory");
        if (storedPhoneHistory) {
          setPhoneHistory(JSON.parse(storedPhoneHistory));
        } else {
          // Use sample data if no stored data
          setPhoneHistory(samplePhoneHistory);
          // Save sample data to localStorage
          localStorage.setItem("phoneHistory", JSON.stringify(samplePhoneHistory));
        }

        const storedPhoneUsage = localStorage.getItem("phoneUsage");
        if (storedPhoneUsage) {
          setPhoneUsage(JSON.parse(storedPhoneUsage));
        }

        const storedPhoneAssigns = localStorage.getItem("phoneAssigns");
        if (storedPhoneAssigns) {
          setPhoneAssigns(JSON.parse(storedPhoneAssigns));
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "加载数据失败",
          description: "无法从本地存储加载数据",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("phoneNumbers", JSON.stringify(phoneNumbers));
  }, [phoneNumbers]);

  useEffect(() => {
    localStorage.setItem("phoneUsage", JSON.stringify(phoneUsage));
  }, [phoneUsage]);

  useEffect(() => {
    localStorage.setItem("phoneAssigns", JSON.stringify(phoneAssigns));
  }, [phoneAssigns]);

  // Save phone history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("phoneHistory", JSON.stringify(phoneHistory));
  }, [phoneHistory]);

  const getEmployeeById = useCallback(
    (id: string): Employee | undefined => {
      return employees.find((employee) => employee.id === id);
    },
    [employees]
  );

  const getPhoneById = useCallback(
    (id: string): PhoneNumber | null => {
      const phone = phoneNumbers.find((phone) => phone.id === id);
      return phone || null;
    },
    [phoneNumbers]
  );

  const getPhoneNumbers = useCallback(
    (searchParams: any) => {
      let filteredPhones = [...phoneNumbers];

      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        filteredPhones = filteredPhones.filter((phone) => {
          return (
            phone.number.toLowerCase().includes(query) ||
            phone.registrant.toLowerCase().includes(query) ||
            (phone.currentUser && phone.currentUser.toLowerCase().includes(query)) ||
            (phone.notes && phone.notes.toLowerCase().includes(query))
          );
        });
      }

      const filter = searchParams.filters || {};
      const filteredByStatus = filter.status === "all" ? filteredPhones : filteredPhones.filter(phone => phone.status === filter.status);
      const filteredByRegistrantStatus = filter.registrantStatus === "all" ? filteredByStatus : filteredByStatus.filter(phone => phone.registrantStatus === filter.registrantStatus);

      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedPhones = filteredByRegistrantStatus.slice(start, end);

      return {
        data: paginatedPhones,
        total: filteredByRegistrantStatus.length,
      };
    },
    [phoneNumbers]
  );

  const getEmployees = useCallback(
    (searchParams: any) => {
      let filteredEmployees = [...employees];

      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        filteredEmployees = filteredEmployees.filter((employee) => {
          return (
            employee.name.toLowerCase().includes(query) ||
            employee.employeeId.toLowerCase().includes(query) ||
            employee.department.toLowerCase().includes(query)
          );
        });
      }

      const filter = searchParams.filters || {};
      if (filter.status) {
        filteredEmployees = filteredEmployees.filter(employee => employee.status === filter.status);
      }
      if (filter.department) {
        filteredEmployees = filteredEmployees.filter(employee => employee.department === filter.department);
      }

      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedEmployees = filteredEmployees.slice(start, end);

      return {
        data: paginatedEmployees,
        total: filteredEmployees.length,
      };
    },
    [employees]
  );

  const getRiskPhones = useCallback(() => {
    // Filter phones where registrant is inactive but phone is still active
    const riskPhones = phoneNumbers.filter(phone => 
      phone.status === FRONTEND_PHONE_STATUS.PENDING_CANCELLATION ||
      phone.status === FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_EMPLOYEE_LEFT ||
      phone.status === FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_USER_REPORT)
    return riskPhones;
  }, [phoneNumbers]);

  const addEmployee = (employee: Omit<Employee, "id">) => {
    const newEmployee: Employee = { ...employee, id: uuidv4() };
    setEmployees((prev) => [...prev, newEmployee]);
    toast({
      title: "添加成功",
      description: `成功添加员工 ${employee.name}`,
    });
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((employee) => (employee.id === id ? { ...employee, ...updates } : employee))
    );
    toast({
      title: "更新成功",
      description: `成功更新员工信息`,
    });
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
    // Also delete any phone assignments related to this employee
    setPhoneAssigns((prev) =>
      prev.filter((assign) => assign.employeeId !== id)
    );
    toast({
      title: "删除成功",
      description: `成功删除员工`,
    });
  };

  const addPhone = (phone: Omit<PhoneNumber, "id">) => {
    const newPhone: PhoneNumber = { ...phone, id: uuidv4(), currentUser: "" };
    setPhoneNumbers((prev) => [...prev, newPhone]);
    toast({
      title: "添加成功",
      description: `成功添加号码 ${phone.number}`,
    });
  };

  const updatePhone = (id: string, updates: Partial<PhoneNumber>) => {
    setPhoneNumbers((prev) =>
      prev.map((phone) => (phone.id === id ? { ...phone, ...updates } : phone))
    );
    toast({
      title: "更新成功",
      description: `成功更新号码信息`,
    });
  };

  const deletePhone = (id: string) => {
    setPhoneNumbers((prev) => prev.filter((phone) => phone.id !== id));
    // Also delete any phone assignments related to this phone
    setPhoneAssigns((prev) => prev.filter((assign) => assign.phoneId !== id));
    toast({
      title: "删除成功",
      description: `成功删除号码`,
    });
  };

  const assignPhone = (phoneId: string, employeeId: string) => {
    // Create a new phone assignment
    const newPhoneAssign: PhoneAssign = {
      id: uuidv4(),
      phoneId,
      employeeId,
      assignDate: new Date().toISOString().split('T')[0],
    };
    
    setPhoneAssigns((prev) => [...prev, newPhoneAssign]);

    // Update the phone number with the current user
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee) {
      updatePhone(phoneId, { 
        currentUser: employee.name,
        currentUserId: employee.id,
        status: FRONTEND_PHONE_STATUS.IN_USE 
      });
      
      // Add to phone usage history
      const newHistory: PhoneUsageHistory = {
        id: uuidv4(),
        phoneId,
        userId: employee.id,
        userName: employee.name,
        startDate: new Date().toISOString().split('T')[0],
      };
      
      setPhoneHistory(prev => [...prev, newHistory]);
      
      // Update localStorage for phoneHistory
      const updatedHistory = [...phoneHistory, newHistory];
      localStorage.setItem("phoneHistory", JSON.stringify(updatedHistory));
    }
  };

  const recoverPhone = (phoneId: string) => {
    // Find the phone assignment for this phone
    const assignment = phoneAssigns.find((assign) => 
      assign.phoneId === phoneId && !assign.returnDate
    );
    
    if (assignment) {
      // Update the assignment with a return date
      setPhoneAssigns((prev) => 
        prev.map((assign) => 
          assign.id === assignment.id 
            ? { ...assign, returnDate: new Date().toISOString().split('T')[0] } 
            : assign
        )
      );
    }
    
    // Find the phone to get current user info before clearing it
    const phone = phoneNumbers.find(p => p.id === phoneId);
    const userId = phone?.currentUserId || "";
    
    // Update the phone status to inactive and clear current user
    updatePhone(phoneId, { 
      status: FRONTEND_PHONE_STATUS.IDLE, 
      currentUser: "",
      currentUserId: ""
    });
    
    // Update the history record to add end date
    if (phone?.currentUserId) {
      setPhoneHistory(prev => 
        prev.map(history => {
          if (history.phoneId === phoneId && history.userId === phone.currentUserId && !history.endDate) {
            return {
              ...history,
              endDate: new Date().toISOString().split('T')[0]
            };
          }
          return history;
        })
      );
      
      // Update localStorage for phoneHistory
      localStorage.setItem("phoneHistory", JSON.stringify(phoneHistory.map(history => {
        if (history.phoneId === phoneId && history.userId === phone.currentUserId && !history.endDate) {
          return {
            ...history,
            endDate: new Date().toISOString().split('T')[0]
          };
        }
        return history;
      })));
    }
  };

  const getPhoneAssignsByEmployeeId = (employeeId: string): PhoneAssign[] => {
    return phoneAssigns.filter((assign) => assign.employeeId === employeeId);
  };

  const getPhoneAssignsByPhoneId = (phoneId: string): PhoneAssign[] => {
    return phoneAssigns.filter((assign) => assign.phoneId === phoneId);
  };

  const getPhoneHistoryByPhoneId = useCallback(
    (phoneId: string): PhoneUsageHistory[] => {
      return phoneHistory.filter(history => history.phoneId === phoneId);
    },
    [phoneHistory]
  );

  const updatePhoneAssign = (id: string, updates: Partial<PhoneAssign>) => {
    setPhoneAssigns((prev) =>
      prev.map((assign) => (assign.id === id ? { ...assign, ...updates } : assign))
    );
    toast({
      title: "更新成功",
      description: `成功更新号码分配信息`,
    });
  };

  const importEmployees = async (data: Omit<Employee, "id">[]): Promise<ImportResult> => {
    try {
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      const newEmployees = data.map((employee) => ({
        ...employee,
        id: uuidv4(),
      }));
      
      setEmployees((prev) => [...prev, ...newEmployees]);
      result.success = newEmployees.length;
      
      toast({
        title: "导入成功",
        description: `成功导入 ${data.length} 位员工`,
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "导入失败",
        description: error.message,
        variant: "destructive",
      });
      
      return {
        success: 0,
        failed: data.length,
        errors: [error.message]
      };
    }
  };

  const importPhones = async (data: Omit<PhoneNumber, "id">[]): Promise<ImportResult> => {
    try {
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      const newPhones = data.map((phone) => ({
        ...phone,
        id: uuidv4(),
        currentUser: "",
      }));
      
      setPhoneNumbers((prev) => [...prev, ...newPhones]);
      result.success = newPhones.length;
      
      toast({
        title: "导入成功",
        description: `成功导入 ${data.length} 个号码`,
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "导入失败",
        description: error.message,
        variant: "destructive",
      });
      
      return {
        success: 0,
        failed: data.length,
        errors: [error.message]
      };
    }
  };

  const value: DataContextType = {
    employees,
    phoneNumbers,
    phoneUsage,
    phoneAssigns,
    loading,
    error,
    getEmployeeById,
    getPhoneById,
    getPhoneNumbers,
    getEmployees,
    getRiskPhones,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addPhone,
    updatePhone,
    deletePhone,
    assignPhone,
    recoverPhone,
    getPhoneAssignsByEmployeeId,
    getPhoneAssignsByPhoneId,
    getPhoneHistoryByPhoneId,
    updatePhoneAssign,
    importEmployees,
    importPhones,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export { DataProvider, useData };
