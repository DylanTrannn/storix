import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-stone-100 text-stone-700',
  archived: 'bg-stone-100 text-stone-500',
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyles[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}
