"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, User, Mail, Phone, UserPlus } from "lucide-react";

const clientFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 characters"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function CreateClientDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone_number: "",
    },
  });

  async function onSubmit(data: ClientFormValues) {
    try {
      setIsLoading(true);

      // Create the user in Supabase Auth with metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
            },
          },
        }
      );

      if (signUpError) throw signUpError;

      if (!authData.user) throw new Error("No user returned after signup");

      // Update only the phone number since full_name is handled by trigger
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone_number: data.phone_number,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Client created",
        description: "The client account has been created successfully.",
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Create client error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create client",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='w-full border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'>
          <UserPlus className='mr-2 h-4 w-4' />
          Create Client
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <DialogHeader>
          <DialogTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
            Create New Client
          </DialogTitle>
          <DialogDescription>
            Create a new client account. They will receive an email to verify
            their account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <Mail className='h-4 w-4 text-indigo-400' />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      disabled={isLoading}
                      className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='password'
                      disabled={isLoading}
                      className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='full_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <User className='h-4 w-4 text-indigo-400' />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='phone_number'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <Phone className='h-4 w-4 text-purple-400' />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors hover:bg-accent focus:pl-3'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
