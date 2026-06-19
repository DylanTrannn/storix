'use client';

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@storix/ui/button';

interface AdminFormDialogProps {
  triggerLabel: string;
  title: string;
  description?: string;
  children: (props: { onSuccess: () => void; onCancel: () => void }) => ReactNode;
}

export function AdminFormDialog({
  triggerLabel,
  title,
  description,
  children,
}: AdminFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-black/80"
              aria-label="Close dialog"
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              className="relative z-10 grid w-full max-w-2xl max-h-[90vh] gap-4 overflow-y-auto rounded-lg border border-border bg-background p-6 text-foreground shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 text-left">
                  <h2 id={titleId} className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </h2>
                  {description && (
                    <p id={descriptionId} className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={close}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children({ onSuccess: close, onCancel: close })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Button type="button" className="rounded-full" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {modal}
    </>
  );
}
