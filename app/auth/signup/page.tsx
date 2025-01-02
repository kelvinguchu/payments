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
import { Loader2, User, Mail, Phone, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const signupFormSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
    full_name: z.string().min(3, "Name must be at least 3 characters"),
    phone_number: z
      .string()
      .min(10, "Phone number must be at least 10 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      full_name: "",
      phone_number: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    try {
      setIsLoading(true);

      // Sign up the user with metadata
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

      // Update additional profile information
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone_number: data.phone_number,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });

      router.push("/auth/login");
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create account",
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
              Create a Client Account
            </CardTitle>
            <CardDescription>
              Sign up to manage your projects and payments
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

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-2'>
                          <Lock className='h-4 w-4 text-indigo-400' />
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

                  <FormField
                    control={form.control}
                    name='confirm_password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-2'>
                          <Lock className='h-4 w-4 text-purple-400' />
                          Confirm Password
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
                </div>

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
              </form>
            </Form>
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button
              type='submit'
              disabled={isLoading}
              onClick={form.handleSubmit(onSubmit)}
              className='w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className='text-sm text-muted-foreground text-center'>
              Already have an account?{" "}
              <Link
                href='/auth/login'
                className='text-indigo-400 hover:text-indigo-300 font-medium'>
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
