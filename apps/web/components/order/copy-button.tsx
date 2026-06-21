'use client';

import { useState } from 'react';
import { Button } from '@storix/ui/button';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Sao chép', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="mr-1.5 size-3.5" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="mr-1.5 size-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}
