import { useMutation, useQuery } from '@tanstack/react-query';
import type { SelectOption } from '@/shared/components/input';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { httpClient } from '@/shared/lib/httpClient';
import type { StaffCallItemRow } from '../types';

export const SINGLE_YN_OPTIONS: SelectOption[] = [
  { value: 'N', label: '다건' },
  { value: 'Y', label: '단건' },
];

export const USE_YN_OPTIONS: SelectOption[] = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export type StaffCallSettingDto = {
  sysId: string;
  callCd: string;
  callNm: string;
  singleYn: 'Y' | 'N';
  description?: string | null;
};

type StaffCallSettingRequest = {
  newItems: StaffCallSettingDto[];
  updateItems: StaffCallSettingDto[];
  delItems: StaffCallSettingDto[];
};

export function mapStaffCallSetting(dto: StaffCallSettingDto, index: number): StaffCallItemRow {
  return {
    id: dto.sysId,
    callCd: dto.callCd,
    callNm: dto.callNm,
    singleYn: dto.singleYn,
    description: dto.description ?? '',
    useYn: 'Y',
    ordNo: index + 1,
    isNew: false,
  };
}

function toDto(row: StaffCallItemRow): StaffCallSettingDto {
  return {
    sysId: row.isNew ? '' : row.id,
    callCd: row.callCd.trim(),
    callNm: row.callNm.trim(),
    singleYn: row.singleYn,
    description: row.description.trim() || null,
  };
}

function sameStoredValues(a: StaffCallItemRow, b: StaffCallItemRow) {
  return a.callCd === b.callCd && a.callNm === b.callNm
    && a.singleYn === b.singleYn && a.description === b.description;
}

export function buildStaffCallSettingRequest(
  rows: StaffCallItemRow[],
  originalRows: StaffCallItemRow[],
): StaffCallSettingRequest {
  const originals = new Map(originalRows.map((row) => [row.id, row]));
  const currentIds = new Set(rows.filter((row) => !row.isNew).map((row) => row.id));
  return {
    newItems: rows.filter((row) => row.isNew).map(toDto),
    updateItems: rows
      .filter((row) => !row.isNew && originals.has(row.id))
      .filter((row) => !sameStoredValues(row, originals.get(row.id)!))
      .map(toDto),
    delItems: originalRows.filter((row) => !currentIds.has(row.id)).map(toDto),
  };
}

function getStaffCallSettings() {
  return httpClient<StaffCallSettingDto[]>({
    url: '/api/client/staff-call/settings',
    method: 'GET',
  });
}

function saveStaffCallSettings(request: StaffCallSettingRequest) {
  return httpClient<{ success: boolean }>({
    url: '/api/client/staff-call/settings/save',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: request,
  });
}

export function useStaffCallSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.staffCallSetting.lists,
    queryFn: getStaffCallSettings,
    ...queryPolicies.clientCrudList,
  });
}

export function useSaveStaffCallSettingsMutation() {
  return useMutation({ mutationFn: saveStaffCallSettings });
}
