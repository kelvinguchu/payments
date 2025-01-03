"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  MoreHorizontal,
  Calendar,
  Users,
  Timer,
  ArrowUpRight,
  User,
  Folder,
  FolderPlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  total_amount: number;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  client: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Client {
  id: string;
  name: string;
}

type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  total_amount: number;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  client: {
    full_name: string;
    avatar_url: string | null;
  }[];
};

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) return;

        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.session.user.id)
          .single();

        const isAdminUser = profile?.role === "admin";
        setIsAdmin(isAdminUser);

        // Fetch projects based on role
        const projectsQuery = supabase
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
            client:profiles!projects_client_id_fkey(
              full_name,
              avatar_url
            )
            `
          )
          .eq("status", "ACTIVE");

        if (!isAdminUser) {
          projectsQuery.eq("client_id", session.session.user.id);
        }

        const [projectsResponse, clientsResponse] = await Promise.all([
          projectsQuery.order("start_date", { ascending: false }),
          isAdminUser
            ? supabase
                .from("profiles")
                .select("id, full_name")
                .eq("role", "client")
            : null,
        ]);

        if (projectsResponse.error) throw projectsResponse.error;
        if (clientsResponse?.error) throw clientsResponse.error;

        // Transform the response data to match our Project interface
        const transformedProjects = (projectsResponse.data || []).map(
          (project: ProjectResponse) => ({
            ...project,
            client: project.client[0], // Take the first client since it's an array in the response
          })
        );

        setProjects(transformedProjects);
        if (isAdminUser && clientsResponse?.data) {
          // Transform client data to match the expected interface
          const transformedClients = clientsResponse.data.map((client) => ({
            id: client.id,
            name: client.full_name, // Map full_name to name
          }));
          setClients(transformedClients);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Active Projects
            </h1>
            <p className='text-muted-foreground'>
              {isAdmin
                ? "Manage and track your ongoing projects"
                : "View and track your ongoing projects"}
            </p>
          </div>
          {isAdmin && (
            <NewProjectDialog clients={clients}>
              <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                <Plus className='mr-2 h-4 w-4' />
                New Project
              </Button>
            </NewProjectDialog>
          )}
        </div>

        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10'>
              <Folder className='h-10 w-10 text-indigo-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No Active Projects</h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              {isAdmin
                ? "You haven't created any projects yet. Start by creating your first project."
                : "You don't have any active projects at the moment. When an admin assigns a project to you, it will appear here."}
            </p>
            {isAdmin && (
              <NewProjectDialog clients={clients}>
                <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  <Plus className='mr-2 h-4 w-4' />
                  Create your first project
                </Button>
              </NewProjectDialog>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Active Projects</h1>
          <p className='text-muted-foreground'>
            {isAdmin
              ? "Manage and track your ongoing projects"
              : "View and track your ongoing projects"}
          </p>
        </div>
        {isAdmin && (
          <NewProjectDialog clients={clients}>
            <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
              <Plus className='mr-2 h-4 w-4' />
              New Project
            </Button>
          </NewProjectDialog>
        )}
      </div>

      <Tabs defaultValue='grid' className='space-y-4'>
        <div className='flex items-center justify-between'>
          <TabsList className='bg-gradient-to-b from-background/50 to-background/80 backdrop-blur'>
            <TabsTrigger value='grid'>Grid View</TabsTrigger>
            <TabsTrigger value='list'>List View</TabsTrigger>
          </TabsList>
          <Button variant='outline' size='sm' className='border-border/40'>
            <Calendar className='mr-2 h-4 w-4' />
            Due Date
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
                    <Badge className='bg-gradient-to-r from-green-500/10 to-green-500/20 text-green-400 hover:from-green-500/15 hover:to-green-500/25 font-normal'>
                      Active
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
                        {isAdmin && (
                          <DropdownMenuItem>Edit project</DropdownMenuItem>
                        )}
                        <DropdownMenuItem>View milestones</DropdownMenuItem>
                        <DropdownMenuItem>View documents</DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-red-400'>
                              Archive project
                            </DropdownMenuItem>
                          </>
                        )}
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
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "KES",
                        }).format(project.total_amount)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Start Date</span>
                      <span className='font-medium'>
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {project.expected_end_date && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Expected End
                        </span>
                        <span className='font-medium'>
                          {new Date(
                            project.expected_end_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='flex items-center gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage
                          src={project.client.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          <User className='h-4 w-4' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid gap-0.5'>
                        <span className='font-medium'>
                          {project.client.full_name}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          Client
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
                  <TableHead>Expected End</TableHead>
                  <TableHead>Client</TableHead>
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
                      <Badge className='bg-gradient-to-r from-green-500/10 to-green-500/20 text-green-400 hover:from-green-500/15 hover:to-green-500/25 font-normal'>
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "KES",
                      }).format(project.total_amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(project.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {project.expected_end_date
                        ? new Date(
                            project.expected_end_date
                          ).toLocaleDateString()
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage
                            src={project.client.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            <User className='h-4 w-4' />
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>
                          {project.client.full_name}
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
