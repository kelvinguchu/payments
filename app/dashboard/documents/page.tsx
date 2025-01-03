"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  FileImage,
  File,
  Receipt,
  ScrollText,
  FileCheck,
  Search,
} from "lucide-react";

// Create a loading skeleton component
function DocumentsTableSkeleton() {
  return (
    <div className='rounded-md border border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
      <Table>
        <TableHeader>
          <TableRow className='border-border/40 hover:bg-transparent'>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className='w-[70px]'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow
              key={index}
              className='border-border/40 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5'>
              <TableCell className='w-[300px]'>
                <div className='h-4 w-full animate-pulse rounded bg-border/40'></div>
              </TableCell>
              <TableCell>
                <div className='h-4 w-24 animate-pulse rounded bg-border/40'></div>
              </TableCell>
              <TableCell>
                <div className='h-4 w-32 animate-pulse rounded bg-border/40'></div>
              </TableCell>
              <TableCell>
                <div className='h-4 w-16 animate-pulse rounded bg-border/40'></div>
              </TableCell>
              <TableCell>
                <div className='h-4 w-24 animate-pulse rounded bg-border/40'></div>
              </TableCell>
              <TableCell>
                <div className='h-8 w-8 animate-pulse rounded bg-border/40'></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type DocumentCategory =
  | "payment_receipt"
  | "contract"
  | "invoice"
  | "deliverable"
  | "other";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  category: DocumentCategory;
  project_id: string | null;
  created_at: string;
  user_id: string;
  project?: {
    name: string;
    client_id: string;
  };
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

export default function DocumentsPage() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | "">(
    ""
  );
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("other");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const isUserAdmin = profile?.role === "admin";
        setIsAdmin(isUserAdmin);

        // Fetch documents with role-based filtering
        let query = supabase
          .from("documents")
          .select("*, project:projects(*)")
          .order("created_at", { ascending: false });

        if (!isUserAdmin) {
          // For clients, only show documents from their projects
          query = query.or(
            `user_id.eq.${user.id},project->client_id.eq.${user.id}`
          );
        }

        const { data: docs, error: docsError } = await query;
        if (docsError) throw docsError;
        setDocuments(docs || []);

        // Fetch projects with role-based filtering
        let projectsQuery = supabase
          .from("projects")
          .select("id, name, client_id");

        if (!isUserAdmin) {
          projectsQuery = projectsQuery.eq("client_id", user.id);
        }

        const { data: projectsData, error: projectsError } =
          await projectsQuery;
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Error initializing:", error);
        toast({
          title: "Error",
          description: "Failed to load documents. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [supabase, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Insert into database
      const { error: dbError } = await supabase.from("documents").insert({
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        category: selectedCategory,
        project_id: selectedProject || null,
        user_id: user.id,
      });

      if (dbError) throw dbError;

      // Refresh documents
      const { data: newDoc } = await supabase
        .from("documents")
        .select("*, project:projects(*)")
        .eq("url", urlData.publicUrl)
        .single();

      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setUploadDialogOpen(false);
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
  };

  const handleDelete = async (id: string) => {
    try {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;

      // Delete from storage
      const filePath = doc.url.split("/").pop();
      if (filePath) {
        await supabase.storage.from("documents").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  function getCategoryIcon(category: DocumentCategory) {
    switch (category) {
      case "payment_receipt":
        return <Receipt className='h-4 w-4 text-green-400' />;
      case "contract":
        return <ScrollText className='h-4 w-4 text-blue-400' />;
      case "invoice":
        return <FileText className='h-4 w-4 text-purple-400' />;
      case "deliverable":
        return <FileCheck className='h-4 w-4 text-orange-400' />;
      default:
        return <File className='h-4 w-4 text-gray-400' />;
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

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <DocumentsTableSkeleton />;
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Documents</h2>
          <p className='text-muted-foreground'>
            {isAdmin
              ? "Manage and organize your documents"
              : "View and download project documents"}
          </p>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30'>
                <Upload className='mr-2 h-4 w-4' />
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
                    value={selectedProject || "none"}
                    onValueChange={(value) =>
                      setSelectedProject(value === "none" ? null : value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a project' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>No Project</SelectItem>
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
                    onValueChange={(value: string) =>
                      setSelectedCategory(value as DocumentCategory)
                    }>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Select category' />
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
        )}
      </div>

      {!documents.length ? (
        <div className='flex h-[350px] flex-col items-center justify-center space-y-3 rounded-lg border border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
          <div className='rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10 p-3'>
            <FileText className='h-6 w-6 text-indigo-400' />
          </div>
          <div className='text-center'>
            <h3 className='text-lg font-medium text-muted-foreground'>
              No documents found
            </h3>
            <p className='text-sm text-muted-foreground'>
              {isAdmin
                ? "Upload your first document to get started"
                : "No documents have been uploaded for your projects yet"}
            </p>
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
              <Select
                value={filterCategory}
                onValueChange={(value: string) =>
                  setFilterCategory(value as DocumentCategory | "")
                }>
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
              <Select
                value={filterProject || "all"}
                onValueChange={(value) =>
                  setFilterProject(value === "all" ? null : value)
                }>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='All Projects' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Projects</SelectItem>
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
                    <TableCell className='font-medium'>{doc.name}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getCategoryIcon(doc.category)}
                        <span className='text-muted-foreground'>
                          {doc.category
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {doc.project?.name || "No Project"}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {formatFileSize(doc.size)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(doc.created_at).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(doc.url, "_blank")}>
                            View
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-red-400'
                                onClick={() => handleDelete(doc.id)}>
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
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
