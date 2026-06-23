'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORT_OPTIONS,
  parseProductSortValue,
  toProductSortValue,
} from '@storix/shared';
import { Label } from '@storix/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';

export function CollectionSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = toProductSortValue(
    searchParams.get('sort') ?? undefined,
    searchParams.get('direction') ?? undefined,
  );

  function handleChange(value: string) {
    const { sort, direction } = parseProductSortValue(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    params.set('direction', direction);
    params.delete('page');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="sr-only">
        Sort by
      </Label>
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger id="sort" className="w-52">
          <SelectValue placeholder={DEFAULT_PRODUCT_SORT.label} />
        </SelectTrigger>
        <SelectContent align="end">
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
