'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { adminOutlineButtonClass } from '@/components/admin/admin-button-styles';

export function ViewStorefrontButton() {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={`h-9 cursor-pointer rounded-full px-4 ${adminOutlineButtonClass}`}
    >
      <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        Xem cửa hàng
      </a>
    </Button>
  );
}
