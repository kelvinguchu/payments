import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { NewInvoiceDrawer } from "@/components/invoices/new-invoice-drawer";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getInvoices() {
  const supabase = createServerClient();

  // Check auth
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // Get projects for invoice creation (if admin)
  let projects = [];
  if (profile?.role === "admin") {
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");
    projects = projectsData || [];
  }

  // If admin, get all invoices, if client, get only their invoices
  const query = supabase
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
      project:projects(id, name, client_id),
      user:profiles!invoices_created_by_fkey(full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false });

  if (profile?.role === "client") {
    // For clients, only show invoices from their projects
    query.eq("project.client_id", session.user.id);
  }

  const { data: invoices, error } = await query;

  if (error) {
    console.error("Error:", error);
    return { invoices: [], projects: [], isAdmin: false };
  }

  return {
    invoices: invoices || [],
    projects,
    isAdmin: profile?.role === "admin",
  };
}

export default async function InvoicesPage() {
  const { invoices, projects, isAdmin } = await getInvoices();

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Invoices</h1>
          <p className='text-sm text-muted-foreground'>
            {isAdmin
              ? "Manage and track all project invoices"
              : "View and track your project invoices"}
          </p>
        </div>
        {isAdmin && (
          <NewInvoiceDrawer projects={projects}>
            <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
              <Plus className='mr-2 h-4 w-4' />
              New Invoice
            </Button>
          </NewInvoiceDrawer>
        )}
      </div>

      <Suspense
        fallback={
          <div className='flex h-[350px] items-center justify-center'>
            <div className='relative h-8 w-8'>
              <div className='absolute h-8 w-8 animate-ping rounded-full bg-indigo-500 opacity-75'></div>
              <div className='relative h-8 w-8 rounded-full bg-indigo-500'></div>
            </div>
          </div>
        }>
        <InvoicesTable invoices={invoices} isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
