import {
  useSavePaymentCoupon,
  useGetPaymentCoupon,
} from '@/generated/settings-controller/settings-controller';
import type { PaymentCoupon } from '@/generated/types/paymentCoupon';
import type { PaymentCouponRequest } from '@/generated/types/paymentCouponRequest';
import { queryKeys } from '@/shared/api/queryKeys';
import type { CouponRow } from '../types';

export function mapToCouponRow(item: PaymentCoupon): CouponRow {
  return {
    id: item.sysId ?? item.couponCd ?? '',
    sysId: item.sysId,
    couponCd: item.couponCd ?? '',
    couponNm: item.couponNm ?? '',
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
    useYn: item.useYn === 'Y' ? 'Y' : 'N',
  };
}

function mapToCouponPayload(row: CouponRow): PaymentCoupon {
  return {
    sysId: row.sysId,
    couponCd: row.couponCd,
    couponNm: row.couponNm,
    startDate: row.startDate,
    endDate: row.endDate,
    useYn: row.useYn,
  };
}

export function buildCouponRequest({
  newItems = [],
  updateItems = [],
  delItems = [],
}: Partial<PaymentCouponRequest>): PaymentCouponRequest {
  return {
    newItems,
    updateItems,
    delItems,
  };
}

export function useCouponQuery(searchKeyword = '') {
  return useGetPaymentCoupon(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.coupon.list(searchKeyword),
      },
    },
  );
}

export function useSaveCouponMutation() {
  const mutation = useSavePaymentCoupon();

  const mutateAsync = async (row: CouponRow, isCreateMode: boolean) => {
    const payload = mapToCouponPayload(row);
    const request = buildCouponRequest(
      isCreateMode
        ? { newItems: [payload] }
        : { updateItems: [payload] },
    );
    return mutation.mutateAsync({ data: request });
  };

  return {
    mutateAsync,
    isPending: mutation.isPending,
  };
}

export function useDeleteCouponsMutation() {
  const mutation = useSavePaymentCoupon();

  return {
    mutateAsync: async (rows: CouponRow[]) => {
      const request = buildCouponRequest({ delItems: rows.map(mapToCouponPayload) });
      return mutation.mutateAsync({ data: request });
    },
    isPending: mutation.isPending,
  };
}
