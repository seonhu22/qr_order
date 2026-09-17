import { describe, expect, it } from 'vitest';
import { mapToPaymentStatusDetail, mapToPaymentStatusMasterRow } from './paymentStatusApi';

describe('payment status response mapping', () => {
  it('maps master status codes', () => {
    expect(mapToPaymentStatusMasterRow({ orderStatus: '02' }).paymentStatus).toBe('PAID');
    expect(mapToPaymentStatusMasterRow({ orderStatus: '03' }).paymentStatus).toBe('UNPAID');
  });

  it('maps detail status codes', () => {
    expect(mapToPaymentStatusDetail([{ orderStatus: '04' }], '카드')?.paymentStatus).toBe('PAID');
    expect(mapToPaymentStatusDetail([{ orderStatus: '05' }], '-')?.paymentStatus).toBe('UNPAID');
  });
});
