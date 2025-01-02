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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Users,
  Timer,
  ArrowUpRight,
  User,
  MoreHorizontal,
  CheckCircle2,
  Inbox,
} from "lucide-react";

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

export default function CompletedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
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
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
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
              Completed Projects
            </h1>
            <p className='text-muted-foreground'>
              View and manage your completed projects
            </p>
          </div>
        </div>

        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-blue-500/10 to-blue-500/10'>
              <CheckCircle2 className='h-10 w-10 text-blue-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>
              No completed projects
            </h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              You don't have any completed projects yet. Projects will appear
              here once they're marked as completed.
            </p>
            <Button
              variant='outline'
              className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-all hover:bg-accent hover:shadow-[0_0_1rem_0_rgba(99,102,241,0.1)]'
              onClick={() => window.history.back()}>
              Go back to active projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Completed Projects
          </h1>
          <p className='text-muted-foreground'>
            View and manage your completed projects
          </p>
        </div>
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
              Completion Date
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
                        project.status === "completed" &&
                          "from-blue-500/10 to-blue-500/20 text-blue-400 hover:from-blue-500/15 hover:to-blue-500/25"
                      )}>
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
                        <DropdownMenuItem>Download report</DropdownMenuItem>
                        <DropdownMenuItem>View team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-red-400'>
                          Delete project
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
                      <span className='font-medium text-blue-400'>
                        {project.progress}%
                      </span>
                    </div>
                    <Progress
                      value={project.progress}
                      className='h-2 bg-gradient-to-r from-blue-500/20 to-blue-500/20'
                      indicatorClassName='bg-gradient-to-r from-blue-500 to-blue-500'
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
                          project.status === "completed" &&
                            "from-blue-500/10 to-blue-500/20 text-blue-400 hover:from-blue-500/15 hover:to-blue-500/25"
                        )}>
                        Completed
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
                          <span className='font-medium text-blue-400'>
                            {project.progress}%
                          </span>
                        </div>
                        <Progress
                          value={project.progress}
                          className='h-2 bg-gradient-to-r from-blue-500/20 to-blue-500/20'
                          indicatorClassName='bg-gradient-to-r from-blue-500 to-blue-500'
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
                          <DropdownMenuItem>Download report</DropdownMenuItem>
                          <DropdownMenuItem>View team</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-red-400'>
                            Delete project
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
