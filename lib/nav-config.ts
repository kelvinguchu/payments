import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Folder,
  Clock,
  FileImage,
  Receipt,
  Milestone,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isChild?: boolean;
}

export interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

// Top navbar items - Quick access to primary features
export const navbarItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Invoices",
    href: "/dashboard/invoices",
    icon: Receipt,
  },
];

// Sidebar items - Detailed project management and secondary features
export const sidebarItems: (NavItem | NavGroup)[] = [
  {
    title: "Projects",
    icon: FileText,
    items: [
      {
        title: "Active Projects",
        href: "/dashboard/projects/active",
        icon: Folder,
        isChild: true,
      },
      {
        title: "Completed",
        href: "/dashboard/projects/completed",
        icon: Clock,
        isChild: true,
      },
    ],
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileImage,
  },
  {
    title: "Milestones",
    href: "/dashboard/milestones",
    icon: Milestone,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
