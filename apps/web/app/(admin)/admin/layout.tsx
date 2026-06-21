import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { getCurrentUser } from '@/lib/api';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { adminIconButtonClass } from '@/components/admin/admin-button-styles';
import { ViewStorefrontButton } from '@/components/admin/view-storefront-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/admin');
  if (user.role !== 'admin') redirect('/account');

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Bảng điều khiển
            </p>
            <p className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`cursor-pointer rounded-full ${adminIconButtonClass}`}
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <ViewStorefrontButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
