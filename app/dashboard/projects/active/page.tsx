"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Suspense } from "react";
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
  Inbox,
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

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on_hold";
  progress: number;
  due_date: string;
  team_size: number;
  budget: number;
  client: {
    name: string;
    avatar_url: string | null;
  };
}

interface Client {
  id: string;
  name: string;
}

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          supabase
            .from("projects")
            .select(
              `
              id,
              name,
              description,
              status,
              progress,
              due_date,
              team_size,
              budget,
              client:profiles(name, avatar_url)
            `
            )
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, name").eq("role", "client"),
        ]);

        if (projectsResponse.error) throw projectsResponse.error;
        if (clientsResponse.error) throw clientsResponse.error;

        setProjects(projectsResponse.data || []);
        setClients(clientsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
              Manage and track your ongoing projects
            </p>
          </div>
          <NewProjectDialog clients={clients || []}>
            <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
              <Plus className='mr-2 h-4 w-4' />
              New Project
            </Button>
          </NewProjectDialog>
        </div>

        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10'>
              <FolderPlus className='h-10 w-10 text-indigo-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No active projects</h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              You haven't created any projects yet. Start by creating your first
              project.
            </p>
            <NewProjectDialog clients={clients || []}>
              <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                <Plus className='mr-2 h-4 w-4' />
                Create your first project
              </Button>
            </NewProjectDialog>
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
            Manage and track your ongoing projects
          </p>
        </div>
        <NewProjectDialog clients={clients || []}>
          <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
            <Plus className='mr-2 h-4 w-4' />
            New Project
          </Button>
        </NewProjectDialog>
      </div>

      <Tabs defaultValue='grid' className='space-y-4'>
        <div className='flex items-center justify-between'>
          <TabsList className='bg-gradient-to-b from-background/50 to-background/80 backdrop-blur'>
            <TabsTrigger value='grid'>Grid View</TabsTrigger>
            <TabsTrigger value='list'>List View</TabsTrigger>
          </TabsList>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='border-border/40'>
              <Calendar className='mr-2 h-4 w-4' />
              Due Date
            </Button>
            <Button variant='outline' size='sm' className='border-border/40'>
              <Users className='mr-2 h-4 w-4' />
              Team Size
            </Button>
          </div>
        </div>

        <TabsContent value='grid' className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {projects?.map((project) => (
              <Card
                key={project.id}
                className='border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
                <CardHeader className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <Badge
                      className={cn(
                        "bg-gradient-to-r font-normal",
                        project.status === "active" &&
                          "from-green-500/10 to-green-500/20 text-green-400 hover:from-green-500/15 hover:to-green-500/25"
                      )}>
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
                        <DropdownMenuItem>Edit project</DropdownMenuItem>
                        <DropdownMenuItem>View team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-red-400'>
                          Archive project
                        </DropdownMenuItem>
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
                      <span className='text-muted-foreground'>Progress</span>
                      <span className='font-medium text-indigo-400'>
                        {project.progress}%
                      </span>
                    </div>
                    <Progress
                      value={project.progress}
                      className='h-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20'
                      indicatorClassName='bg-gradient-to-r from-indigo-500 to-purple-500'
                    />
                  </div>
                  <div className='flex items-center gap-4 text-sm'>
                    <div className='flex items-center gap-1'>
                      <Timer className='h-4 w-4 text-muted-foreground' />
                      <span className='text-muted-foreground'>
                        {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='text-muted-foreground'>
                        {project.team_size} members
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8 border border-border/40'>
                        <AvatarImage
                          src={project.client.avatar_url || undefined}
                        />
                        <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                          <User className='h-4 w-4 text-indigo-400' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='space-y-1'>
                        <p className='text-sm font-medium leading-none'>
                          {project.client.name}
                        </p>
                        <p className='text-xs text-muted-foreground'>Client</p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10'>
                      <ArrowUpRight className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='list'>
          <Card className='border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
            <Table>
              <TableHeader>
                <TableRow className='border-border/40 hover:bg-transparent'>
                  <TableHead className='w-[100px]'>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects?.map((project) => (
                  <TableRow
                    key={project.id}
                    className='border-border/40 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5'>
                    <TableCell>
                      <Badge
                        className={cn(
                          "bg-gradient-to-r font-normal",
                          project.status === "active" &&
                            "from-green-500/10 to-green-500/20 text-green-400 hover:from-green-500/15 hover:to-green-500/25"
                        )}>
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <p className='font-medium text-foreground'>
                          {project.name}
                        </p>
                        <p className='text-xs text-muted-foreground line-clamp-1'>
                          {project.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8 border border-border/40'>
                          <AvatarImage
                            src={project.client.avatar_url || undefined}
                          />
                          <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                            <User className='h-4 w-4 text-indigo-400' />
                          </AvatarFallback>
                        </Avatar>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium leading-none'>
                            {project.client.name}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Client
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>
                            Progress
                          </span>
                          <span className='font-medium text-indigo-400'>
                            {project.progress}%
                          </span>
                        </div>
                        <Progress
                          value={project.progress}
                          className='h-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20'
                          indicatorClassName='bg-gradient-to-r from-indigo-500 to-purple-500'
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Users className='h-4 w-4 text-muted-foreground' />
                        <span className='text-muted-foreground'>
                          {project.team_size} members
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Timer className='h-4 w-4 text-muted-foreground' />
                        <span className='text-muted-foreground'>
                          {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem>Edit project</DropdownMenuItem>
                          <DropdownMenuItem>View team</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-red-400'>
                            Archive project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
