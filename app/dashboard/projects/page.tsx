"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Calendar, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  description: string;
  total_amount: number;
  start_date: string;
  expected_end_date: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  paid_amount: number;
  remaining_balance: number;
}

const statusColors = {
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  ON_HOLD: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export default function ProjectsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadProjects() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Get projects with balances
        const { data, error } = await supabase
          .from("projects")
          .select("*, project_balances!inner(*)")
          .eq("client_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform data to include balance information
        const projectsWithBalances = data.map((project) => ({
          ...project,
          paid_amount: project.project_balances.paid_amount,
          remaining_balance: project.project_balances.remaining_balance,
        }));

        setProjects(projectsWithBalances);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='container space-y-8 py-8'>
      <div className='grid gap-4'>
        {projects.map((project) => (
          <Card
            key={project.id}
            className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <CardTitle className='text-xl font-semibold'>
                    {project.name}
                  </CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    {project.description}
                  </p>
                </div>
                <Badge className={statusColors[project.status]}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-indigo-400' />
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Start Date</p>
                    <p className='text-sm font-medium'>
                      {format(new Date(project.start_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {project.expected_end_date && (
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-purple-400' />
                    <div className='space-y-1'>
                      <p className='text-sm text-muted-foreground'>
                        Expected End
                      </p>
                      <p className='text-sm font-medium'>
                        {format(
                          new Date(project.expected_end_date),
                          "MMM d, yyyy"
                        )}
                      </p>
                    </div>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-green-400' />
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>
                      Total Amount
                    </p>
                    <p className='text-sm font-medium'>
                      ${project.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-blue-400' />
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Paid Amount</p>
                    <p className='text-sm font-medium'>
                      ${project.paid_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-4 space-y-2'>
                <div className='flex w-full items-center gap-2'>
                  <div className='h-2 flex-1 rounded-full bg-muted'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500'
                      style={{
                        width: `${
                          (project.paid_amount / project.total_amount) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className='text-sm text-muted-foreground'>
                    {Math.round(
                      (project.paid_amount / project.total_amount) * 100
                    )}
                    %
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  ${project.remaining_balance.toLocaleString()} remaining
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
