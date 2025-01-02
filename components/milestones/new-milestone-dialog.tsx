"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Loader2,
  CalendarIcon,
  FileText,
  Wallet2,
  Building2,
  PlusCircle,
  Target,
} from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters",
    })
    .max(500, {
      message: "Description must not be longer than 500 characters",
    })
    .optional(),
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
  due_date: z.date({
    required_error: "Please select a due date",
  }),
});

interface Project {
  id: string;
  name: string;
}

interface NewMilestoneDialogProps {
  children: React.ReactNode;
  projects: Project[];
}

export function NewMilestoneDialog({
  children,
  projects,
}: NewMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
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

      const { error } = await supabase.from("project_milestones").insert({
        title: values.title,
        description: values.description,
        project_id: values.project_id,
        amount: parseFloat(values.amount),
        due_date: values.due_date.toISOString(),
        status: "PENDING",
      });

      if (error) throw error;

      toast({
        title: "Milestone created",
        description: "Your milestone has been created successfully.",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-3xl bg-gradient-to-b from-background/95 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <DialogHeader>
          <DialogTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
            Create New Milestone
          </DialogTitle>
          <DialogDescription>
            Add a new milestone to track project progress
          </DialogDescription>
        </DialogHeader>

        <div className='scrollbar-none max-h-[calc(100vh-20rem)] overflow-y-auto px-1'>
          <Form {...form}>
            <form
              id='milestone-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Target className='h-4 w-4 text-indigo-400' />
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter milestone title'
                          className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your milestone a descriptive title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='project_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 text-purple-400' />
                        Project
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent'>
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
                                  Add a project first to create milestones
                                </div>
                              </div>
                            </div>
                          ) : (
                            projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the project for this milestone
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
                            type='number'
                            placeholder='0.00'
                            className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-7 backdrop-blur transition-colors hover:bg-accent focus:pl-7'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set the payment amount for this milestone
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
                      <FormLabel className='flex items-center gap-2'>
                        <CalendarIcon className='h-4 w-4 text-orange-400' />
                        Due Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Set when this milestone should be completed
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
                        <FileText className='h-4 w-4 text-indigo-400' />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter milestone description'
                          className='h-32 resize-none border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what needs to be achieved
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end gap-4'>
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
                  disabled={isLoading}
                  className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  {isLoading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <PlusCircle className='mr-2 h-4 w-4' />
                  )}
                  Create Milestone
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
