"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Loader2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

interface AdminStats {
  total_amount: number;
  pending_amount: number;
  completed_amount: number;
  active_projects: number;
}

interface ClientSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total_amount: 0,
    pending_amount: 0,
    completed_amount: 0,
    active_projects: 0,
  });
  const [clientSummary, setClientSummary] = useState<ClientSummary>({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    total_amount: 0,
    paid_amount: 0,
    remaining_balance: 0,
  });
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Check user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const userIsAdmin = profile?.role === "admin";
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Load admin stats
          const { data: stats } = await supabase
            .from("project_balances")
            .select("*");

          const { count: activeProjects } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("status", "ACTIVE");

          setAdminStats({
            total_amount:
              stats?.reduce((sum, p) => sum + p.total_amount, 0) || 0,
            pending_amount:
              stats?.reduce((sum, p) => sum + p.remaining_balance, 0) || 0,
            completed_amount:
              stats?.reduce((sum, p) => sum + p.paid_amount, 0) || 0,
            active_projects: activeProjects || 0,
          });
        } else {
          // Load client summary
          const { data: projectsData } = await supabase
            .from("projects")
            .select("id, status, total_amount")
            .eq("client_id", session.user.id);

          const { data: balancesData } = await supabase
            .from("project_balances")
            .select("paid_amount, remaining_balance")
            .eq("client_id", session.user.id);

          if (projectsData && balancesData) {
            setClientSummary({
              total_projects: projectsData.length,
              active_projects: projectsData.filter((p) => p.status === "ACTIVE")
                .length,
              completed_projects: projectsData.filter(
                (p) => p.status === "COMPLETED"
              ).length,
              total_amount: balancesData.reduce(
                (sum, b) => sum + (b.paid_amount + b.remaining_balance),
                0
              ),
              paid_amount: balancesData.reduce(
                (sum, b) => sum + b.paid_amount,
                0
              ),
              remaining_balance: balancesData.reduce(
                (sum, b) => sum + b.remaining_balance,
                0
              ),
            });
          }
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className='flex-1 space-y-6 p-8 pt-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Total Revenue
              </CardTitle>
              <DollarSign className='h-4 w-4 text-indigo-400' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-indigo-400'>
                ${adminStats.total_amount.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>All time earnings</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Pending Payments
              </CardTitle>
              <ArrowUpRight className='h-4 w-4 text-yellow-400' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-400'>
                ${adminStats.pending_amount.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Completed Payments
              </CardTitle>
              <ArrowDownRight className='h-4 w-4 text-green-400' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-400'>
                ${adminStats.completed_amount.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                Successfully processed
              </p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Active Projects
              </CardTitle>
              <Activity className='h-4 w-4 text-blue-400' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-400'>
                {adminStats.active_projects}
              </div>
              <p className='text-xs text-muted-foreground'>
                Currently in progress
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <Card className='col-span-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className='pl-2'>
              <Overview />
            </CardContent>
          </Card>

          <Card className='col-span-3 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border/40'>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Client Dashboard
  return (
    <div className='container space-y-8 py-8'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Projects Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  Total Projects
                </span>
                <span className='text-xl font-bold text-indigo-400'>
                  {clientSummary.total_projects}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Active</span>
                <span className='text-lg font-semibold text-green-400'>
                  {clientSummary.active_projects}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Completed</span>
                <span className='text-lg font-semibold text-purple-400'>
                  {clientSummary.completed_projects}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Payments Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  Total Amount
                </span>
                <span className='text-xl font-bold text-indigo-400'>
                  ${clientSummary.total_amount.toLocaleString()}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Paid</span>
                <span className='text-lg font-semibold text-green-400'>
                  ${clientSummary.paid_amount.toLocaleString()}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Remaining</span>
                <span className='text-lg font-semibold text-purple-400'>
                  ${clientSummary.remaining_balance.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:col-span-2 lg:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Payment Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='mt-4 space-y-2'>
              <div className='flex w-full items-center gap-2'>
                <div className='h-2 flex-1 rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500'
                    style={{
                      width: `${
                        (clientSummary.paid_amount /
                          clientSummary.total_amount) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className='text-sm text-muted-foreground'>
                  {Math.round(
                    (clientSummary.paid_amount / clientSummary.total_amount) *
                      100
                  )}
                  %
                </span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Total paid amount across all projects
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
