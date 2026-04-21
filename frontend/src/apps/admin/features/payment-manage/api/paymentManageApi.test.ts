import { describe, expect, it } from 'vitest';
import { mapToPaymentRateRow } from './paymentManageApi';
import { editorRowToPaymentRateRow } from '../hooks/usePaymentManageModalFlow';

describe('paymentManageApi', () => {
  it('maps payment response into page row', () => {
    expect(
      mapToPaymentRateRow({
        sysId: 'pay-1',
        plantCd: 'ADMIN',
        paymentCd: 'BASIC_M1',
        paymentNm: '베이직 플랜',
        paymentFee: 9900,
        paymentFeeUnit: '원',
        licenseValidMonth: 1,
      }),
    ).toEqual({
      id: 'pay-1',
      sysId: 'pay-1',
      plantCd: 'ADMIN',
      rateCode: 'BASIC_M1',
      rateName: '베이직 플랜',
      rateAmount: 9900,
      rateUnit: '원',
      licenseValidMonth: 1,
    });
  });

  it('keeps plantCd when editor row is converted back to payload row', () => {
    expect(
      editorRowToPaymentRateRow({
        id: 'pay-1',
        sysId: 'pay-1',
        plantCd: 'ADMIN',
        rateCode: 'BASIC_M1',
        rateName: '베이직 플랜',
        rateAmount: '9900',
        rateUnit: '원',
        licenseValidMonth: '1',
      }),
    ).toEqual({
      id: 'pay-1',
      sysId: 'pay-1',
      plantCd: 'ADMIN',
      rateCode: 'BASIC_M1',
      rateName: '베이직 플랜',
      rateAmount: 9900,
      rateUnit: '원',
      licenseValidMonth: 1,
    });
  });
});
