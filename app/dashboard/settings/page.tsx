"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/card";
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
import { Loader2, User, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UploadButton } from "@/components/ui/upload-button";

const profileFormSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 characters"),
  avatar_url: z.string().optional(),
});

const accountFormSchema = z
  .object({
    current_password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const supabase = createBrowserClient();
  const { toast } = useToast();

  // Fetch user email on component mount
  useEffect(() => {
    async function fetchUserEmail() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || "");
    }
    fetchUserEmail();
  }, [supabase.auth]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return {};

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number, avatar_url")
        .eq("id", session.user.id)
        .single();

      return {
        full_name: data?.full_name || "",
        phone_number: data?.phone_number || "",
        avatar_url: data?.avatar_url || "",
      };
    },
  });

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
          avatar_url: data.avatar_url,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAvatarUpload = (url: string) => {
    profileForm.setValue("avatar_url", url);
  };

  async function onAccountSubmit(data: AccountFormValues) {
    try {
      setIsLoading(true);

      // First verify the current password
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error("No user email found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: data.current_password,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Current password is incorrect.",
        });
        return;
      }

      // Then update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (updateError) throw updateError;

      toast({
        title: "Account updated",
        description: "Your password has been updated successfully.",
      });

      accountForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='container py-8'>
      <div className='mx-auto max-w-4xl space-y-8'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences.
          </p>
        </div>

        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <CardHeader>
            <CardTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
              Profile Settings
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className='space-y-6'>
                <div className='flex items-center gap-6'>
                  <Avatar className='h-20 w-20 border-2 border-border/40'>
                    <AvatarImage src={profileForm.getValues("avatar_url")} />
                    <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                      <User className='h-8 w-8 text-indigo-400' />
                    </AvatarFallback>
                  </Avatar>
                  <UploadButton
                    onUploadComplete={handleAvatarUpload}
                    isLoading={isLoading}
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
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
                </div>

                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={isLoading}
                    className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <CardHeader>
            <CardTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
              Account Settings
            </CardTitle>
            <CardDescription>Update your email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...accountForm}>
              <form
                onSubmit={accountForm.handleSubmit(onAccountSubmit)}
                className='space-y-6'>
                <div className='space-y-2'>
                  <FormLabel className='flex items-center gap-2'>
                    <Mail className='h-4 w-4 text-indigo-400' />
                    Email Address
                  </FormLabel>
                  <Input
                    type='email'
                    value={userEmail}
                    disabled
                    className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 pl-3 backdrop-blur transition-colors'
                  />
                  <p className='text-sm text-muted-foreground'>
                    Email cannot be changed
                  </p>
                </div>

                <Separator className='my-6 bg-border/40' />

                <div className='space-y-4'>
                  <FormField
                    control={accountForm.control}
                    name='current_password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
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

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <FormField
                      control={accountForm.control}
                      name='new_password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
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
                      control={accountForm.control}
                      name='confirm_password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
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
                </div>

                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={isLoading}
                    className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
