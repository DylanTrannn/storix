'use client';

import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import {
  MAX_OPTION_DIMENSIONS,
  countVariantCombinations,
  extractOptionDimensions,
  formatVariantLabel,
  generateVariantMatrix,
  getVariantLabel,
  optionsKey,
} from '@/lib/product/variants';
import {
  defaultProductSku,
  formatPriceInput,
  parsePriceInput,
} from '@/lib/admin/product-price';
import { VariantRow, VariantTableHeader, type OptionDimensionDraft, type VariantDraft } from './variant-row';
import { AdminConfirmDialog } from '@/components/admin/confirm-dialog';

export type { OptionDimensionDraft };

export interface VariantMatrixEditorHandle {
  flushPendingEdits: () => {
    variants: VariantDraft[];
    optionDimensions: OptionDimensionDraft[];
  };
}

type DeleteConfirmState =
  | { type: 'dimension'; index: number; name: string }
  | { type: 'value'; dimensionIndex: number; value: string }
  | null;

interface VariantMatrixEditorProps {
  productSlug: string;
  variants: VariantDraft[];
  optionDimensions: OptionDimensionDraft[];
  onVariantsChange: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  onOptionDimensionsChange: (dimensions: OptionDimensionDraft[]) => void;
  mediaOptionName?: string | null;
  onMediaOptionNameChange?: (name: string | null) => void;
}

const DEFAULT_OPTION_NAMES = ['Size', 'Color'] as const;

function defaultVariantDraft(slug: string, options: Record<string, string> = {}): VariantDraft {
  const suffix = Object.values(options)
    .filter(Boolean)
    .join('-')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-');
  return {
    options,
    sku: suffix ? `${slug}-${suffix}`.toUpperCase() : defaultProductSku(slug),
    priceInput: '',
    compareAtPriceInput: '',
    inventory: 0,
    imageUrl: null,
  };
}

function normalizeVariantOptions(
  options: Record<string, string>,
  optionDimensions: OptionDimensionDraft[],
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const dimension of optionDimensions) {
    const dimensionName = dimension.name.trim();
    const matchedKey = Object.keys(options).find(
      (key) => key.trim().toLowerCase() === dimensionName.toLowerCase(),
    );
    if (!matchedKey) continue;

    const value = options[matchedKey]?.trim();
    if (value && dimension.values.includes(value)) {
      normalized[dimensionName] = value;
    }
  }

  return normalized;
}

function mergeVariantsWithMatrix(
  existing: VariantDraft[],
  combinations: Record<string, string>[],
  slug: string,
  optionDimensions: OptionDimensionDraft[],
): VariantDraft[] {
  const byKey = new Map(
    existing.map((variant) => [
      optionsKey(normalizeVariantOptions(variant.options ?? {}, optionDimensions)),
      variant,
    ]),
  );
  const dimensionNames = optionDimensions.map((d) => d.name.trim()).filter(Boolean);

  return combinations.map((options) => {
    const key = optionsKey(options);
    const prev = byKey.get(key);
    if (prev) {
      return {
        ...prev,
        options,
        sku:
          prev.sku ||
          buildSku(slug, options, dimensionNames),
      };
    }
    return defaultVariantDraft(slug, options);
  });
}

function buildSku(
  slug: string,
  options: Record<string, string>,
  dimensionNames: string[],
): string {
  const suffix = formatVariantLabel(options, dimensionNames)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return suffix ? `${slug}-${suffix}`.toUpperCase() : defaultProductSku(slug);
}

function syncVariantsFromDimensions(
  existing: VariantDraft[],
  optionDimensions: OptionDimensionDraft[],
  slug: string,
): VariantDraft[] {
  const validDims = optionDimensions
    .map((dimension) => ({
      name: dimension.name.trim(),
      values: dimension.values.map((value) => value.trim()).filter(Boolean),
    }))
    .filter((dimension) => dimension.name && dimension.values.length > 0);

  if (validDims.length === 0) {
    const hasOptionVariants = existing.some((variant) =>
      Object.entries(variant.options ?? {}).some(
        ([name, value]) => name.trim() && value.trim(),
      ),
    );
    if (hasOptionVariants) {
      return existing;
    }
    if (existing.length === 1 && Object.keys(existing[0]?.options ?? {}).length === 0) {
      return existing;
    }
    const fallback = existing[0] ?? defaultVariantDraft(slug);
    return [{ ...fallback, options: {} }];
  }

  const combinations = generateVariantMatrix(validDims);
  return mergeVariantsWithMatrix(existing, combinations, slug, validDims);
}

export function resolveOptionDimensionsForSave(
  optionDimensions: OptionDimensionDraft[],
  variants: VariantDraft[],
): OptionDimensionDraft[] {
  const normalized = optionDimensions
    .map((dimension) => ({
      name: dimension.name.trim(),
      values: [
        ...new Set(
          dimension.values.map((value) => value.trim()).filter(Boolean),
        ),
      ],
    }))
    .filter((dimension) => dimension.name && dimension.values.length > 0);

  if (normalized.length > 0) {
    return normalized;
  }

  return buildOptionDimensionsFromVariants(variants).map((dimension) => ({
    name: dimension.name.trim(),
    values: dimension.values,
  }));
}

export function ensureVariantsForSave(
  variants: VariantDraft[],
  optionDimensions: OptionDimensionDraft[],
  slug: string,
): VariantDraft[] {
  const resolvedDimensions = resolveOptionDimensionsForSave(optionDimensions, variants);
  return syncVariantsFromDimensions(variants, resolvedDimensions, slug);
}

export function buildOptionDimensionsFromVariants(
  variants: VariantDraft[],
): OptionDimensionDraft[] {
  return extractOptionDimensions(variants).map((d) => ({
    name: d.name,
    values: [...d.values],
  }));
}

export function buildVariantsFromProduct(
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    inventory: number;
    options: Record<string, string>;
    imageUrl?: string | null;
  }>,
  slug: string,
): { variants: VariantDraft[]; optionDimensions: OptionDimensionDraft[] } {
  if (variants.length === 0) {
    return {
      variants: [defaultVariantDraft(slug)],
      optionDimensions: [],
    };
  }

  const drafts = variants.map((v) => ({
    id: v.id,
    options: v.options ?? {},
    sku: v.sku,
    priceInput: formatPriceInput(v.price),
    compareAtPriceInput: v.compareAtPrice ? formatPriceInput(v.compareAtPrice) : '',
    inventory: v.inventory,
    imageUrl: v.imageUrl,
  }));

  const optionDimensions = buildOptionDimensionsFromVariants(drafts);

  return {
    variants: ensureVariantsForSave(drafts, optionDimensions, slug),
    optionDimensions,
  };
}

export const VariantMatrixEditor = memo(forwardRef<VariantMatrixEditorHandle, VariantMatrixEditorProps>(
  function VariantMatrixEditor(
  {
  productSlug,
  variants,
  optionDimensions,
  onVariantsChange,
  onOptionDimensionsChange,
  mediaOptionName,
  onMediaOptionNameChange,
}: VariantMatrixEditorProps,
  ref,
) {
  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);

  const validDimensions = useMemo(
    () => optionDimensions.filter((d) => d.name.trim() && d.values.length > 0),
    [optionDimensions],
  );

  const combinationCount = useMemo(
    () => countVariantCombinations(validDimensions),
    [validDimensions],
  );

  const combinationPreview = useMemo(() => {
    if (validDimensions.length === 0) return null;
    const parts = validDimensions.map((d) => `${d.values.length} ${d.name}`);
    return parts.join(' × ');
  }, [validDimensions]);

  function ensureValidMediaOption(dims: OptionDimensionDraft[]) {
    if (!mediaOptionName || !onMediaOptionNameChange) return;
    const valid = dims.filter((d) => d.name.trim() && d.values.length > 0);
    if (!valid.some((d) => d.name.trim() === mediaOptionName)) {
      onMediaOptionNameChange(null);
    }
  }

  function applyDimensionSync(nextDims: OptionDimensionDraft[], syncVariants: VariantDraft[]) {
    onOptionDimensionsChange(nextDims);
    onVariantsChange(syncVariantsFromDimensions(syncVariants, nextDims, productSlug));
    ensureValidMediaOption(nextDims);
  }

  const handleFieldChange = useCallback(
    (index: number, field: keyof VariantDraft, value: VariantDraft[keyof VariantDraft]) => {
      onVariantsChange((prev) =>
        prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)),
      );
    },
    [onVariantsChange],
  );

  const flushPendingEdits = useCallback(() => {
    let nextDims = optionDimensions.map((dimension) => ({
      name: dimension.name.trim(),
      values: [...dimension.values],
    }));

    for (const [indexStr, raw] of Object.entries(valueInputs)) {
      const index = Number(indexStr);
      const value = raw.trim();
      if (!value) continue;
      const dimension = nextDims[index];
      if (!dimension || dimension.values.includes(value)) continue;
      nextDims = nextDims.map((dim, dimIndex) =>
        dimIndex === index ? { ...dim, values: [...dim.values, value] } : dim,
      );
    }

    const syncedVariants = syncVariantsFromDimensions(variants, nextDims, productSlug);
    onOptionDimensionsChange(nextDims);
    onVariantsChange(syncedVariants);
    setValueInputs({});
    if (mediaOptionName && onMediaOptionNameChange) {
      const valid = nextDims.filter((d) => d.name.trim() && d.values.length > 0);
      if (!valid.some((d) => d.name.trim() === mediaOptionName)) {
        onMediaOptionNameChange(null);
      }
    }
    return { variants: syncedVariants, optionDimensions: nextDims };
  }, [
    optionDimensions,
    valueInputs,
    variants,
    productSlug,
    onOptionDimensionsChange,
    onVariantsChange,
    mediaOptionName,
    onMediaOptionNameChange,
  ]);

  useImperativeHandle(ref, () => ({ flushPendingEdits }), [flushPendingEdits]);

  function updateDimensionName(index: number, name: string) {
    onOptionDimensionsChange(
      optionDimensions.map((dim, i) => (i === index ? { ...dim, name } : dim)),
    );
  }

  function commitDimensionName() {
    applyDimensionSync(optionDimensions, variants);
  }

  function addDimension() {
    if (optionDimensions.length >= MAX_OPTION_DIMENSIONS) return;
    const defaultName = DEFAULT_OPTION_NAMES[optionDimensions.length] ?? 'Tùy chọn';
    applyDimensionSync(
      [...optionDimensions, { name: defaultName, values: [] }],
      variants,
    );
  }

  function removeDimension(index: number) {
    const dim = optionDimensions[index];
    setDeleteConfirm({
      type: 'dimension',
      index,
      name: dim?.name.trim() || 'Tùy chọn',
    });
  }

  function confirmRemoveDimension(index: number) {
    const nextDims = optionDimensions.filter((_, i) => i !== index);
    applyDimensionSync(nextDims, variants);
  }

  function addValue(dimensionIndex: number) {
    const raw = valueInputs[dimensionIndex]?.trim();
    if (!raw) return;
    const dim = optionDimensions[dimensionIndex];
    if (!dim || dim.values.includes(raw)) return;

    const nextDims = optionDimensions.map((d, i) =>
      i === dimensionIndex ? { ...d, values: [...d.values, raw] } : d,
    );
    setValueInputs((prev) => ({ ...prev, [dimensionIndex]: '' }));
    applyDimensionSync(nextDims, variants);
  }

  function removeValue(dimensionIndex: number, value: string) {
    setDeleteConfirm({ type: 'value', dimensionIndex, value });
  }

  function confirmRemoveValue(dimensionIndex: number, value: string) {
    const nextDims = optionDimensions.map((d, i) =>
      i === dimensionIndex ? { ...d, values: d.values.filter((v) => v !== value) } : d,
    );
    applyDimensionSync(nextDims, variants);
  }

  function applyPriceToAll(priceInput: string) {
    onVariantsChange((prev) => prev.map((v) => ({ ...v, priceInput })));
  }

  function applyInventoryToAll(inventory: number) {
    onVariantsChange((prev) => prev.map((v) => ({ ...v, inventory })));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Tùy chọn sản phẩm</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Mỗi nhóm là một loại tùy chọn riêng (ví dụ: <strong>Size</strong> và{' '}
              <strong>Color</strong>). Hệ thống tự tạo mọi tổ hợp — Size S/M/L và Color
              Black/White sẽ tạo 6 biến thể (Black / S, Black / M, …).
            </p>
          </div>
          {optionDimensions.length < MAX_OPTION_DIMENSIONS && (
            <Button type="button" variant="outline" size="sm" onClick={addDimension}>
              <Plus className="mr-1 h-4 w-4" />
              Thêm nhóm tùy chọn
            </Button>
          )}
        </div>

        {optionDimensions.length === 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Chưa có tùy chọn — sản phẩm có một biến thể mặc định.
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={addDimension}>
              Thêm Size hoặc Color
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {optionDimensions.map((dim, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-[140px_1fr]">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tên nhóm</Label>
                      <Input
                        value={dim.name}
                        onChange={(e) => updateDimensionName(index, e.target.value)}
                        onBlur={commitDimensionName}
                        placeholder={DEFAULT_OPTION_NAMES[index] ?? 'Tùy chọn'}
                        className="h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Giá trị
                        <span className="ml-1 font-normal text-muted-foreground">
                          (Enter để thêm)
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={valueInputs[index] ?? ''}
                          onChange={(e) =>
                            setValueInputs((prev) => ({ ...prev, [index]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addValue(index);
                            }
                          }}
                          placeholder={
                            dim.name.toLowerCase().includes('size') ||
                            dim.name.toLowerCase().includes('kích')
                              ? 'S, M, L, XL…'
                              : 'Black, White, Navy…'
                          }
                          className="h-9 bg-background"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => addValue(index)}
                        >
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDimension(index)}
                    aria-label="Xóa nhóm tùy chọn"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {dim.values.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dim.values.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-sm"
                      >
                        {value}
                        <button
                          type="button"
                          className="rounded-sm text-muted-foreground hover:text-destructive"
                          onClick={() => removeValue(index, value)}
                          aria-label={`Xóa ${value}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {combinationPreview && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{combinationPreview}</span>
                {' → '}
                <span className="font-medium text-foreground">{combinationCount} biến thể</span>
              </p>
            )}
          </div>
        )}
      </div>

      {validDimensions.length > 0 && onMediaOptionNameChange && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">Ảnh theo tùy chọn</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Chọn Color nếu ảnh chỉ thay đổi theo màu (mọi size dùng chung). Chọn Không nếu chỉ dùng
            thư viện ảnh chung.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="media-option"
                checked={!mediaOptionName}
                onChange={() => onMediaOptionNameChange(null)}
                className="h-4 w-4 border-border text-primary focus:ring-primary"
              />
              Không
            </label>
            {validDimensions.map((dim) => (
              <label key={dim.name} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="media-option"
                  checked={mediaOptionName === dim.name.trim()}
                  onChange={() => onMediaOptionNameChange(dim.name.trim())}
                  className="h-4 w-4 border-border text-primary focus:ring-primary"
                />
                {dim.name.trim()}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Biến thể
            <span className="ml-1.5 font-normal text-muted-foreground">({variants.length})</span>
          </h3>
          {variants.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const sample = variants.find((v) => v.priceInput.trim());
                  if (sample) applyPriceToAll(sample.priceInput);
                }}
              >
                Áp dụng giá cho tất cả
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const sample = variants[0];
                  if (sample) applyInventoryToAll(sample.inventory);
                }}
              >
                Áp dụng tồn kho cho tất cả
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px]">
            <VariantTableHeader optionDimensions={validDimensions} />
            <tbody>
              {variants.map((variant, index) => (
                <VariantRow
                  key={variant.id ?? optionsKey(variant.options) + index}
                  rowIndex={index}
                  variant={variant}
                  optionDimensions={validDimensions}
                  onFieldChange={handleFieldChange}
                />
              ))}
            </tbody>
          </table>
        </div>

        {variants.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Thêm giá trị tùy chọn để tạo biến thể.
          </p>
        )}
      </div>

      <AdminConfirmDialog
        open={deleteConfirm?.type === 'dimension'}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="Xóa nhóm tùy chọn?"
        description={
          deleteConfirm?.type === 'dimension'
            ? `Nhóm "${deleteConfirm.name}" và các biến thể liên quan sẽ bị xóa. Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa nhóm"
        onConfirm={() => {
          if (deleteConfirm?.type === 'dimension') {
            confirmRemoveDimension(deleteConfirm.index);
          }
        }}
      />

      <AdminConfirmDialog
        open={deleteConfirm?.type === 'value'}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="Xóa giá trị tùy chọn?"
        description={
          deleteConfirm?.type === 'value'
            ? `Giá trị "${deleteConfirm.value}" và các biến thể liên quan sẽ bị xóa. Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa giá trị"
        onConfirm={() => {
          if (deleteConfirm?.type === 'value') {
            confirmRemoveValue(deleteConfirm.dimensionIndex, deleteConfirm.value);
          }
        }}
      />
    </div>
  );
}));

export function parseVariantDrafts(
  variants: VariantDraft[],
  slug: string,
  optionDimensions: OptionDimensionDraft[] = [],
): Array<{
  id?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
  imageUrl?: string | null;
}> {
  const dimensionNames = optionDimensions.map((d) => d.name.trim()).filter(Boolean);

  return variants.map((variant) => {
    const price = parsePriceInput(variant.priceInput);
    const label = formatVariantLabel(variant.options, dimensionNames) || 'Mặc định';
    if (price === null) {
      throw new Error(`Nhập giá hợp lệ cho biến thể "${label}".`);
    }
    const compareRaw = variant.compareAtPriceInput?.trim();
    const compareAtPrice = compareRaw ? parsePriceInput(compareRaw) : undefined;
    if (compareRaw && compareAtPrice === null) {
      throw new Error(`Nhập giá gốc hợp lệ cho biến thể "${label}".`);
    }
    return {
      id: variant.id,
      sku: buildSku(slug, variant.options, dimensionNames),
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      inventory: variant.inventory,
      options: variant.options,
      imageUrl: variant.imageUrl,
    };
  });
}
