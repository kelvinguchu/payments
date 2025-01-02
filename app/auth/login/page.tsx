"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='h-screen grid place-items-center p-4'>
      <div className='w-full max-w-lg space-y-6'>
        <div className='flex justify-center'>
          <Image
            src='/logo.png'
            alt='Logo'
            width={100}
            height={100}
            className='rounded-full'
          />
        </div>
        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <CardHeader className='space-y-1'>
            <CardTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'>
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
                      <FormLabel className='flex items-center gap-2'>
                        <Lock className='h-4 w-4 text-purple-400' />
                        Password
                      </FormLabel>
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

                <Button
                  type='submit'
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <p className='text-sm text-muted-foreground text-center'>
              Don't have an account?{" "}
              <Link
                href='/auth/signup'
                className='text-indigo-400 hover:text-indigo-300 font-medium'>
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
