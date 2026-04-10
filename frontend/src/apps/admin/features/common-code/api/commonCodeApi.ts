/**
 * @fileoverview 공통코드 feature의 서버 연동 계층
 *
 * @description
 * - generated API를 화면에서 바로 쓰지 않고, feature 전용 변환 함수와 wrapper hook으로 감싼다.
 * - 서버 응답 DTO를 화면용 row 모델로 변환하고, 반대로 저장 payload도 여기서 만든다.
 * - 상세 저장 시에는 현재 draft와 최초 조회 데이터를 비교해 new/update/delete 요청을 조합한다.
 */

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

/**
 * 서버의 공통코드 마스터 DTO를 화면용 모델로 변환한다.
 */
export function mapToCommonMasterModel(master: CommonMaster): MasterCode {
  return {
    id: master.sysId ?? master.commonCd,
    sysId: master.sysId,
    code: master.commonCd,
    name: master.commonNm,
    useYn: master.useYn === 'N' ? 'N' : 'Y',
  };
}

/**
 * 서버의 공통코드 상세 DTO를 화면용 모델로 변환한다.
 */
export function mapToCommonDetailModel(detail: CommonDetail): DetailCode {
  return {
    id: detail.sysId ?? `detail-${detail.linkSysId}-${detail.commonCd ?? detail.commonNm}`,
    sysId: detail.sysId,
    linkSysId: detail.linkSysId,
    code: detail.commonCd ?? '',
    name: detail.commonNm,
    useYn: detail.useYn === 'Y',
    ordNo: detail.ordNo,
    isNew: false,
  };
}

/**
 * 화면용 마스터 모델을 서버 저장용 payload로 변환한다.
 */
export function mapToCommonMasterPayload(master: MasterCode): CommonMaster {
  return {
    sysId: master.sysId,
    commonCd: master.code,
    commonNm: master.name,
    useYn: master.useYn,
  };
}

/**
 * 화면용 상세 모델을 서버 저장용 payload로 변환한다.
 */
function mapToCommonDetailPayload(detail: DetailCode): CommonDetail {
  return {
    sysId: detail.sysId,
    linkSysId: detail.linkSysId,
    commonCd: detail.code,
    commonNm: detail.name,
    ordNo: detail.ordNo,
    useYn: detail.useYn ? 'Y' : 'N',
  };
}

/**
 * 상세 행 두 개가 실제 저장 관점에서 같은 값인지 비교한다.
 *
 * @description
 * - checked, isNew 같은 UI 전용 상태는 비교에서 제외한다.
 * - 실제 서버에 저장되는 값이 달라졌을 때만 update 대상으로 본다.
 */
function isSameDetail(a: DetailCode, b: DetailCode) {
  return (
    a.linkSysId === b.linkSysId &&
    a.code === b.code &&
    a.name === b.name &&
    a.useYn === b.useYn &&
    a.ordNo === b.ordNo
  );
}

/**
 * 상세 draft와 최초 조회 데이터를 비교해 저장 요청 본문을 만든다.
 *
 * @description
 * - isNew 행은 newItems
 * - 기존 행 중 값이 바뀐 것은 updateItems
 * - 최초에는 있었지만 현재는 없는 행은 deleteItems
 * 로 분류한다.
 *
 * @example
 * // 최초 조회
 * // A, B
 * // 현재 draft
 * // A(이름 수정), C(신규)
 * //
 * // 결과
 * // updateItems = [A]
 * // newItems    = [C]
 * // deleteItems = [B]
 */
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

  const newItems = currentRows.filter((row) => row.isNew).map(mapToCommonDetailPayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameDetail(row, originalRow) : false;
    })
    .map(mapToCommonDetailPayload);
  const deleteItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToCommonDetailPayload);

  return {
    linkSysId,
    newItems: newItems.length ? newItems : undefined,
    updateItems: updateItems.length ? updateItems : undefined,
    deleteItems: deleteItems.length ? deleteItems : undefined,
  };
}

/**
 * 상세 저장 요청에 실제 변경사항이 있는지 확인한다.
 *
 * @description
 * - 저장 버튼을 눌렀더라도 new/update/delete가 모두 비어 있으면
 *   서버를 호출하지 않고 "변경된 내용이 없습니다." 흐름으로 보낸다.
 */
export function hasCommonDetailChanges(request: CommonDetailRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.deleteItems?.length,
  );
}

/**
 * 공통코드 마스터 목록 조회 wrapper hook
 *
 * @description
 * - generated query hook에 feature 표준 query key를 강제로 부여한다.
 */
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

/**
 * 선택된 마스터 기준 공통코드 상세 목록 조회 wrapper hook
 *
 * @description
 * - 마스터가 선택되지 않은 상태에서는 enabled=false로 동작한다.
 * - 선택된 마스터가 바뀌면 detail query key도 함께 바뀐다.
 */
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

/**
 * 공통코드 마스터 저장 wrapper mutation
 *
 * @description
 * - 신규/수정을 호출부에서 분기하지 않도록 하나의 mutation 인터페이스로 감싼다.
 */
export function useSaveCommonMasterMutation() {
  const createMutation = useNewCommonMaster();
  const updateMutation = useUpdateCommonMaster();

  const mutateAsync = async (master: MasterCode, isCreateMode: boolean) => {
    const payload = mapToCommonMasterPayload(master);

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

/**
 * 체크된 마스터 삭제 wrapper mutation
 */
export function useDeleteCommonMastersMutation() {
  const mutation = useDelCommonMaster();

  return {
    mutateAsync: async (masters: MasterCode[]) =>
      mutation.mutateAsync({ data: masters.map(mapToCommonMasterPayload) }),
    isPending: mutation.isPending,
  };
}

/**
 * 상세 저장 wrapper mutation
 */
export function useSaveCommonDetailsMutation() {
  const mutation = useSaveCommonDetail();

  return {
    mutateAsync: async (request: CommonDetailRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
