import { Injectable } from '@nestjs/common';
import { generateQRImage, generateVietQR } from 'vietqr-ts';
import { PaymentConfigService } from './payment-config.service';

@Injectable()
export class VietQrService {
  constructor(private readonly paymentConfig: PaymentConfigService) {}

  /** VietQR.io image URL fallback when local generation fails */
  private buildVietQrIoUrl(
    bankBin: string,
    accountNumber: string,
    amount: number,
    transferReference: string,
    accountHolder: string,
  ): string {
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: transferReference,
      accountName: accountHolder,
    });
    return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.jpg?${params.toString()}`;
  }

  async generateOrderQr(
    transferReference: string,
    amount: number,
  ): Promise<{ qrDataUrl: string | null; source: 'local' | 'vietqr_io' | 'static' | null }> {
    const config = this.paymentConfig.getConfig();

    if (!this.paymentConfig.isBankTransferConfigured()) {
      return { qrDataUrl: null, source: null };
    }

    try {
      const { rawData } = generateVietQR({
        bankBin: config.bankBin,
        accountNumber: config.accountNumber,
        serviceCode: 'QRIBFTTA',
        initiationMethod: '12',
        amount: String(amount),
        purpose: transferReference,
        currency: '704',
        country: 'VN',
      });

      const { dataURI } = await generateQRImage({
        data: rawData,
        format: 'png',
        size: 280,
        errorCorrectionLevel: 'M',
        margin: 2,
      });

      return { qrDataUrl: dataURI, source: 'local' };
    } catch {
      // Fallback: VietQR.io public image API
      const vietQrIoUrl = this.buildVietQrIoUrl(
        config.bankBin,
        config.accountNumber,
        amount,
        transferReference,
        config.accountHolder,
      );
      return { qrDataUrl: vietQrIoUrl, source: 'vietqr_io' };
    }
  }
}
