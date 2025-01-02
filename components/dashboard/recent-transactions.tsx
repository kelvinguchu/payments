"use client";

import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  created_at: string;
  description: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions?.length) {
    return (
      <div className='flex h-[350px] flex-col items-center justify-center text-center'>
        <FileText className='h-10 w-10 text-muted-foreground/60' />
        <h3 className='mt-4 text-lg font-medium text-muted-foreground'>
          No transactions yet
        </h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          When you make transactions, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {transactions.map((transaction) => (
        <div key={transaction.id} className='flex items-center'>
          <Avatar className='h-9 w-9 border border-border/40'>
            <AvatarImage src={transaction.user.avatar_url} alt='Avatar' />
            <AvatarFallback>
              {transaction.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className='ml-4 space-y-1'>
            <p className='text-sm font-medium leading-none text-indigo-400'>
              {transaction.user.name}
            </p>
            <p className='text-sm text-muted-foreground'>
              {transaction.description}
            </p>
          </div>
          <div className='ml-auto text-right'>
            <p
              className={cn(
                "text-sm font-medium",
                transaction.status === "completed" && "text-green-400",
                transaction.status === "pending" && "text-yellow-400",
                transaction.status === "failed" && "text-red-400"
              )}>
              {transaction.status === "completed" && "+"}$
              {transaction.amount.toLocaleString()}
            </p>
            <p className='text-xs text-muted-foreground'>
              {new Date(transaction.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
