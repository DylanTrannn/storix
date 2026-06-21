'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@storix/ui/dialog';
import { Button } from '@storix/ui/button';

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting…',
  onConfirm,
}: AdminConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) setPending(false);
  }, [open]);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(event) => pending && event.preventDefault()}
        onEscapeKeyDown={(event) => pending && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
