"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, MoreHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  amount: number;
  due_date: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  created_at: string;
  updated_at: string;
  project?: {
    name: string;
    total_amount: number;
  };
  payments?: {
    amount: number;
    status: string;
  }[];
}

interface Project {
  id: string;
  name: string;
  total_amount: number;
}

interface GroupedMilestones {
  [key: string]: {
    project: Project;
    milestones: Milestone[];
    totalAmount: number;
    completedAmount: number;
  };
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const supabase = createBrowserClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchMilestones();
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, total_amount")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  async function fetchMilestones() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from("project_milestones")
        .select(
          `
          *,
          project:projects(name, total_amount),
          payments:payments(amount, status)
        `
        )
        .order("due_date", { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast({
        title: "Error",
        description: "Failed to fetch milestones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!selectedProject || !title || !amount || !dueDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase.from("project_milestones").insert({
        title,
        description,
        project_id: selectedProject,
        amount: parseFloat(amount),
        due_date: dueDate.toISOString(),
        status: "PENDING",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Milestone created successfully.",
      });

      setCreateDialogOpen(false);
      resetForm();
      fetchMilestones();
    } catch (error) {
      console.error("Error creating milestone:", error);
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateStatus(
    id: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) {
    try {
      const { error } = await supabase
        .from("project_milestones")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Milestone status updated successfully.",
      });

      fetchMilestones();
    } catch (error) {
      console.error("Error updating milestone status:", error);
      toast({
        title: "Error",
        description: "Failed to update milestone status. Please try again.",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setSelectedProject("");
    setTitle("");
    setDescription("");
    setAmount("");
    setDueDate(undefined);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return <Badge variant='secondary'>Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant='default'>In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant='success'>Completed</Badge>;
      default:
        return null;
    }
  }

  function groupMilestonesByProject(): GroupedMilestones {
    return milestones.reduce((acc: GroupedMilestones, milestone) => {
      if (!milestone.project) return acc;

      if (!acc[milestone.project_id]) {
        acc[milestone.project_id] = {
          project: {
            id: milestone.project_id,
            name: milestone.project.name,
            total_amount: milestone.project.total_amount,
          },
          milestones: [],
          totalAmount: 0,
          completedAmount: 0,
        };
      }

      acc[milestone.project_id].milestones.push(milestone);
      acc[milestone.project_id].totalAmount += milestone.amount;
      if (milestone.status === "COMPLETED") {
        acc[milestone.project_id].completedAmount += milestone.amount;
      }

      return acc;
    }, {});
  }

  if (isLoading) {
    return (
      <div className='container flex h-[200px] items-center justify-center'>
        <div className='space-y-4 text-center'>
          <div className='text-lg font-medium'>Loading milestones...</div>
          <div className='text-sm text-muted-foreground'>
            Please wait while we fetch your milestones
          </div>
        </div>
      </div>
    );
  }

  const groupedMilestones = groupMilestonesByProject();

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Milestones</h1>
          <p className='text-muted-foreground'>
            Track project milestones and payment schedules
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                <Plus className='mr-2 h-4 w-4' />
                Create Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle className='text-xl font-semibold tracking-tight'>
                  Create Milestone
                </DialogTitle>
                <DialogDescription className='text-muted-foreground'>
                  Add a new milestone to track project progress and payments
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-5 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='project' className='font-medium'>
                    Project
                  </Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a project' />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='title' className='font-medium'>
                    Title
                  </Label>
                  <Input
                    id='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Enter milestone title'
                    className='w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description' className='font-medium'>
                    Description
                  </Label>
                  <Textarea
                    id='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Enter milestone description'
                    className='min-h-[100px] w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='amount' className='font-medium'>
                    Amount
                  </Label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                      $
                    </span>
                    <Input
                      id='amount'
                      type='number'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder='0.00'
                      className='pl-7'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='font-medium'>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}>
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='submit'
                  onClick={handleCreate}
                  className='w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  Create Milestone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {Object.keys(groupedMilestones).length === 0 ? (
        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10'>
              <CalendarIcon className='h-10 w-10 text-indigo-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No milestones</h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              You haven't created any milestones yet. Start by creating your
              first milestone.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  <Plus className='mr-2 h-4 w-4' />
                  Create your first milestone
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-md'>
                <DialogHeader>
                  <DialogTitle className='text-xl font-semibold tracking-tight'>
                    Create Milestone
                  </DialogTitle>
                  <DialogDescription className='text-muted-foreground'>
                    Add a new milestone to track project progress and payments
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-5 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='project' className='font-medium'>
                      Project
                    </Label>
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select a project' />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='title' className='font-medium'>
                      Title
                    </Label>
                    <Input
                      id='title'
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder='Enter milestone title'
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description' className='font-medium'>
                      Description
                    </Label>
                    <Textarea
                      id='description'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder='Enter milestone description'
                      className='min-h-[100px] w-full'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='amount' className='font-medium'>
                      Amount
                    </Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                        $
                      </span>
                      <Input
                        id='amount'
                        type='number'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder='0.00'
                        className='pl-7'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label className='font-medium'>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}>
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='submit'
                    onClick={handleCreate}
                    className='w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                    Create Milestone
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <div className='space-y-8'>
          {Object.values(groupedMilestones).map(
            ({ project, milestones, totalAmount, completedAmount }) => (
              <Card key={project.id}>
                <CardHeader className='pb-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle>{project.name}</CardTitle>
                    <div className='text-sm text-muted-foreground'>
                      Progress: ${completedAmount.toFixed(2)} / $
                      {totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <Progress
                    value={(completedAmount / totalAmount) * 100}
                    className='h-2'
                  />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='w-[70px]'></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milestones.map((milestone) => (
                        <TableRow key={milestone.id}>
                          <TableCell className='font-medium'>
                            <div>
                              <div>{milestone.title}</div>
                              {milestone.description && (
                                <div className='text-sm text-muted-foreground'>
                                  {milestone.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${milestone.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {format(new Date(milestone.due_date), "PPP")}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(milestone.status)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='hover:bg-background/80'>
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align='end'
                                className='w-[160px]'>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(milestone.id, "PENDING")
                                  }>
                                  Mark as Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(
                                      milestone.id,
                                      "IN_PROGRESS"
                                    )
                                  }>
                                  Mark as In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(
                                      milestone.id,
                                      "COMPLETED"
                                    )
                                  }>
                                  Mark as Completed
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
