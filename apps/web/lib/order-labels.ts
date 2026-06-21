export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ thanh toán',
  awaiting_review: 'Đang kiểm tra',
  confirmed: 'Đã thanh toán',
  rejected: 'Thanh toán bị từ chối',
  not_required: 'COD',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản',
};

export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PAYMENT_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  awaiting_review: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  not_required: 'bg-stone-100 text-stone-600',
};
