"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navbarItems } from "@/lib/nav-config";
import { LogOut, Menu, User, ChevronDown, Bell } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationContent } from "@/components/dashboard/notification-content";

export function DashboardNav() {
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<{
    avatar_url?: string;
    full_name?: string;
  } | null>(null);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", session.user.id)
          .single();
        setProfile(data);
      }
    }
    getProfile();
  }, [supabase]);

  useEffect(() => {
    async function getUnreadCount() {
      const { data: notifications } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("read", false);

      setUnreadCount(notifications?.length || 0);
    }

    getUnreadCount();

    // Subscribe to notifications changes
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          getUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className='sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center justify-between px-4'>
        {/* Logo and Desktop Navigation */}
        <div className='flex items-center gap-6'>
          <Link href='/dashboard' className='flex items-center space-x-3'>
            <Image
              src='/logo.png'
              alt='Logo'
              width={48}
              height={48}
              className='h-12 w-auto'
            />
          </Link>
          <nav className='hidden md:flex md:items-center md:gap-6'>
            {navbarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2 text-sm font-medium transition-colors hover:text-indigo-400",
                  pathname === item.href
                    ? "text-indigo-400"
                    : "text-muted-foreground"
                )}>
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110",
                    pathname === item.href && "text-indigo-400"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant='ghost'
          size='icon'
          className='block md:hidden'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className='h-5 w-5' />
        </Button>

        {/* Desktop Profile and Logout */}
        <div className='hidden md:flex md:items-center md:gap-4'>
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='relative text-muted-foreground hover:text-indigo-400'>
                <Bell className='h-5 w-5' />
                {unreadCount > 0 && (
                  <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white'>
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className='w-full border-l border-border/40 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:max-w-md'>
              <SheetHeader>
                <SheetTitle className='bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
                  Notifications
                </SheetTitle>
              </SheetHeader>
              <NotificationContent />
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='relative h-9 w-full justify-start rounded-lg border border-border/40 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 px-3 hover:from-indigo-500/10 hover:to-purple-500/10'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-7 w-7 border border-border/40'>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                      <User className='h-4 w-4 text-indigo-400' />
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium text-indigo-400'>
                    {profile?.full_name || "Profile"}
                  </span>
                  <ChevronDown className='ml-2 h-4 w-4 text-muted-foreground' />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-[200px] bg-gradient-to-b from-background/95 to-background/98 backdrop-blur'>
              <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-destructive-foreground focus:text-destructive-foreground/90'>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className='absolute left-0 right-0 top-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 md:hidden'>
            <nav className='flex flex-col space-y-3'>
              {navbarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400"
                      : "text-muted-foreground hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 hover:text-indigo-400"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className='h-4 w-4' />
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className='my-2 bg-border/40' />
              <div className='flex items-center justify-between rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5 px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-7 w-7 border border-border/40'>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                      <User className='h-4 w-4 text-indigo-400' />
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium text-indigo-400'>
                    {profile?.full_name || "Profile"}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleLogout}
                  className='h-7 w-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20'>
                  <LogOut className='h-4 w-4' />
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
