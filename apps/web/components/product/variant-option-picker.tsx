'use client';

import { Button } from '@storix/ui/button';
import { cn } from '@/lib/utils';
import {
  extractOptionDimensions,
  hasMultipleVariants,
  isOptionValueAvailable,
  type VariantLike,
} from '@/lib/product/variants';

export interface VariantPickerVariant extends VariantLike {
  id: string;
  price: number;
}

interface VariantOptionPickerProps {
  variants: VariantPickerVariant[];
  selection: Record<string, string>;
  onSelectionChange: (selection: Record<string, string>) => void;
  compact?: boolean;
  className?: string;
}

function capitalizeOptionName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function VariantOptionPicker({
  variants,
  selection,
  onSelectionChange,
  compact = false,
  className,
}: VariantOptionPickerProps) {
  const dimensions = extractOptionDimensions(variants);

  if (!hasMultipleVariants(variants)) {
    return null;
  }

  function handleSelect(dimensionName: string, value: string) {
    onSelectionChange({ ...selection, [dimensionName]: value });
  }

  return (
    <div className={cn(compact ? 'space-y-3' : 'space-y-4', className)}>
      {dimensions.map((dimension) => (
        <div key={dimension.name} className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
          <p className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
            {capitalizeOptionName(dimension.name)}
            {selection[dimension.name] ? (
              <span className="ml-1.5 font-normal text-muted-foreground">
                — {selection[dimension.name]}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {dimension.values.map((value) => {
              const isSelected = selection[dimension.name] === value;
              const isAvailable = isOptionValueAvailable(
                variants,
                selection,
                dimension.name,
                value,
              );

              return (
                <Button
                  key={value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size={compact ? 'sm' : 'default'}
                  disabled={!isAvailable && !isSelected}
                  onClick={() => handleSelect(dimension.name, value)}
                  className={cn(
                    'h-9 min-w-9 px-3',
                    !isAvailable && !isSelected && 'opacity-50 line-through',
                  )}
                  aria-pressed={isSelected}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
