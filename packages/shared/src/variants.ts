export const MAX_OPTION_DIMENSIONS = 2;

export interface VariantOptionDimension {
  name: string;
  values: string[];
}

export interface VariantLike {
  id?: string;
  options: Record<string, string>;
  inventory: number;
  imageUrl?: string | null;
}

export interface ProductImageLike {
  url: string;
  linkedOptions?: Record<string, string> | null;
  alt?: string | null;
}

export function isGeneralImage(img: ProductImageLike): boolean {
  if (!img.linkedOptions) return true;
  return Object.keys(img.linkedOptions).length === 0;
}

export function imageMatchesMediaSelection(
  img: ProductImageLike,
  mediaOptionName: string | null | undefined,
  selection: Record<string, string>,
): boolean {
  if (!mediaOptionName || isGeneralImage(img)) return false;
  const selectedValue = selection[mediaOptionName];
  if (!selectedValue) return false;
  return img.linkedOptions?.[mediaOptionName] === selectedValue;
}

export function buildStorefrontGallery(
  images: ProductImageLike[],
  _mediaOptionName?: string | null,
): ProductImageLike[] {
  const general: ProductImageLike[] = [];
  const tagged: ProductImageLike[] = [];

  for (const image of images) {
    if (isGeneralImage(image)) {
      general.push(image);
    } else {
      tagged.push(image);
    }
  }

  return [...general, ...tagged];
}

export function resolveScrollImageUrl(
  images: ProductImageLike[],
  selection: Record<string, string>,
  mediaOptionName?: string | null,
): string | null {
  if (!mediaOptionName) return null;
  const match = images.find((img) => imageMatchesMediaSelection(img, mediaOptionName, selection));
  return match?.url ?? null;
}

export function resolveVariantDisplayImage(
  variant: VariantLike | null | undefined,
  images: ProductImageLike[],
  _variants: VariantLike[],
  mediaOptionName?: string | null,
): string | null {
  if (mediaOptionName && variant?.options) {
    const mediaValue = variant.options[mediaOptionName];
    if (mediaValue) {
      const tagged = images.find((img) => img.linkedOptions?.[mediaOptionName] === mediaValue);
      if (tagged) return tagged.url;
    }
  }

  if (variant?.imageUrl) return variant.imageUrl;

  const general = images.filter(isGeneralImage);
  if (general[0]) return general[0].url;

  return images[0]?.url ?? null;
}

export function isVariantAvailable(variant: { inventory: number }): boolean {
  return variant.inventory > 0;
}

export function getVariantLabel(options: Record<string, string>): string {
  const values = Object.values(options);
  return values.length > 0 ? values.join(' / ') : 'Default';
}

export function formatVariantLabel(
  options: Record<string, string>,
  dimensionNames?: string[],
): string {
  if (dimensionNames?.length) {
    const parts = dimensionNames.map((name) => options[name]).filter(Boolean);
    if (parts.length > 0) return parts.join(' / ');
  }
  return getVariantLabel(options);
}

export function countVariantCombinations(
  optionDefs: VariantOptionDimension[],
): number {
  const defs = optionDefs.filter((def) => def.name.trim() && def.values.length > 0);
  if (defs.length === 0) return 1;
  return defs.reduce((total, def) => total * def.values.length, 1);
}

export function optionsKey(options: Record<string, string>): string {
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
}

export function extractOptionDimensions(
  variants: Array<{ options: Record<string, string> }>,
): VariantOptionDimension[] {
  const dimensionMap = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const [name, value] of Object.entries(variant.options ?? {})) {
      if (!name.trim() || !value.trim()) continue;
      if (!dimensionMap.has(name)) {
        dimensionMap.set(name, new Set());
      }
      dimensionMap.get(name)!.add(value);
    }
  }

  return Array.from(dimensionMap.entries())
    .slice(0, MAX_OPTION_DIMENSIONS)
    .map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
}

export function findVariantByOptions<T extends VariantLike>(
  variants: T[],
  selection: Record<string, string>,
): T | null {
  const entries = Object.entries(selection).filter(([, value]) => value.trim() !== '');
  if (entries.length === 0) return variants[0] ?? null;

  return (
    variants.find((variant) =>
      entries.every(([name, value]) => variant.options?.[name] === value),
    ) ?? null
  );
}

export function resolveVariantImage(
  variant: VariantLike | null | undefined,
  productImages: ProductImageLike[],
): string | null {
  if (variant?.imageUrl) return variant.imageUrl;
  return productImages[0]?.url ?? null;
}

export function buildProductGalleryImages(
  productImages: ProductImageLike[],
  variants: Array<{ imageUrl?: string | null }>,
): ProductImageLike[] {
  const seen = new Set<string>();
  const gallery: ProductImageLike[] = [];

  for (const image of productImages) {
    if (!seen.has(image.url)) {
      seen.add(image.url);
      gallery.push(image);
    }
  }

  for (const variant of variants) {
    if (variant.imageUrl && !seen.has(variant.imageUrl)) {
      seen.add(variant.imageUrl);
      gallery.push({ url: variant.imageUrl });
    }
  }

  return gallery;
}

export function findGalleryImageIndex(
  images: ProductImageLike[],
  imageUrl: string | null | undefined,
): number {
  if (!imageUrl) return -1;
  return images.findIndex((image) => image.url === imageUrl);
}

export function generateVariantMatrix(
  optionDefs: VariantOptionDimension[],
): Record<string, string>[] {
  const defs = optionDefs
    .filter((def) => def.name.trim() && def.values.length > 0)
    .slice(0, MAX_OPTION_DIMENSIONS);

  if (defs.length === 0) return [{}];

  function combine(index: number): Record<string, string>[] {
    if (index >= defs.length) return [{}];
    const rest = combine(index + 1);
    const def = defs[index]!;
    const dimensionName = def.name.trim();
    const result: Record<string, string>[] = [];
    for (const value of def.values) {
      for (const combo of rest) {
        result.push({ [dimensionName]: value, ...combo });
      }
    }
    return result;
  }

  return combine(0);
}

export function isOptionValueAvailable(
  variants: VariantLike[],
  selection: Record<string, string>,
  dimensionName: string,
  value: string,
): boolean {
  const candidate = { ...selection, [dimensionName]: value };
  const variant = findVariantByOptions(variants, candidate);
  return variant ? isVariantAvailable(variant) : false;
}

export function hasMultipleVariants(variants: Array<{ options: Record<string, string> }>): boolean {
  if (variants.length <= 1) return false;
  return extractOptionDimensions(variants).length > 0;
}
