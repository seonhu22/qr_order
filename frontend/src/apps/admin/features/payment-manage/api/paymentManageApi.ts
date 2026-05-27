import {
  useDelPayment,
  useGetPayment,
  useNewPayment,
  useUpdatePayment,
} from '@/generated/settings-controller/settings-controller';
import type { Payment } from '@/generated/types/payment';
import type { PaymentResponse } from '@/generated/types/paymentResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import type { PaymentRateRow } from '../types';

export function mapToPaymentRateRow(res: PaymentResponse): PaymentRateRow {
  return {
    id: res.sysId ?? res.paymentCd ?? '',
    sysId: res.sysId,
    rateCode: res.paymentCd ?? '',
    rateName: res.paymentNm ?? '',
    rateAmount: res.paymentFee ?? 0,
    rateUnit: res.paymentFeeUnit ?? '',
    licenseValidMonth: res.licenseValidMonth ?? 0,
  };
}

function mapToPaymentPayload(row: PaymentRateRow): Payment {
  return {
    sysId: row.sysId,
    paymentCd: row.rateCode,
    paymentNm: row.rateName,
    paymentFee: row.rateAmount,
    paymentFeeUnit: row.rateUnit,
    licenseValidMonth: row.licenseValidMonth,
  };
}

export function usePaymentRatesQuery(searchKeyword = '') {
  return useGetPayment(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.payment.list(searchKeyword),
      },
    },
  );
}

export function useSavePaymentRateMutation() {
  const createMutation = useNewPayment();
  const updateMutation = useUpdatePayment();

  const mutateAsync = async (row: PaymentRateRow, isCreateMode: boolean) => {
    const payload = mapToPaymentPayload(row);
    if (isCreateMode) {
      return createMutation.mutateAsync({ data: payload });
    }
    return updateMutation.mutateAsync({ data: payload });
  };

  return {
    mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending,
  };
}

export function useDeletePaymentRatesMutation() {
  const mutation = useDelPayment();
  return {
    mutateAsync: async (rows: PaymentRateRow[]) =>
      mutation.mutateAsync({ data: rows.map(mapToPaymentPayload) }),
    isPending: mutation.isPending,
  };
}
