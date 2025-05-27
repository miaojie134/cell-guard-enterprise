import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UpdateEmployeeRequest } from '@/config/api';
import { Employee } from '@/types';
import { Loader2 } from 'lucide-react';

interface UpdateEmployeeFormProps {
  employee: Employee;
  onSubmit: (data: UpdateEmployeeRequest) => Promise<void>;
  isLoading: boolean;
}

export const UpdateEmployeeForm: React.FC<UpdateEmployeeFormProps> = ({
  employee,
  onSubmit,
  isLoading,
}) => {
  const form = useForm<UpdateEmployeeRequest>({
    defaultValues: {
      department: employee.department,
      employmentStatus: employee.status === 'active' ? 'Active' : 'Departed',
      hireDate: employee.joinDate,
      terminationDate: employee.leaveDate || '',
    },
  });

  const handleSubmit = async (data: UpdateEmployeeRequest) => {
    // 如果离职日期为空，从数据中移除
    const submitData = { ...data };
    if (!submitData.terminationDate) {
      delete submitData.terminationDate;
    }
    await onSubmit(submitData);
  };

  const departments = [
    '市场部',
    '销售部',
    '财务部',
    'IT部',
    '人力资源部',
    '运营部',
    '产品部',
    '技术部',
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">工号</label>
            <p className="text-lg font-medium">{employee.employeeId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">姓名</label>
            <p className="text-lg font-medium">{employee.name}</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employmentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>在职状态</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">在职</SelectItem>
                  <SelectItem value="Departed">离职</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>入职日期</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="选择入职日期"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          control={form.control}
          name="terminationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>离职日期（可选）</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="选择离职日期"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            更新员工信息
          </Button>
        </div>
      </form>
    </Form>
  );
}; 