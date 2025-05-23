
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { useData } from "@/context/DataContext";
import { PhoneNumber } from "@/types";

const formSchema = z.object({
  employeeId: z.string().min(1, "请选择员工"),
});

interface PhoneAssignFormProps {
  phone: PhoneNumber;
  onAssign: (phoneId: string, employeeId: string) => void;
  onCancel: () => void;
}

export function PhoneAssignForm({ phone, onAssign, onCancel }: PhoneAssignFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAssign(phone.id, values.employeeId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">分配号码</h3>
        <p className="text-sm text-muted-foreground">
          将号码 {phone.number} 分配给员工使用
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>选择员工</FormLabel>
                <FormControl>
                  <EmployeeCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="输入员工姓名进行搜索..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">
              确认分配
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
