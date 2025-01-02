import { DashboardNav } from "@/components/dashboard/nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen flex-col'>
      <DashboardNav />
      <div className='flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10'>
        <aside className='fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block'>
          <Sidebar />
        </aside>
        <main className='flex w-full flex-col overflow-hidden p-4 md:p-6 lg:p-8'>
          {children}
        </main>
      </div>
    </div>
  );
}
