"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  read: boolean;
  created_at: string;
  related_project_id?: string;
  related_payment_id?: string;
  related_milestone_id?: string;
};

function NotificationItem({
  notification,
  onUpdate,
}: {
  notification: Notification;
  onUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const typeStyles = {
    INFO: "bg-blue-500/10 text-blue-500",
    SUCCESS: "bg-green-500/10 text-green-500",
    WARNING: "bg-yellow-500/10 text-yellow-500",
    ERROR: "bg-red-500/10 text-red-500",
  };

  const handleToggleRead = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("notifications")
        .update({ read: !notification.read })
        .eq("id", notification.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Error updating notification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format the timestamp to relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/40 bg-gradient-to-b from-background/50 to-background/80 p-4 backdrop-blur transition-colors",
        !notification.read &&
          "border-indigo-500/20 shadow-[0_0_1rem_0_rgba(99,102,241,0.1)]"
      )}>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 space-y-1'>
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                "flex h-2 w-2 rounded-full",
                !notification.read ? "bg-indigo-500" : "bg-muted"
              )}
            />
            <h4
              className={cn(
                "font-medium",
                !notification.read ? "text-foreground" : "text-muted-foreground"
              )}>
              {notification.title}
            </h4>
          </div>
          <p className='text-sm text-muted-foreground'>
            {notification.message}
          </p>
          <p className='text-xs text-muted-foreground'>
            {getRelativeTime(notification.created_at)}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground hover:text-foreground'
          onClick={handleToggleRead}
          disabled={isUpdating}>
          {notification.read ? (
            <X className='h-4 w-4' />
          ) : (
            <Check className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

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
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
        <div className='mt-8 space-y-4'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Bell className='h-8 w-8 text-muted-foreground' />
              <p className='mt-2 text-sm text-muted-foreground'>
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onUpdate={fetchNotifications}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
