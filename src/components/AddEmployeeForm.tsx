
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CreateEmployeeRequest } from '@/config/api';
import { Loader2 } from 'lucide-react';

interface AddEmployeeFormProps {
  onSubmit: (data: CreateEmployeeRequest) => Promise<void>;
  isLoading: boolean;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const form = useForm<CreateEmployeeRequest>({
    defaultValues: {
      fullName: '',
      department: '',
      email: '',
      phoneNumber: '',
      hireDate: '',
    },
  });

  const handleSubmit = async (data: CreateEmployeeRequest) => {
    await onSubmit(data);
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
        <FormField
          control={form.control}
          name="fullName"
          rules={{ required: '请输入姓名' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入员工姓名"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          rules={{ required: '请选择部门' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择部门" />
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
          name="email"
          rules={{ 
            required: '请输入邮箱',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: '请输入有效的邮箱地址'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入邮箱地址"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          rules={{ 
            required: '请输入手机号',
            pattern: {
              value: /^1[3-9]\d{9}$/,
              message: '请输入有效的手机号码'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>手机号 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入手机号码"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          rules={{ required: '请选择入职日期' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>入职日期 *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建员工
          </Button>
        </div>
      </form>
    </Form>
  );
};
