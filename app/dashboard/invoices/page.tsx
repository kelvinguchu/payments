import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { NewInvoiceDrawer } from "@/components/invoices/new-invoice-drawer";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const supabase = createServerClient();

  const { data: projects } = await supabase.from("projects").select("id, name");
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      `
      id,
      amount,
      status,
      description,
      created_at,
      due_date,
      invoice_number,
      project:projects(name),
      user:profiles(full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Invoices</h1>
          <p className='text-muted-foreground'>
            Manage and track your project invoices
          </p>
        </div>
        <NewInvoiceDrawer projects={projects || []}>
          <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
            <Plus className='mr-2 h-4 w-4' />
            New Invoice
          </Button>
        </NewInvoiceDrawer>
      </div>

      <Suspense fallback={<div>Loading invoices...</div>}>
        <InvoicesTable invoices={invoices || []} />
      </Suspense>
    </div>
  );
}
