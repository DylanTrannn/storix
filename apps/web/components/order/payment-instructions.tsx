'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Building2, QrCode, Smartphone } from 'lucide-react';
import type { OrderPaymentInstructions } from '@storix/shared';
import { formatPaymentAmount } from '@/lib/utils';
import { CopyButton } from '@/components/order/copy-button';
import { MarkPaidButton } from '@/components/order/mark-paid-button';

interface PaymentInstructionsProps {
  instructions: OrderPaymentInstructions;
  variant: 'desktop' | 'mobile';
}

function PaymentDetailRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium break-all">{value}</p>
      </div>
      <CopyButton value={copyValue ?? value} label="Sao chép" />
    </div>
  );
}

const STATUS_LABELS: Record<string, { title: string; desc: string; badge: string; badgeClass: string }> = {
  pending: {
    title: 'Hoàn tất thanh toán',
    desc: 'Quét mã QR hoặc chuyển khoản thủ công theo thông tin bên dưới.',
    badge: 'Chờ thanh toán',
    badgeClass: 'bg-amber-100 text-amber-900',
  },
  awaiting_review: {
    title: 'Đang xác minh thanh toán',
    desc: 'Chúng tôi đã nhận xác nhận của bạn và sẽ kiểm tra giao dịch trong thời gian sớm nhất.',
    badge: 'Đang kiểm tra',
    badgeClass: 'bg-blue-100 text-blue-900',
  },
  confirmed: {
    title: 'Thanh toán đã xác nhận',
    desc: 'Cảm ơn bạn! Đơn hàng sẽ được xử lý và giao trong thời gian sớm nhất.',
    badge: 'Đã thanh toán',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
};

export function PaymentInstructions({ instructions, variant }: PaymentInstructionsProps) {
  const {
    orderNumber,
    transferReference,
    amount,
    currency,
    bankName,
    accountNumber,
    accountHolder,
    qrDataUrl,
    qrAvailable,
    bankConfigured,
    paymentStatus,
    payPageUrl,
    deadlineHours,
    orderId,
  } = instructions;

  const formattedAmount = formatPaymentAmount(amount, currency);
  const canMarkPaid = paymentStatus === 'pending';
  const status = STATUS_LABELS[paymentStatus] ?? STATUS_LABELS.pending;

  const copyAllText = [
    `Số tiền: ${formattedAmount}`,
    `Nội dung CK: ${transferReference}`,
    `Ngân hàng: ${bankName}`,
    `Số TK: ${accountNumber}`,
    `Chủ TK: ${accountHolder}`,
  ].join('\n');

  if (variant === 'desktop') {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Thanh toán trên điện thoại</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quét mã QR bên dưới để mở trang thanh toán trên điện thoại, sau đó hoàn tất chuyển
              khoản trong {deadlineHours} giờ.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <QRCodeSVG value={payPageUrl} size={180} level="M" />
            <p className="mt-2 text-center text-xs text-muted-foreground">Quét bằng điện thoại</p>
          </div>

          <div className="flex-1 space-y-3">
            <PaymentDetailRow
              label="Số tiền cần chuyển"
              value={formattedAmount}
              copyValue={String(amount)}
            />
            <PaymentDetailRow label="Nội dung chuyển khoản" value={transferReference} />
            <CopyButton value={copyAllText} label="Sao chép tất cả" className="w-full sm:w-auto" />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Đơn hàng #{orderNumber} · Sau khi chuyển khoản, xác nhận trên trang thanh toán điện thoại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Đơn hàng #{orderNumber}</p>
            <h2 className="mt-1 text-xl font-semibold">{status.title}</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
            {status.badge}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{status.desc}</p>
        {paymentStatus === 'pending' && (
          <p className="mt-2 text-sm font-medium text-foreground">
            Chuyển đúng <span className="text-primary">{formattedAmount}</span> trong vòng{' '}
            {deadlineHours} giờ để giữ đơn hàng.
          </p>
        )}
      </div>

      {(paymentStatus === 'pending') && (
        <>
          {/* QR Section */}
          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="size-5 text-primary" />
              <h3 className="font-semibold">Bước 1 — Quét mã VietQR</h3>
            </div>

            {qrAvailable && qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="rounded-xl border-2 border-stone-200 bg-white p-4 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Mã VietQR thanh toán"
                    width={280}
                    height={280}
                    className="size-[min(280px,80vw)] object-contain"
                  />
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  Mở app ngân hàng → Quét mã QR → Kiểm tra số tiền &amp; nội dung → Xác nhận
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-medium">Không thể tạo mã QR tự động</p>
                <p className="mt-1 text-amber-900">
                  {!bankConfigured
                    ? 'Cửa hàng chưa cấu hình số tài khoản ngân hàng hợp lệ. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.'
                    : 'Vui lòng chuyển khoản thủ công theo thông tin bên dưới.'}
                </p>
              </div>
            )}
          </div>

          {/* Bank details */}
          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h3 className="font-semibold">
                Bước 2 — {qrAvailable ? 'Kiểm tra' : 'Nhập'} thông tin chuyển khoản
              </h3>
            </div>

            <div className="divide-y rounded-lg border bg-stone-50/50 px-4">
              <PaymentDetailRow
                label="Số tiền"
                value={formattedAmount}
                copyValue={String(amount)}
              />
              <PaymentDetailRow
                label="Nội dung chuyển khoản"
                value={transferReference}
              />
              <PaymentDetailRow label="Ngân hàng" value={bankName} />
              <PaymentDetailRow label="Số tài khoản" value={accountNumber || '—'} />
              <PaymentDetailRow label="Chủ tài khoản" value={accountHolder || '—'} />
            </div>

            <div className="mt-4">
              <CopyButton value={copyAllText} label="Sao chép tất cả thông tin" className="w-full" />
            </div>
          </div>

          {/* Confirm */}
          {canMarkPaid && (
            <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="mb-4 font-semibold">Bước 3 — Xác nhận đã chuyển khoản</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Sau khi chuyển khoản thành công, nhấn nút bên dưới để chúng tôi kiểm tra giao dịch.
              </p>
              <MarkPaidButton orderId={orderId} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
