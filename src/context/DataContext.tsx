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
  PhoneAssign as PhoneAssignType,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

type DataContextType = {
  employees: Employee[];
  phoneNumbers: PhoneNumber[];
  phoneUsage: PhoneUsage[];
  phoneAssigns: PhoneAssignType[];
  loading: boolean;
  error: string | null;
  getEmployeeById: (id: string) => Employee | undefined;
  getPhoneById: (id: string) => PhoneNumber | null;
  getPhoneNumbers: (searchParams: any) => {
    data: PhoneNumber[];
    total: number;
  };
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addPhone: (phone: Omit<PhoneNumber, "id">) => void;
  updatePhone: (id: string, updates: Partial<PhoneNumber>) => void;
  deletePhone: (id: string) => void;
  assignPhone: (phoneAssign: Omit<PhoneAssignType, "id">) => void;
  unassignPhone: (id: string) => void;
  getPhoneAssignsByEmployeeId: (employeeId: string) => PhoneAssignType[];
  getPhoneAssignsByPhoneId: (phoneId: string) => PhoneAssignType[];
  updatePhoneAssign: (id: string, updates: Partial<PhoneAssignType>) => void;
  importEmployees: (data: Omit<Employee, "id">[]) => void;
  importPhones: (data: Omit<PhoneNumber, "id">[]) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneUsage, setPhoneUsage] = useState<PhoneUsage[]>([]);
  const [phoneAssigns, setPhoneAssigns] = useState<PhoneAssignType[]>([]);
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
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
          setEmployees(JSON.parse(storedEmployees));
        }

        const storedPhoneNumbers = localStorage.getItem("phoneNumbers");
        if (storedPhoneNumbers) {
          setPhoneNumbers(JSON.parse(storedPhoneNumbers));
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

  const assignPhone = (phoneAssign: Omit<PhoneAssignType, "id">) => {
    const newPhoneAssign: PhoneAssignType = { ...phoneAssign, id: uuidv4() };
    setPhoneAssigns((prev) => [...prev, newPhoneAssign]);

    // Update the phone number with the current user
    const employee = employees.find((emp) => emp.id === phoneAssign.employeeId);
    const phone = phoneNumbers.find((p) => p.id === phoneAssign.phoneId);

    if (phone && employee) {
      updatePhone(phone.id, { currentUser: employee.name });
    }

    toast({
      title: "分配成功",
      description: `成功分配号码 ${phoneAssign.phoneId} 给员工 ${phoneAssign.employeeId}`,
    });
  };

  const unassignPhone = (id: string) => {
    const phoneAssign = phoneAssigns.find((assign) => assign.id === id);
    if (phoneAssign) {
      // Clear the currentUser field on the phone number
      updatePhone(phoneAssign.phoneId, { currentUser: "" });
    }

    setPhoneAssigns((prev) => prev.filter((assign) => assign.id !== id));
    toast({
      title: "解除分配成功",
      description: `成功解除号码分配`,
    });
  };

  const getPhoneAssignsByEmployeeId = (employeeId: string): PhoneAssignType[] => {
    return phoneAssigns.filter((assign) => assign.employeeId === employeeId);
  };

  const getPhoneAssignsByPhoneId = (phoneId: string): PhoneAssignType[] => {
    return phoneAssigns.filter((assign) => assign.phoneId === phoneId);
  };

  const updatePhoneAssign = (id: string, updates: Partial<PhoneAssignType>) => {
    setPhoneAssigns((prev) =>
      prev.map((assign) => (assign.id === id ? { ...assign, ...updates } : assign))
    );
    toast({
      title: "更新成功",
      description: `成功更新号码分配信息`,
    });
  };

  const importEmployees = (data: Omit<Employee, "id">[]) => {
    const newEmployees = data.map((employee) => ({
      ...employee,
      id: uuidv4(),
    }));
    setEmployees((prev) => [...prev, ...newEmployees]);
    toast({
      title: "导入成功",
      description: `成功导入 ${data.length} 位员工`,
    });
  };

  const importPhones = (data: Omit<PhoneNumber, "id">[]) => {
    const newPhones = data.map((phone) => ({
      ...phone,
      id: uuidv4(),
      currentUser: "",
    }));
    setPhoneNumbers((prev) => [...prev, ...newPhones]);
    toast({
      title: "导入成功",
      description: `成功导入 ${data.length} 个号码`,
    });
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
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addPhone,
    updatePhone,
    deletePhone,
    assignPhone,
    unassignPhone,
    getPhoneAssignsByEmployeeId,
    getPhoneAssignsByPhoneId,
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
