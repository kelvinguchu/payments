"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { FileBarChart } from "lucide-react";

interface ChartData {
  month: string;
  total: number;
}

export function Overview() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactionData() {
      const supabase = createBrowserClient();
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .order("created_at", { ascending: true });

      if (!transactions?.length) {
        setLoading(false);
        return;
      }

      // Process transactions into monthly totals
      const monthlyData = transactions.reduce(
        (acc: { [key: string]: number }, transaction) => {
          const date = new Date(transaction.created_at);
          const monthKey = date.toLocaleString("default", { month: "short" });
          acc[monthKey] = (acc[monthKey] || 0) + transaction.amount;
          return acc;
        },
        {}
      );

      // Convert to chart data format
      const chartData = Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total,
      }));

      setData(chartData);
      setLoading(false);
    }

    fetchTransactionData();
  }, []);

  if (loading) {
    return null; // Parent component handles loading state
  }

  if (!data.length) {
    return (
      <div className='flex h-[350px] flex-col items-center justify-center text-center'>
        <FileBarChart className='h-10 w-10 text-muted-foreground/60' />
        <h3 className='mt-4 text-lg font-medium text-muted-foreground'>
          No data available
        </h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Start making transactions to see your financial overview.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey='month'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className='border-border/40 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-2'>
                  <div className='grid gap-2'>
                    <div className='flex items-center'>
                      <div className='ml-2'>
                        <div className='text-[0.70rem] uppercase text-muted-foreground'>
                          {payload[0].payload.month}
                        </div>
                        <div className='font-bold text-indigo-400'>
                          ${payload[0].value?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }
            return null;
          }}
        />
        <Line
          type='monotone'
          dataKey='total'
          stroke='url(#gradient)'
          strokeWidth={2}
          dot={false}
        />
        <defs>
          <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#6366f1' stopOpacity={0.5} />
            <stop offset='100%' stopColor='#6366f1' stopOpacity={0} />
          </linearGradient>
        </defs>
      </LineChart>
    </ResponsiveContainer>
  );
}
