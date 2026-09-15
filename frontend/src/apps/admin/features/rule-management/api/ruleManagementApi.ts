import {
  useDelRuleMaster,
  useGetRuleDetail,
  useGetRuleMaster,
  useNewRuleMaster,
  useSaveRule,
  useUpdateRuleMaster,
} from '@/generated/settings-controller/settings-controller';
import type { RuleDetail } from '@/generated/types/ruleDetail';
import type { RuleDetailRequest } from '@/generated/types/ruleDetailRequest';
import type { RuleMaster } from '@/generated/types/ruleMaster';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { RuleDetailColumn, RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';

export const RULE_DETAIL_COLUMNS: RuleDetailColumn[] = [
  { key: 'optionCd', label: '옵션코드', type: 'text', required: true, readOnlyOnExisting: true },
  { key: 'optionNm', label: '옵션명', type: 'text', required: true },
  { key: 'optionData', label: '옵션데이터', type: 'text', required: true },
  { key: 'description', label: '설명', type: 'text' },
];

function cloneDetailColumns(columns: RuleDetailColumn[]) {
  return columns.map((column) => ({ ...column }));
}

export function createEmptyRuleDetailSchema(): RuleDetailSchema {
  return {
    columns: cloneDetailColumns(RULE_DETAIL_COLUMNS),
    rows: [],
  };
}

export function createBlankRuleDetailValues(columns: RuleDetailColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.key, '']));
}

export function mapToRuleMasterRow(ruleMaster: RuleMaster): RuleMasterRow {
  return {
    id: ruleMaster.sysId ?? ruleMaster.ruleCd,
    sysId: ruleMaster.sysId,
    code: ruleMaster.ruleCd,
    name: ruleMaster.ruleNm,
    useYn: ruleMaster.useYn === 'N' ? 'N' : 'Y',
  };
}

export function mapToRuleMasterPayload(row: RuleMasterRow): RuleMaster {
  return {
    sysId: row.sysId,
    ruleCd: row.code,
    ruleNm: row.name,
    useYn: row.useYn,
  };
}

export function mapToRuleDetailRow(ruleDetail: RuleDetail): RuleDetailRow {
  return {
    id: ruleDetail.sysId ?? `${ruleDetail.linkSysId}-${ruleDetail.optionCd}`,
    sysId: ruleDetail.sysId,
    masterId: ruleDetail.linkSysId,
    ordNo: ruleDetail.ordNo,
    values: {
      optionCd: ruleDetail.optionCd,
      optionNm: ruleDetail.optionNm,
      optionData: ruleDetail.optionData,
      description: ruleDetail.description ?? '',
    },
  };
}

export function mapToRuleDetailPayload(row: RuleDetailRow): RuleDetail {
  return {
    sysId: row.sysId,
    linkSysId: row.masterId,
    optionCd: String(row.values.optionCd ?? ''),
    optionNm: String(row.values.optionNm ?? ''),
    optionData: String(row.values.optionData ?? ''),
    description: String(row.values.description ?? ''),
    ordNo: row.ordNo,
  };
}

function isSameRuleDetailRow(a: RuleDetailRow, b: RuleDetailRow) {
  return (
    a.masterId === b.masterId &&
    a.values.optionCd === b.values.optionCd &&
    a.values.optionNm === b.values.optionNm &&
    a.values.optionData === b.values.optionData &&
    (a.values.description ?? '') === (b.values.description ?? '') &&
    a.ordNo === b.ordNo
  );
}

export function buildRuleDetailRequest(
  currentRows: RuleDetailRow[],
  originalRows: RuleDetailRow[],
): RuleDetailRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToRuleDetailPayload);
  // 신규 행은 sysId가 섞여 있어도 update 대상에서 제외해 요청 분류가 겹치지 않게 한다.
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameRuleDetailRow(row, originalRow) : false;
    })
    .map(mapToRuleDetailPayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToRuleDetailPayload);

  return {
    newItems,
    updateItems,
    delItems,
  };
}

export function hasRuleDetailChanges(request: RuleDetailRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function useRuleMasterQuery(searchKeyword = '') {
  return useGetRuleMaster(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.rule.masters(searchKeyword),
      ...queryPolicies.adminCrudList,
    },
  });
}

export function useRuleDetailQuery(masterId = '') {
  return useGetRuleDetail(
    { sysId: masterId },
    {
      query: {
        enabled: Boolean(masterId),
        queryKey: queryKeys.rule.details(masterId),
        ...queryPolicies.adminCrudList,
      },
    },
  );
}

export function useSaveRuleMasterMutation() {
  const newMutation = useNewRuleMaster();
  const updateMutation = useUpdateRuleMaster();

  return {
    mutateAsync: async (row: RuleMasterRow, isCreateMode: boolean) => {
      const payload = mapToRuleMasterPayload(row);
      return isCreateMode
        ? newMutation.mutateAsync({ data: payload })
        : updateMutation.mutateAsync({ data: payload });
    },
    isPending: newMutation.isPending || updateMutation.isPending,
  };
}

export function useDeleteRuleMastersMutation() {
  const mutation = useDelRuleMaster();

  return {
    mutateAsync: async (rows: RuleMasterRow[]) =>
      mutation.mutateAsync({ data: rows.map(mapToRuleMasterPayload) }),
    isPending: mutation.isPending,
  };
}

export function useSaveRuleDetailsMutation() {
  const mutation = useSaveRule();

  return {
    mutateAsync: async (request: RuleDetailRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
