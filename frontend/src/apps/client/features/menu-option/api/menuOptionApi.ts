import { useMutation } from '@tanstack/react-query';
import {
  getMenuDetailSearchKeyword,
  useDelMenuOptionGroup,
  useGetMenuDetailSearchKeyword,
  useGetMenuOptionDetail,
  useGetMenuOptionGroup,
  useNewMenuOptionGroup,
  useUpdateMenuOptionGroup,
} from '@/generated/menu-manage-controller/menu-manage-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import type { MenuDetailResponse } from '@/generated/types/menuDetailResponse';
import type { MenuOptionDetailItem } from '@/generated/types/menuOptionDetailItem';
import type { MenuOptionDetailRequest } from '@/generated/types/menuOptionDetailRequest';
import type { MenuOptionDetailResponse } from '@/generated/types/menuOptionDetailResponse';
import type { MenuOptionGroupItem } from '@/generated/types/menuOptionGroupItem';
import type { MenuOptionGroupRequest } from '@/generated/types/menuOptionGroupRequest';
import type { MenuOptionGroupResponse } from '@/generated/types/menuOptionGroupResponse';
import { httpClient } from '@/shared/lib/httpClient';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { SelectOption } from '@/shared/components/input';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type {
  MenuOptionDetailRow,
  MenuOptionDetailSchema,
  MenuOptionGroupRow,
  MenuOptionGroupSchema,
  MenuOptionMasterRow,
} from '../types';

export const USE_YN_OPTIONS: SelectOption[] = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export const INPUT_TYPE_OPTIONS: SelectOption[] = [
  { value: '주문 옵션', label: '주문 옵션' },
  { value: '수량 설정', label: '수량 설정' },
];

export const MENU_OPTION_GROUP_COLUMNS: EditableDetailColumn[] = [
  { key: 'groupName', label: '옵션 그룹명', type: 'text', required: true },
  { key: 'requiredYn', label: '필수 선택', type: 'boolean', className: 'common-table__col--sm' },
  {
    key: 'inputType',
    label: '옵션/수량',
    type: 'select',
    options: INPUT_TYPE_OPTIONS,
    placeholder: '선택하세요',
    required: true,
    className: 'common-table__col--md',
  },
  {
    key: 'useYn',
    label: '사용 여부',
    type: 'select',
    options: USE_YN_OPTIONS,
    required: true,
    className: 'common-table__col--md',
  },
];

const MENU_OPTION_DETAIL_BASE_COLUMNS: EditableDetailColumn[] = [
  { key: 'menuOptionName', label: '옵션명', type: 'text', required: true },
  {
    key: 'menuOptionPrice',
    label: '옵션 가격',
    type: 'text',
    required: true,
    inputType: 'number-grouped',
  },
];

const MENU_OPTION_DETAIL_TAIL_COLUMNS: EditableDetailColumn[] = [
  { key: 'defaultYn', label: '기본 선택', type: 'boolean', className: 'common-table__col--sm' },
  {
    key: 'useYn',
    label: '사용 여부',
    type: 'select',
    options: USE_YN_OPTIONS,
    required: true,
    className: 'common-table__col--md',
  },
  { key: 'edit', label: '', type: 'action', className: 'common-table__col--action' },
];

/** 옵션 그룹의 옵션/수량이 "주문 옵션"일 때 옵션 항목 컬럼. */
export const MENU_OPTION_DETAIL_ORDER_COLUMNS: EditableDetailColumn[] = [
  ...MENU_OPTION_DETAIL_BASE_COLUMNS,
  ...MENU_OPTION_DETAIL_TAIL_COLUMNS,
];

/** 옵션 그룹의 옵션/수량이 "수량 설정"일 때 옵션 항목 컬럼. */
export const MENU_OPTION_DETAIL_QUANTITY_COLUMNS: EditableDetailColumn[] = [
  ...MENU_OPTION_DETAIL_BASE_COLUMNS,
  { key: 'maximumNum', label: '수량 설정', type: 'text', required: true, inputType: 'number' },
  ...MENU_OPTION_DETAIL_TAIL_COLUMNS,
];

export function getMenuOptionDetailColumns(groupInputType: string | undefined) {
  return groupInputType === '수량 설정'
    ? MENU_OPTION_DETAIL_QUANTITY_COLUMNS
    : MENU_OPTION_DETAIL_ORDER_COLUMNS;
}

function cloneColumns(columns: EditableDetailColumn[]) {
  return columns.map((column) => ({ ...column }));
}

export function createEmptyMenuOptionGroupSchema(): MenuOptionGroupSchema {
  return {
    columns: cloneColumns(MENU_OPTION_GROUP_COLUMNS),
    rows: [],
  };
}

export function createEmptyMenuOptionDetailSchema(groupInputType?: string): MenuOptionDetailSchema {
  return {
    columns: cloneColumns(getMenuOptionDetailColumns(groupInputType)),
    rows: [],
  };
}

export function createBlankMenuOptionGroupValues(): MenuOptionGroupRow['values'] {
  return {
    groupName: '',
    requiredYn: false,
    inputType: '',
    useYn: 'Y',
  };
}

export function createBlankMenuOptionDetailValues(): MenuOptionDetailRow['values'] {
  return {
    menuOptionName: '',
    menuOptionPrice: '',
    maximumNum: '',
    menuDescription: '',
    useYn: 'Y',
    defaultYn: false,
  };
}

export function mapToMenuOptionMasterRow(item: MenuDetailResponse): MenuOptionMasterRow {
  return {
    id: item.sysId ?? '',
    sysId: item.sysId,
    name: item.menuName ?? '',
    useYn: item.useYn === 'N' ? 'N' : 'Y',
  };
}

export function mapToMenuOptionGroupRow(item: MenuOptionGroupResponse): MenuOptionGroupRow {
  return {
    id: item.sysId ?? `${item.linkSysId}-${item.ordNo}`,
    sysId: item.sysId,
    masterId: item.linkSysId ?? '',
    ordNo: item.ordNo ?? 0,
    values: {
      groupName: item.groupName ?? '',
      requiredYn: item.requiredYn === 'Y',
      inputType: item.inputType ?? '',
      useYn: item.useYn === 'N' ? 'N' : 'Y',
    },
  };
}

export function mapToMenuOptionGroupPayload(row: MenuOptionGroupRow): MenuOptionGroupRequest {
  return {
    sysId: row.sysId,
    linkSysId: row.masterId,
    groupName: row.values.groupName,
    requiredYn: row.values.requiredYn ? 'Y' : 'N',
    inputType: row.values.inputType,
    ordNo: row.ordNo,
    useYn: row.values.useYn,
  };
}

export function mapToMenuOptionDetailRow(item: MenuOptionDetailResponse): MenuOptionDetailRow {
  return {
    id: item.sysId ?? `${item.linkSysId}-${item.ordNo}`,
    sysId: item.sysId,
    groupId: item.linkSysId ?? '',
    ordNo: item.ordNo ?? 0,
    fileUlid: item.fileUlid,
    values: {
      menuOptionName: item.menuOptionName ?? '',
      menuOptionPrice: item.menuOptionPrice != null ? String(item.menuOptionPrice) : '',
      maximumNum: item.maximumNum != null ? String(item.maximumNum) : '',
      menuDescription: item.menuDescription ?? '',
      useYn: item.useYn === 'N' ? 'N' : 'Y',
      defaultYn: false,
    },
  };
}

/**
 * `defaultYn`은 DB/API 어디에도 없는 프론트 전용 필드라 전송하지 않는다.
 */
export function mapToMenuOptionDetailPayload(row: MenuOptionDetailRow): MenuOptionDetailItem {
  const maximumNum = row.values.maximumNum.trim() || '0';

  return {
    sysId: row.sysId,
    linkSysId: row.groupId,
    menuOptionName: row.values.menuOptionName,
    menuOptionPrice: row.values.menuOptionPrice,
    maximumNum,
    menuDescription: row.values.menuDescription,
    useYn: row.values.useYn,
    fileUlid: row.fileUlid,
    ordNo: row.ordNo,
  };
}

function isSameMenuOptionGroupRow(a: MenuOptionGroupRow, b: MenuOptionGroupRow) {
  return (
    a.masterId === b.masterId &&
    a.values.groupName === b.values.groupName &&
    a.values.requiredYn === b.values.requiredYn &&
    a.values.inputType === b.values.inputType &&
    a.values.useYn === b.values.useYn &&
    a.ordNo === b.ordNo
  );
}

function isSameMenuOptionDetailRow(a: MenuOptionDetailRow, b: MenuOptionDetailRow) {
  return (
    a.groupId === b.groupId &&
    a.values.menuOptionName === b.values.menuOptionName &&
    a.values.menuOptionPrice === b.values.menuOptionPrice &&
    a.values.maximumNum === b.values.maximumNum &&
    a.values.menuDescription === b.values.menuDescription &&
    a.values.useYn === b.values.useYn &&
    a.ordNo === b.ordNo
  );
}

export type MenuOptionGroupChanges = {
  newRows: MenuOptionGroupRow[];
  updateRows: MenuOptionGroupRow[];
  delRows: MenuOptionGroupRow[];
};

export function buildMenuOptionGroupChanges(
  currentRows: MenuOptionGroupRow[],
  originalRows: MenuOptionGroupRow[],
): MenuOptionGroupChanges {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newRows = currentRows.filter((row) => row.isNew);
  const updateRows = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameMenuOptionGroupRow(row, originalRow) : false;
    });
  const delRows = originalRows.filter(
    (row) => row.sysId && !currentBySysId.has(row.sysId as string),
  );

  return { newRows, updateRows, delRows };
}

export function hasMenuOptionGroupChanges(changes: MenuOptionGroupChanges) {
  return Boolean(changes.newRows.length || changes.updateRows.length || changes.delRows.length);
}

export function buildMenuOptionDetailRequest(
  currentRows: MenuOptionDetailRow[],
  originalRows: MenuOptionDetailRow[],
): MenuOptionDetailRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToMenuOptionDetailPayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameMenuOptionDetailRow(row, originalRow) : false;
    })
    .map(mapToMenuOptionDetailPayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToMenuOptionDetailPayload);

  return { newItems, updateItems, delItems };
}

export function hasMenuOptionDetailChanges(request: MenuOptionDetailRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function getMenuOptionMasterList(searchKeyword = '', signal?: AbortSignal) {
  const normalizedKeyword = searchKeyword.trim();

  return getMenuDetailSearchKeyword(
    normalizedKeyword ? { searchKeyword: normalizedKeyword } : undefined,
    undefined,
    signal,
  );
}

/** 로그인 사용자의 사업장에 등록된 전체 메뉴를 메뉴명으로 조회한다. */
export function useMenuOptionMasterQuery(searchKeyword = '') {
  const normalizedKeyword = searchKeyword.trim();

  return useGetMenuDetailSearchKeyword(
    normalizedKeyword ? { searchKeyword: normalizedKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.menuOption.masters(normalizedKeyword),
        ...queryPolicies.clientCrudList,
      },
    },
  );
}

export function useMenuOptionGroupQuery(masterId = '') {
  return useGetMenuOptionGroup(masterId, {
    query: {
      enabled: Boolean(masterId),
      queryKey: queryKeys.menuOption.groups(masterId),
      ...queryPolicies.clientCrudList,
    },
  });
}

export function useMenuOptionDetailQuery(groupId = '') {
  return useGetMenuOptionDetail(groupId, {
    query: {
      enabled: Boolean(groupId),
      queryKey: queryKeys.menuOption.details(groupId),
      ...queryPolicies.clientCrudList,
    },
  });
}

/**
 * 옵션 그룹은 배치 저장 API가 없어 변경분만큼 new/update/del을 개별 호출한다.
 */
export function useSaveMenuOptionGroupsMutation() {
  const newMutation = useNewMenuOptionGroup();
  const updateMutation = useUpdateMenuOptionGroup();
  const delMutation = useDelMenuOptionGroup();

  return {
    mutateAsync: async (changes: MenuOptionGroupChanges) => {
      await Promise.all([
        ...changes.newRows.map((row) =>
          newMutation.mutateAsync({ data: mapToMenuOptionGroupPayload(row) }),
        ),
        ...changes.updateRows.map((row) =>
          updateMutation.mutateAsync({ data: mapToMenuOptionGroupPayload(row) }),
        ),
        changes.delRows.length
          ? delMutation.mutateAsync({
              data: changes.delRows.map(mapToMenuOptionGroupPayload) as MenuOptionGroupItem[],
            })
          : Promise.resolve(),
      ]);
    },
    isPending: newMutation.isPending || updateMutation.isPending || delMutation.isPending,
  };
}

/**
 * 생성된 `useSaveMenuOptionDetail`은 menuOptionDetailRequest/fileRequest를 query string으로 보내
 * 중첩 객체 값이 전달되지 않는다(OpenAPI 명세상 @RequestParam로 정의됨).
 * 백엔드 컨트롤러는 @ModelAttribute MenuOptionDetailRequest를 루트에서 받으므로
 * JSON wrapper가 아니라 newItems[0].field 형태의 FormData로 펼쳐 보낸다.
 */
function appendMenuOptionDetailItem(
  formData: FormData,
  fieldName: 'newItems' | 'updateItems' | 'delItems',
  index: number,
  item: MenuOptionDetailItem,
) {
  const prefix = `${fieldName}[${index}]`;

  if (item.sysId) formData.append(`${prefix}.sysId`, item.sysId);
  if (item.linkSysId) formData.append(`${prefix}.linkSysId`, item.linkSysId);
  if (item.menuOptionName) formData.append(`${prefix}.menuOptionName`, item.menuOptionName);
  if (item.menuOptionPrice != null) formData.append(`${prefix}.menuOptionPrice`, String(item.menuOptionPrice));
  if (item.maximumNum != null) formData.append(`${prefix}.maximumNum`, String(item.maximumNum));
  if (item.menuDescription != null) formData.append(`${prefix}.menuDescription`, item.menuDescription);
  if (item.useYn) formData.append(`${prefix}.useYn`, item.useYn);
  if (item.fileUlid) formData.append(`${prefix}.fileUlid`, item.fileUlid);
  if (item.ordNo != null) formData.append(`${prefix}.ordNo`, String(item.ordNo));
}

export function buildMenuOptionDetailFormData(request: MenuOptionDetailRequest): FormData {
  const formData = new FormData();

  request.newItems?.forEach((item, index) => {
    appendMenuOptionDetailItem(formData, 'newItems', index, item);
  });
  request.updateItems?.forEach((item, index) => {
    appendMenuOptionDetailItem(formData, 'updateItems', index, item);
  });
  request.delItems?.forEach((item, index) => {
    appendMenuOptionDetailItem(formData, 'delItems', index, item);
  });

  return formData;
}

function saveMenuOptionDetail(request: MenuOptionDetailRequest) {
  return httpClient<{ success: boolean }>({
    url: '/api/client/menu_manage/option/detail/save',
    method: 'POST',
    data: buildMenuOptionDetailFormData(request),
  });
}

export function useSaveMenuOptionDetailsMutation() {
  const mutation = useMutation({ mutationFn: saveMenuOptionDetail });

  return {
    mutateAsync: async (request: MenuOptionDetailRequest) => mutation.mutateAsync(request),
    isPending: mutation.isPending,
  };
}

export function useMenuOptionDetailAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile({ linkSysId: trimmed }, { query: { enabled: trimmed.length > 0 } });
}
