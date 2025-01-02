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
import {
  Loader2,
  Calendar,
  Users,
  FileText,
  Wallet2,
  Building2,
  PlusCircle,
} from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Project name must be at least 3 characters",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters",
    })
    .max(500, {
      message: "Description must not be longer than 500 characters",
    }),
  client_id: z.string({
    required_error: "Please select a client",
  }),
  team_size: z.string().refine(
    (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    },
    {
      message: "Team size must be a positive number",
    }
  ),
  budget: z.string().refine(
    (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    },
    {
      message: "Budget must be a positive number",
    }
  ),
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

interface Client {
  id: string;
  name: string;
}

interface NewProjectDialogProps {
  children: React.ReactNode;
  clients: Client[];
}

export function NewProjectDialog({ children, clients }: NewProjectDialogProps) {
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

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Create project
      const { error } = await supabase.from("projects").insert({
        name: values.name,
        description: values.description,
        client_id: values.client_id,
        team_size: parseInt(values.team_size),
        budget: parseFloat(values.budget),
        due_date: values.due_date,
        status: "active",
        progress: 0,
        user_id: session.user.id,
      });

      if (error) throw error;

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
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
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project and assign it to a client
          </DialogDescription>
        </DialogHeader>

        <div className='scrollbar-none max-h-[calc(100vh-20rem)] overflow-y-auto px-1'>
          <Form {...form}>
            <form
              id='project-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-indigo-400' />
                        Project Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter project name'
                          className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your project a descriptive name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='client_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 text-purple-400' />
                        Client
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent'>
                            <SelectValue placeholder='Select a client' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='border-border/40 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur'>
                          {clients.length === 0 ? (
                            <div className='flex flex-col items-center justify-center space-y-2 p-6'>
                              <div className='rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10 p-3'>
                                <PlusCircle className='h-6 w-6 text-indigo-400' />
                              </div>
                              <div className='text-center'>
                                <div className='font-medium text-muted-foreground'>
                                  No clients found
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  Add a client first to create projects
                                </div>
                              </div>
                            </div>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the client for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='team_size'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Users className='h-4 w-4 text-blue-400' />
                        Team Size
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          placeholder='Enter team size'
                          className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of team members for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='budget'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Wallet2 className='h-4 w-4 text-green-400' />
                        Budget
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                            $
                          </span>
                          <Input
                            placeholder='0.00'
                            className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-7 backdrop-blur transition-colors hover:bg-accent focus:pl-7'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Set the project budget</FormDescription>
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
                        <Calendar className='h-4 w-4 text-orange-400' />
                        Due Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        When is this project due?
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
                          placeholder='Project description...'
                          className='h-32 resize-none border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
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
            form='project-form'
            disabled={isLoading}
            className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
            {isLoading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <PlusCircle className='mr-2 h-4 w-4' />
            )}
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
