import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { PaymentsTable } from "@/components/payments/payments-table";
import { PaymentsTableSkeleton } from "@/components/payments/payments-table-skeleton";
import { NewPaymentDrawer } from "@/components/payments/new-payment-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getPayments() {
  const supabase = createServerClient();

  // Check auth
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const { data: payments } = await supabase
    .from("payments")
    .select(
      `
      *,
      project:projects(name),
      user:profiles(full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false });

  return payments || [];
}

async function getProjects() {
  const supabase = createServerClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return projects || [];
}

export default async function PaymentsPage() {
  const [payments, projects] = await Promise.all([
    getPayments(),
    getProjects(),
  ]);

  return (
    <div className='flex-1 space-y-6 p-8 pt-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl font-bold tracking-tight'>Payments</h2>
        <NewPaymentDrawer projects={projects}>
          <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'>
            <Plus className='mr-2 h-4 w-4' />
            New Payment
          </Button>
        </NewPaymentDrawer>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <Input
              placeholder='Search payments...'
              className='w-full max-w-sm bg-background/95'
            />
          </div>
        </div>

        <Suspense fallback={<PaymentsTableSkeleton />}>
          <PaymentsTable payments={payments} />
        </Suspense>
      </div>
    </div>
  );
}
