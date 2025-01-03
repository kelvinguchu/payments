import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentsTableSkeleton() {
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
              <TableCell>
                <Skeleton className='h-4 w-48' />
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-24' />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-32' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-16' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-24' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-8 w-8 rounded-md' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
