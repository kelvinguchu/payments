"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  MoreHorizontal,
  Plus,
  Upload,
  Download,
  Trash2,
  FileImage,
  File,
  Receipt,
  FileContract,
  FileCheck,
  Search,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  category:
    | "payment_receipt"
    | "contract"
    | "invoice"
    | "deliverable"
    | "other";
  project_id: string | null;
  created_at: string;
  user_id: string;
  project?: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>("");
  const supabase = createBrowserClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  async function fetchDocuments() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from("documents")
        .select(
          `
          *,
          project:projects(name)
        `
        )
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`${session.session.user.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(`${session.session.user.id}/${fileName}`);

      // Save document metadata to database
      const { error: dbError } = await supabase.from("documents").insert({
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        category: selectedCategory || "other",
        project_id: selectedProject || null,
        user_id: session.session.user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });

      setUploadDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string, url: string) {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // Delete from Storage
      const filePath = url.split("/").slice(-2).join("/");
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case "payment_receipt":
        return <Receipt className='h-4 w-4 text-green-400' />;
      case "contract":
        return <FileContract className='h-4 w-4 text-purple-400' />;
      case "invoice":
        return <FileText className='h-4 w-4 text-blue-400' />;
      case "deliverable":
        return <FileCheck className='h-4 w-4 text-orange-400' />;
      default:
        return <File className='h-4 w-4 text-indigo-400' />;
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    const matchesProject = !filterProject || doc.project_id === filterProject;
    return matchesSearch && matchesCategory && matchesProject;
  });

  if (isLoading) {
    return (
      <div className='container flex h-[200px] items-center justify-center'>
        <div className='space-y-4 text-center'>
          <div className='text-lg font-medium'>Loading documents...</div>
          <div className='text-sm text-muted-foreground'>
            Please wait while we fetch your documents
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container space-y-8 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Documents</h1>
          <p className='text-muted-foreground'>
            Upload and manage your project documents
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                <Plus className='mr-2 h-4 w-4' />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Choose a file and assign it to a project and category
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='project'>Project (Optional)</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a project' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='category'>Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='payment_receipt'>
                        Payment Receipt
                      </SelectItem>
                      <SelectItem value='contract'>Contract</SelectItem>
                      <SelectItem value='invoice'>Invoice</SelectItem>
                      <SelectItem value='deliverable'>Deliverable</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='file'>File</Label>
                  <Input
                    id='file'
                    type='file'
                    onChange={handleFileUpload}
                    accept='.pdf,.doc,.docx,.txt,.xls,.xlsx,.png,.jpg,.jpeg'
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className='flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/40'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10'>
              <FileImage className='h-10 w-10 text-indigo-400' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No documents</h3>
            <p className='mb-4 mt-2 text-sm text-muted-foreground'>
              You haven't uploaded any documents yet. Start by uploading your
              first document.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                  <Plus className='mr-2 h-4 w-4' />
                  Upload your first document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Choose a file and assign it to a project and category
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='project'>Project (Optional)</Label>
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a project' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=''>No Project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='category'>Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='payment_receipt'>
                          Payment Receipt
                        </SelectItem>
                        <SelectItem value='contract'>Contract</SelectItem>
                        <SelectItem value='invoice'>Invoice</SelectItem>
                        <SelectItem value='deliverable'>Deliverable</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='file'>File</Label>
                    <Input
                      id='file'
                      type='file'
                      onChange={handleFileUpload}
                      accept='.pdf,.doc,.docx,.txt,.xls,.xlsx,.png,.jpg,.jpeg'
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-1 items-center gap-4'>
              <div className='relative flex-1 max-w-sm'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search documents...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All Categories</SelectItem>
                  <SelectItem value='payment_receipt'>
                    Payment Receipts
                  </SelectItem>
                  <SelectItem value='contract'>Contracts</SelectItem>
                  <SelectItem value='invoice'>Invoices</SelectItem>
                  <SelectItem value='deliverable'>Deliverables</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='All Projects' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border border-border/40'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className='w-[70px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center gap-2'>
                        {getCategoryIcon(doc.category)}
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell className='capitalize'>
                      {doc.category.replace("_", " ")}
                    </TableCell>
                    <TableCell>{doc.project?.name || "—"}</TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
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
                          className='w-[160px] bg-gradient-to-b from-background/95 to-background/80 backdrop-blur'>
                          <DropdownMenuItem
                            onClick={() => window.open(doc.url, "_blank")}
                            className='cursor-pointer'>
                            <Download className='mr-2 h-4 w-4' />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc.id, doc.url)}
                            className='cursor-pointer text-destructive focus:text-destructive'>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
