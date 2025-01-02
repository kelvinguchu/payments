"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, Mail, Phone } from "lucide-react";
import type { NavItem, NavGroup } from "@/lib/nav-config";
import { sidebarItems } from "@/lib/nav-config";
import { createBrowserClient } from "@/lib/supabase/client";
import { CreateClientDialog } from "./create-client-dialog";

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-gradient-to-r from-indigo-500/25 to-indigo-500/10 text-indigo-400"
          : "text-muted-foreground hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-transparent hover:text-indigo-400",
        item.isChild ? "ml-4" : ""
      )}>
      <item.icon
        className={cn(
          "h-4 w-4 transition-transform group-hover:scale-110",
          isActive && "text-indigo-400"
        )}
      />
      <span>{item.title}</span>
    </Link>
  );
}

function NavGroup({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const isActive = group.items.some((item) => pathname === item.href);

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
          isActive
            ? "text-indigo-400"
            : "text-muted-foreground hover:text-indigo-400"
        )}>
        <div className='flex items-center gap-3'>
          <group.icon
            className={cn("h-4 w-4", isActive && "text-indigo-400")}
          />
          <span>{group.title}</span>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <div className='relative mt-1 space-y-1 before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-indigo-500/50 before:to-transparent/5'>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function checkRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setIsAdmin(data?.role === "admin");
    }

    checkRole();
  }, [supabase]);

  return (
    <div className='flex h-full flex-col gap-4 py-4'>
      <div className='px-3 py-2'>
        <div className='space-y-2'>
          {sidebarItems.map((item, index) => {
            if ("items" in item) {
              return <NavGroup key={index} group={item} />;
            }
            return <NavLink key={item.href} item={item} />;
          })}
        </div>
      </div>

      {isAdmin && (
        <div className='px-3'>
          <CreateClientDialog />
        </div>
      )}

      <div className='mt-auto px-3'>
        <div className='rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4'>
          <h3 className='font-medium text-indigo-400'>Need Help?</h3>
          <div className='mt-2 space-y-2'>
            <a
              href='mailto:kelvinguchu5@gmail.com'
              className='flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-indigo-400'>
              <Mail className='h-3 w-3' />
              kelvinguchu5@gmail.com
            </a>
            <a
              href='tel:+254725799783'
              className='flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-indigo-400'>
              <Phone className='h-3 w-3' />
              +254 725 799 783
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
