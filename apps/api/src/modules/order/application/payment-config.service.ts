import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BANK_BINS, type BankCode } from '@storix/shared';

export interface PaymentConfig {
  storeName: string;
  currency: string;
  bankName: string;
  bankBin: string;
  accountNumber: string;
  accountHolder: string;
  staticQrUrl: string | null;
  deadlineHours: number;
  appUrl: string;
}

@Injectable()
export class PaymentConfigService {
  constructor(private readonly config: ConfigService) {}

  getConfig(): PaymentConfig {
    const bankCode = (this.config.get<string>('BANK_CODE') ?? 'VCB') as BankCode;
    const bankBin = this.config.get<string>('BANK_BIN') ?? BANK_BINS[bankCode] ?? BANK_BINS.VCB;

    return {
      storeName: this.config.get<string>('STORE_NAME') ?? 'STORIX',
      currency: this.config.get<string>('STORE_CURRENCY') ?? 'VND',
      bankName: this.config.get<string>('BANK_NAME') ?? 'Vietcombank',
      bankBin,
      accountNumber: this.config.get<string>('BANK_ACCOUNT_NUMBER') ?? '',
      accountHolder: this.config.get<string>('BANK_ACCOUNT_HOLDER') ?? '',
      staticQrUrl: this.config.get<string>('BANK_STATIC_QR_URL') ?? null,
      deadlineHours: Number(this.config.get<string>('PAYMENT_TRANSFER_DEADLINE_HOURS') ?? '24'),
      appUrl: this.config.get<string>('APP_URL') ?? 'http://localhost:3000',
    };
  }

  isBankTransferConfigured(): boolean {
    const { accountNumber, bankBin } = this.getConfig();
    return Boolean(bankBin && this.isValidAccountNumber(accountNumber));
  }

  isValidAccountNumber(accountNumber: string): boolean {
    const trimmed = accountNumber.trim();
    if (!trimmed || trimmed.length < 6) return false;
    if (!/^\d+$/.test(trimmed)) return false;
    if (/^(your|xxx|test|000)/i.test(trimmed)) return false;
    return true;
  }

  /** Convert stored price to payment amount (whole VND or major currency units) */
  toPaymentAmount(storedAmount: number): number {
    const currency = this.getConfig().currency;
    if (currency === 'VND') {
      return storedAmount;
    }
    return Math.round(storedAmount / 100);
  }
}
