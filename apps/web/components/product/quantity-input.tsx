'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  compact = false,
  className,
}: QuantityInputProps) {
  function clamp(next: number) {
    return Math.min(max, Math.max(min, next));
  }

  function handleDecrease() {
    onChange(clamp(value - 1));
  }

  function handleIncrease() {
    onChange(clamp(value + 1));
  }

  function handleInputChange(raw: string) {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) return;
    onChange(clamp(parsed));
  }

  const buttonSize = compact ? 'h-9 w-9' : 'h-10 w-10';
  const inputHeight = compact ? 'h-9' : 'h-10';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn('w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', inputHeight)}
        aria-label="Quantity"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
