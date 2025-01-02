"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User, Receipt, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  description: string;
  created_at: string;
  project: {
    name: string;
  };
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface PaymentsTableProps {
  payments: Payment[];
}

const ITEMS_PER_PAGE = 10;

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment;
    direction: "asc" | "desc";
  }>({
    key: "created_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPayments = [...payments].sort((a, b) => {
    if (sortConfig.key === "amount") {
      return sortConfig.direction === "asc"
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
    if (sortConfig.key === "created_at") {
      return sortConfig.direction === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = sortedPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: keyof Payment) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (!payments.length) {
    return (
      <div className='flex h-[350px] flex-col items-center justify-center space-y-3 rounded-lg border border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
        <div className='rounded-full bg-gradient-to-b from-indigo-500/10 to-purple-500/10 p-3'>
          <Receipt className='h-6 w-6 text-indigo-400' />
        </div>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-muted-foreground'>
            No payments found
          </h3>
          <p className='text-sm text-muted-foreground'>
            Create your first payment to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-md border border-border/40 bg-gradient-to-br from-background/50 via-background/50 to-background/50 backdrop-blur'>
        <Table>
          <TableHeader>
            <TableRow className='border-border/40 hover:bg-transparent'>
              <TableHead className='w-[100px]'>Status</TableHead>
              <TableHead
                className='cursor-pointer'
                onClick={() => requestSort("amount")}>
                <div className='flex items-center gap-2'>
                  Amount
                  <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
                </div>
              </TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead
                className='cursor-pointer'
                onClick={() => requestSort("created_at")}>
                <div className='flex items-center gap-2'>
                  Date
                  <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
                </div>
              </TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment) => (
              <TableRow
                key={payment.id}
                className='border-border/40 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5'>
                <TableCell>
                  <Badge
                    className={cn(
                      "bg-gradient-to-r font-normal",
                      payment.status === "completed" &&
                        "from-green-500/10 to-green-500/20 text-green-400 hover:from-green-500/15 hover:to-green-500/25",
                      payment.status === "processing" &&
                        "from-blue-500/10 to-blue-500/20 text-blue-400 hover:from-blue-500/15 hover:to-blue-500/25",
                      payment.status === "pending" &&
                        "from-yellow-500/10 to-yellow-500/20 text-yellow-400 hover:from-yellow-500/15 hover:to-yellow-500/25",
                      payment.status === "failed" &&
                        "from-red-500/10 to-red-500/20 text-red-400 hover:from-red-500/15 hover:to-red-500/25"
                    )}>
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className='font-medium'>
                  ${payment.amount.toLocaleString()}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {payment.project.name}
                </TableCell>
                <TableCell className='max-w-[300px] truncate text-muted-foreground'>
                  {payment.description}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8 border border-border/40'>
                      <AvatarImage src={payment.user.avatar_url || undefined} />
                      <AvatarFallback className='bg-gradient-to-r from-indigo-500/10 to-purple-500/10'>
                        <User className='h-4 w-4 text-indigo-400' />
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm text-muted-foreground'>
                      {payment.user.full_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {new Date(payment.created_at).toLocaleDateString()}
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
                      <DropdownMenuItem>Update status</DropdownMenuItem>
                      <DropdownMenuItem className='text-red-400'>
                        Delete payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                className={cn(
                  "border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-all hover:bg-accent",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                  }}
                  isActive={currentPage === i + 1}
                  className={cn(
                    "border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-all hover:bg-accent",
                    currentPage === i + 1 &&
                      "border-indigo-500/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
                  )}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                className={cn(
                  "border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-all hover:bg-accent",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
