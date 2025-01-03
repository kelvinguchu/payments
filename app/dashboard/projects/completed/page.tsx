"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Calendar,
  ArrowUpRight,
  User,
  Folder,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  total_amount: number;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  admin: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  total_amount: number;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  admin: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function CompletedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data: projectsData, error } = await supabase
          .from("projects")
          .select(
            `
            id,
            name,
            description,
            status,
            total_amount,
            start_date,
            expected_end_date,
            actual_end_date,
            admin:profiles!projects_admin_id_fkey (
              full_name,
              avatar_url
            )
          `
          )
          .eq("client_id", user.id)
          .eq("status", "COMPLETED")
          .order("actual_end_date", { ascending: false });

        if (error) throw error;

        // Transform the data to match the Project type
        const transformedProjects: Project[] = (projectsData || []).map(
          (project: any) => ({
            ...project,
            admin: {
              full_name: project.admin?.full_name || "",
              avatar_url: project.admin?.avatar_url || null,
            },
          })
        );

        setProjects(transformedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className='container flex h-[200px] items-center justify-center'>
        <div className='space-y-4 text-center'>
          <div className='text-lg font-medium'>Loading projects...</div>
          <div className='text-sm text-muted-foreground'>
            Please wait while we fetch your projects
          </div>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className='container space-y-8 px-4 py-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Completed Projects
          </h1>
          <p className='text-muted-foreground'>
            View your completed projects history
          </p>
        </div>

        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10'>
              <Check className='h-10 w-10 text-indigo-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>
              No Completed Projects Yet
            </h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              Your completed projects will appear here once any of your active
              projects are marked as completed by the admin.
            </p>
            <p className='text-sm text-muted-foreground'>
              Check the "My Projects" section to view your active projects.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Completed Projects
        </h1>
        <p className='text-muted-foreground'>
          View your completed projects history
        </p>
      </div>

      <Tabs defaultValue='grid' className='space-y-4'>
        <div className='flex items-center justify-between'>
          <TabsList className='bg-gradient-to-b from-background/50 to-background/80 backdrop-blur'>
            <TabsTrigger value='grid'>Grid View</TabsTrigger>
            <TabsTrigger value='list'>List View</TabsTrigger>
          </TabsList>
          <Button variant='outline' size='sm' className='border-border/40'>
            <Calendar className='mr-2 h-4 w-4' />
            Completion Date
          </Button>
        </div>

        <TabsContent value='grid' className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {projects.map((project) => (
              <Card
                key={project.id}
                className='border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
                <CardHeader className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <Badge className='bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-400 hover:from-blue-500/15 hover:to-blue-500/25 font-normal'>
                      Completed
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className='h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-[160px] bg-gradient-to-b from-background/95 to-background/98 backdrop-blur'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>View milestones</DropdownMenuItem>
                        <DropdownMenuItem>View documents</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className='line-clamp-1'>{project.name}</CardTitle>
                  <CardDescription className='line-clamp-2'>
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Project Value
                      </span>
                      <span className='font-medium text-indigo-400'>
                        {formatCurrency(project.total_amount)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Start Date</span>
                      <span className='font-medium'>
                        {formatDate(project.start_date)}
                      </span>
                    </div>
                    {project.actual_end_date && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Completed On
                        </span>
                        <span className='font-medium'>
                          {formatDate(project.actual_end_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='flex items-center gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage
                          src={project.admin.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          <User className='h-4 w-4' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid gap-0.5'>
                        <span className='font-medium'>
                          {project.admin.full_name}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          Project Admin
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='list'>
          <Card className='border-border/40'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className='font-medium'>{project.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {project.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className='bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-400 hover:from-blue-500/15 hover:to-blue-500/25 font-normal'>
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(project.total_amount)}
                    </TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>
                      {project.actual_end_date
                        ? formatDate(project.actual_end_date)
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage
                            src={project.admin.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            <User className='h-4 w-4' />
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>
                          {project.admin.full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10'>
                        <ArrowUpRight className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
