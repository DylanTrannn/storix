'use client';

import { memo, useEffect, useState } from 'react';
import { Input } from '@storix/ui/input';
import {
  getCompareAtPriceFieldLabel,
  getPriceFieldLabel,
  isZeroDecimalCurrency,
} from '@/lib/admin/product-price';

export interface VariantDraft {
  id?: string;
  options: Record<string, string>;
  sku: string;
  priceInput: string;
  compareAtPriceInput: string;
  inventory: number;
  imageUrl?: string | null;
}

export interface OptionDimensionDraft {
  name: string;
  values: string[];
}

interface VariantRowProps {
  rowIndex: number;
  variant: VariantDraft;
  optionDimensions: OptionDimensionDraft[];
  onFieldChange: (
    index: number,
    field: keyof VariantDraft,
    value: VariantDraft[keyof VariantDraft],
  ) => void;
}

export const VariantRow = memo(function VariantRow({
  rowIndex,
  variant,
  optionDimensions,
  onFieldChange,
}: VariantRowProps) {
  const priceStep = isZeroDecimalCurrency() ? '1' : '0.01';
  const hasOptions = optionDimensions.some((d) => d.name.trim() && d.values.length > 0);
  const [inventoryInput, setInventoryInput] = useState(String(variant.inventory));

  useEffect(() => {
    setInventoryInput(String(variant.inventory));
  }, [variant.inventory]);

  function commitInventory() {
    const trimmed = inventoryInput.trim();
    const parsed = trimmed === '' ? 0 : Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setInventoryInput(String(variant.inventory));
      return;
    }
    setInventoryInput(String(parsed));
    if (parsed !== variant.inventory) {
      onFieldChange(rowIndex, 'inventory', parsed);
    }
  }

  return (
    <tr className="border-b border-border/60 last:border-0">
      {hasOptions ? (
        optionDimensions.map((dim) => (
          <td key={dim.name} className="px-2 py-2.5 text-sm font-medium whitespace-nowrap">
            {variant.options[dim.name] ?? '—'}
          </td>
        ))
      ) : (
        <td className="px-2 py-2.5 text-sm font-medium text-muted-foreground">Mặc định</td>
      )}

      <td className="px-2 py-2.5">
        <Input
          value={variant.priceInput}
          onChange={(e) => onFieldChange(rowIndex, 'priceInput', e.target.value)}
          type="number"
          min={isZeroDecimalCurrency() ? '1' : '0.01'}
          step={priceStep}
          className="h-9 w-28 bg-background"
          placeholder={isZeroDecimalCurrency() ? '350000' : '29.99'}
        />
      </td>
      <td className="px-2 py-2.5">
        <Input
          value={variant.compareAtPriceInput}
          onChange={(e) => onFieldChange(rowIndex, 'compareAtPriceInput', e.target.value)}
          type="number"
          min={isZeroDecimalCurrency() ? '1' : '0.01'}
          step={priceStep}
          className="h-9 w-24 bg-background"
          placeholder="—"
        />
      </td>
      <td className="px-2 py-2.5">
        <Input
          value={variant.sku}
          onChange={(e) => onFieldChange(rowIndex, 'sku', e.target.value)}
          className="h-9 min-w-[120px] bg-background text-xs"
        />
      </td>
      <td className="px-2 py-2.5">
        <Input
          value={inventoryInput}
          onChange={(e) => setInventoryInput(e.target.value)}
          onBlur={commitInventory}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitInventory();
            }
          }}
          type="text"
          inputMode="numeric"
          className="h-9 w-20 bg-background"
          aria-label="Tồn kho"
        />
      </td>
    </tr>
  );
}, (prev, next) => (
  prev.rowIndex === next.rowIndex &&
  prev.variant === next.variant &&
  prev.optionDimensions === next.optionDimensions &&
  prev.onFieldChange === next.onFieldChange
));

interface VariantTableHeaderProps {
  optionDimensions: OptionDimensionDraft[];
}

export function VariantTableHeader({ optionDimensions }: VariantTableHeaderProps) {
  const hasOptions = optionDimensions.some((d) => d.name.trim() && d.values.length > 0);

  return (
    <thead>
      <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
        {hasOptions ? (
          optionDimensions.map((dim) => (
            <th key={dim.name} className="px-2 py-2 font-medium whitespace-nowrap">
              {dim.name.trim() || 'Tùy chọn'}
            </th>
          ))
        ) : (
          <th className="px-2 py-2 font-medium">Biến thể</th>
        )}
        <th className="px-2 py-2 font-medium">{getPriceFieldLabel()}</th>
        <th className="px-2 py-2 font-medium">{getCompareAtPriceFieldLabel()}</th>
        <th className="px-2 py-2 font-medium">SKU</th>
        <th className="px-2 py-2 font-medium">Tồn kho</th>
      </tr>
    </thead>
  );
}
