import { useGetPlantStatus } from '@/generated/settings-controller/settings-controller';
import type { PlantStatusResponse } from '@/generated/types/plantStatusResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { PlantStatusRow } from '../types';

function deriveLicenseMonths(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const diff = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );
  return diff > 0 ? diff : null;
}

function deriveStatus(estimateCheckoutDate?: string): PlantStatusRow['status'] {
  if (!estimateCheckoutDate) return 'expired';
  const diffDays =
    (new Date(estimateCheckoutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'active';
}

export function mapToPlantStatusRow(res: PlantStatusResponse): PlantStatusRow {
  return {
    id: res.sysId ?? res.plantCd ?? '',
    plantCode: res.plantCd ?? '-',
    paymentCode: res.paymentCd ?? '-',
    paymentName: res.paymentNm ?? '-',
    licenseValidMonth: deriveLicenseMonths(res.lastCheckoutDate, res.estimateCheckoutDate),
    lastCheckoutDate: res.lastCheckoutDate ?? '-',
    estimateCheckoutDate: res.estimateCheckoutDate ?? '-',
    status: deriveStatus(res.estimateCheckoutDate),
  };
}

export function usePlantStatusQuery(searchKeyword = '', enabled = true) {
  return useGetPlantStatus(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.plantStatus.list(searchKeyword),
        enabled,
        ...queryPolicies.searchResult,
      },
    },
  );
}
