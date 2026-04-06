import {
  useDelCommonMaster,
  useNewCommonMaster,
  useSaveCommonDetail,
  useSearchCommon,
  useSearchCommonDetail,
  useUpdateCommonMaster,
} from '@/generated/settings-controller/settings-controller';
import type { CommonDetail } from '@/generated/types/commonDetail';
import type { CommonDetailRequest } from '@/generated/types/commonDetailRequest';
import type { CommonMaster } from '@/generated/types/commonMaster';
import { queryKeys } from '@/shared/api/queryKeys';
import type { DetailCode, MasterCode } from '../types';

export function mapCommonMasterToRow(master: CommonMaster): MasterCode {
  return {
    id: master.sysId ?? master.commonCd,
    sysId: master.sysId,
    code: master.commonCd,
    name: master.commonNm,
    useYn: master.useYn === 'N' ? 'N' : 'Y',
  };
}

export function mapCommonDetailToRow(detail: CommonDetail): DetailCode {
  return {
    id: detail.sysId ?? `detail-${detail.linkSysId}-${detail.commonCd ?? detail.commonNm}`,
    sysId: detail.sysId,
    linkSysId: detail.linkSysId,
    code: detail.commonCd ?? '',
    name: detail.commonNm,
    useYn: detail.useYn === 'Y',
    ordNo: detail.ordNo,
    checked: false,
    isNew: false,
  };
}

export function toCommonMasterPayload(master: MasterCode): CommonMaster {
  return {
    sysId: master.sysId,
    commonCd: master.code,
    commonNm: master.name,
    useYn: master.useYn,
  };
}

function toCommonDetailPayload(detail: DetailCode): CommonDetail {
  return {
    sysId: detail.sysId,
    linkSysId: detail.linkSysId,
    commonCd: detail.code,
    commonNm: detail.name,
    ordNo: detail.ordNo,
    useYn: detail.useYn ? 'Y' : 'N',
  };
}

function isSameDetail(a: DetailCode, b: DetailCode) {
  return (
    a.linkSysId === b.linkSysId &&
    a.code === b.code &&
    a.name === b.name &&
    a.useYn === b.useYn &&
    a.ordNo === b.ordNo
  );
}

export function buildCommonDetailRequest(
  linkSysId: string,
  currentRows: DetailCode[],
  originalRows: DetailCode[],
): CommonDetailRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(toCommonDetailPayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameDetail(row, originalRow) : false;
    })
    .map(toCommonDetailPayload);
  const deleteItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(toCommonDetailPayload);

  return {
    linkSysId,
    newItems: newItems.length ? newItems : undefined,
    updateItems: updateItems.length ? updateItems : undefined,
    deleteItems: deleteItems.length ? deleteItems : undefined,
  };
}

export function hasCommonDetailChanges(request: CommonDetailRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.deleteItems?.length,
  );
}

export function useCommonCodeMastersQuery(searchKeyword = '') {
  return useSearchCommon(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.commonCode.masters(searchKeyword),
      },
    },
  );
}

export function useCommonCodeDetailsQuery(masterId: string, searchKeyword = '') {
  return useSearchCommonDetail(
    masterId,
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.commonCode.details(masterId, searchKeyword),
        enabled: Boolean(masterId),
      },
    },
  );
}

export function useSaveCommonMasterMutation() {
  const createMutation = useNewCommonMaster();
  const updateMutation = useUpdateCommonMaster();

  const mutateAsync = async (master: MasterCode, isCreateMode: boolean) => {
    const payload = toCommonMasterPayload(master);

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

export function useDeleteCommonMastersMutation() {
  const mutation = useDelCommonMaster();

  return {
    mutateAsync: async (masters: MasterCode[]) =>
      mutation.mutateAsync({ data: masters.map(toCommonMasterPayload) }),
    isPending: mutation.isPending,
  };
}

export function useSaveCommonDetailsMutation() {
  const mutation = useSaveCommonDetail();

  return {
    mutateAsync: async (request: CommonDetailRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
