import type { ProductStatus } from '@storix/shared';

const PREVIEW_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft preview — this product is not published yet.',
  archived: 'Archived preview — this product is no longer published.',
  active: 'Preview',
};

export function ProductPreviewBanner({ status }: { status: ProductStatus }) {
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
    >
      {PREVIEW_LABELS[status]}
      <span className="ml-1 text-amber-800">Only admins can see this page.</span>
    </div>
  );
}
