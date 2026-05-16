import { cn } from '@/lib/utils';

interface PropsSkeleton {
  className?: string;
}

export function Skeleton({ className }: PropsSkeleton) {
  return <div className={cn('skeleton', className)} />;
}
