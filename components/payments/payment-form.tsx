"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";

const formSchema = z.object({
  project_id: z.string({
    required_error: "Please select a project",
  }),
  amount: z.string().refine(
    (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    },
    {
      message: "Amount must be a positive number",
    }
  ),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters",
    })
    .max(500, {
      message: "Description must not be longer than 500 characters",
    }),
  due_date: z.string().refine(
    (value) => {
      const date = new Date(value);
      return date > new Date();
    },
    {
      message: "Due date must be in the future",
    }
  ),
});

interface Project {
  id: string;
  name: string;
}

interface PaymentFormProps {
  projects: Project[];
}

export function PaymentForm({ projects }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Create payment
      const { error } = await supabase.from("payments").insert({
        project_id: values.project_id,
        amount: parseFloat(values.amount),
        description: values.description,
        due_date: values.due_date,
        status: "pending",
        user_id: session.user.id,
      });

      if (error) throw error;

      toast({
        title: "Payment created",
        description: "Your payment has been created successfully.",
      });

      router.push("/dashboard/payments");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className='border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 p-6 backdrop-blur'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='project_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='bg-background/95'>
                      <SelectValue placeholder='Select a project' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the project this payment is for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                      $
                    </span>
                    <Input
                      placeholder='0.00'
                      className='bg-background/95 pl-7'
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>Enter the payment amount</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Payment description...'
                    className='h-32 resize-none bg-background/95'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide details about this payment
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='due_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type='date' className='bg-background/95' {...field} />
                </FormControl>
                <FormDescription>When is this payment due?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={isLoading}
              className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'>
              {isLoading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <ArrowRight className='mr-2 h-4 w-4' />
              )}
              Create Payment
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
