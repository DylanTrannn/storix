import type { ProductSortField, SortDirection } from './constants.js';
import { PRODUCT_SORT_FIELDS, SORT_DIRECTIONS } from './constants.js';

export type ProductSortOption = {
  value: string;
  label: string;
  sort: ProductSortField;
  direction: SortDirection;
};

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { value: 'createdAt:desc', label: 'Newest', sort: 'createdAt', direction: 'desc' },
  { value: 'createdAt:asc', label: 'Oldest', sort: 'createdAt', direction: 'asc' },
  { value: 'name:asc', label: 'A–Z', sort: 'name', direction: 'asc' },
  { value: 'name:desc', label: 'Z–A', sort: 'name', direction: 'desc' },
  { value: 'price:asc', label: 'Price: low to high', sort: 'price', direction: 'asc' },
  { value: 'price:desc', label: 'Price: high to low', sort: 'price', direction: 'desc' },
  { value: 'updatedAt:desc', label: 'Recently updated', sort: 'updatedAt', direction: 'desc' },
];

export const DEFAULT_PRODUCT_SORT = PRODUCT_SORT_OPTIONS[0];

export function isProductSortField(value: string): value is ProductSortField {
  return (PRODUCT_SORT_FIELDS as readonly string[]).includes(value);
}

export function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}

export function toProductSortValue(
  sort: string | undefined,
  direction: string | undefined,
): string {
  if (sort && direction && isProductSortField(sort) && isSortDirection(direction)) {
    const match = PRODUCT_SORT_OPTIONS.find(
      (option) => option.sort === sort && option.direction === direction,
    );
    if (match) return match.value;
  }

  return DEFAULT_PRODUCT_SORT.value;
}

export function parseProductSortValue(value: string): Pick<ProductSortOption, 'sort' | 'direction'> {
  const match = PRODUCT_SORT_OPTIONS.find((option) => option.value === value);
  if (match) {
    return { sort: match.sort, direction: match.direction };
  }

  const [sort, direction] = value.split(':');
  if (isProductSortField(sort) && isSortDirection(direction)) {
    return { sort, direction };
  }

  return { sort: DEFAULT_PRODUCT_SORT.sort, direction: DEFAULT_PRODUCT_SORT.direction };
}
