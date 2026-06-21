import { z } from 'zod';
import { BANK_BINS } from '../constants.js';

export const BankCodeSchema = z.enum(
  Object.keys(BANK_BINS) as [keyof typeof BANK_BINS, ...(keyof typeof BANK_BINS)[]],
);

export const OrderPaymentInstructionsSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.number().int().positive(),
  transferReference: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  bankName: z.string(),
  bankBin: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
  qrDataUrl: z.string().nullable(),
  qrAvailable: z.boolean(),
  bankConfigured: z.boolean(),
  paymentStatus: z.string(),
  paymentMethod: z.string(),
  payPageUrl: z.string(),
  deadlineHours: z.number().int().positive(),
});

export type OrderPaymentInstructions = z.infer<typeof OrderPaymentInstructionsSchema>;
