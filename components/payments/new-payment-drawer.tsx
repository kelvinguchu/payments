"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Wallet2, PlusCircle, Receipt } from "lucide-react";

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
  payment_method_id: z.string({
    required_error: "Please select a payment method",
  }),
  reference_number: z.string().min(1, {
    message: "Reference number is required",
  }),
});

interface Project {
  id: string;
  name: string;
}

interface NewPaymentDrawerProps {
  children: React.ReactNode;
  projects: Project[];
}

export function NewPaymentDrawer({
  children,
  projects,
}: NewPaymentDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; name: string }[]
  >([]);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const { data: methods } = await supabase
        .from("payment_methods")
        .select("id, name");
      setPaymentMethods(methods || []);
    };
    fetchPaymentMethods();
  }, []);

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
        payment_method_id: values.payment_method_id,
        reference_number: values.reference_number,
        created_by: session.user.id,
        status: "PENDING",
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Payment created",
        description: "Your payment has been created successfully.",
      });

      setOpen(false);
      form.reset();
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className='h-[90vh] bg-gradient-to-b from-background/95 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='mx-auto h-full w-full max-w-3xl'>
          <div className='flex h-full flex-col'>
            <div className='relative px-6 pt-6'>
              <div className='absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent' />
              <DrawerHeader className='relative px-0'>
                <DrawerTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
                  Create New Payment
                </DrawerTitle>
                <DrawerDescription>
                  Create a new payment for your project
                </DrawerDescription>
              </DrawerHeader>
            </div>

            <div className='scrollbar-none flex-1 overflow-y-auto px-6'>
              <Form {...form}>
                <form
                  id='payment-form'
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6 pb-6'>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='project_id'
                      render={({ field }) => (
                        <FormItem className='sm:col-span-2'>
                          <FormLabel className='flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-indigo-400' />
                            Project
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'>
                                <SelectValue placeholder='Select a project' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className='border-border/40 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur'>
                              {projects.length === 0 ? (
                                <div className='flex flex-col items-center justify-center space-y-2 p-6'>
                                  <div className='rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10 p-3'>
                                    <PlusCircle className='h-6 w-6 text-indigo-400' />
                                  </div>
                                  <div className='text-center'>
                                    <div className='font-medium text-muted-foreground'>
                                      No projects found
                                    </div>
                                    <div className='text-sm text-muted-foreground'>
                                      Create a project first to add payments
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                projects.map((project) => (
                                  <SelectItem
                                    key={project.id}
                                    value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))
                              )}
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
                          <FormLabel className='flex items-center gap-2'>
                            <Wallet2 className='h-4 w-4 text-green-400' />
                            Amount
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                                $
                              </span>
                              <Input
                                placeholder='0.00'
                                className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-7 backdrop-blur transition-colors hover:bg-accent'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Enter the payment amount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='payment_method_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2'>
                            <Receipt className='h-4 w-4 text-blue-400' />
                            Payment Method
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'>
                                <SelectValue placeholder='Select a payment method' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className='border-border/40 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur'>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the payment method
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='reference_number'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-purple-400' />
                            Reference Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter reference number'
                              className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the payment reference number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='description'
                      render={({ field }) => (
                        <FormItem className='sm:col-span-2'>
                          <FormLabel className='flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-purple-400' />
                            Description
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Payment description...'
                              className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'
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
                  </div>
                </form>
              </Form>
            </div>

            <div className='relative border-t border-border/40 px-6 py-4'>
              <div className='absolute inset-0 bg-gradient-to-t from-indigo-500/5 via-purple-500/5 to-transparent' />
              <div className='relative flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isLoading}
                  onClick={() => setOpen(false)}
                  className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-all hover:bg-accent hover:shadow-[0_0_1rem_0_rgba(99,102,241,0.1)]'>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  form='payment-form'
                  disabled={isLoading}
                  className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  {isLoading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Receipt className='mr-2 h-4 w-4' />
                  )}
                  Create Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
