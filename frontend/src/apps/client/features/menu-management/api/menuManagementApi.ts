import { useMutation } from '@tanstack/react-query';
import {
  useDelMenuMaster,
  useGetMenuDetail,
  useGetMenuMaster,
  useNewMenuMaster,
  useUpdateMenuMaster,
} from '@/generated/menu-manage-controller/menu-manage-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import type { MenuDetailItem } from '@/generated/types/menuDetailItem';
import type { MenuDetailRequest } from '@/generated/types/menuDetailRequest';
import type { MenuMasterRequest } from '@/generated/types/menuMasterRequest';
import type { MenuMasterResponse } from '@/generated/types/menuMasterResponse';
import type { MenuDetailResponse } from '@/generated/types/menuDetailResponse';
import { httpClient } from '@/shared/lib/httpClient';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { SelectOption } from '@/shared/components/input';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type { MenuCategoryRow, MenuDetailRow, MenuDetailSchema } from '../types';

export const USE_YN_OPTIONS: SelectOption[] = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export const MENU_DETAIL_COLUMNS: EditableDetailColumn[] = [
  { key: 'menuName', label: '메뉴명', type: 'text', required: true },
  { key: 'menuPrice', label: '메뉴 가격', type: 'text', required: true, inputType: 'number' },
  {
    key: 'optionUseYn',
    label: '상세옵션 사용',
    type: 'select',
    options: USE_YN_OPTIONS,
    className: 'common-table__col--md',
  },
  {
    key: 'useYn',
    label: '메뉴 사용',
    type: 'select',
    options: USE_YN_OPTIONS,
    className: 'common-table__col--md',
  },
  { key: 'edit', label: '', type: 'action', className: 'common-table__col--action' },
];

function cloneDetailColumns(columns: EditableDetailColumn[]) {
  return columns.map((column) => ({ ...column }));
}

export function createEmptyMenuDetailSchema(): MenuDetailSchema {
  return {
    columns: cloneDetailColumns(MENU_DETAIL_COLUMNS),
    rows: [],
  };
}

export function createBlankMenuDetailValues(): MenuDetailRow['values'] {
  return {
    menuName: '',
    menuPrice: '',
    menuDescription: '',
    optionUseYn: 'N',
    useYn: 'Y',
  };
}

export function mapToMenuCategoryRow(item: MenuMasterResponse): MenuCategoryRow {
  return {
    id: item.sysId ?? '',
    sysId: item.sysId,
    name: item.categoryName ?? '',
    useYn: item.useYn === 'N' ? 'N' : 'Y',
  };
}

export function mapToMenuCategoryPayload(row: MenuCategoryRow): MenuMasterRequest {
  return {
    sysId: row.sysId,
    categoryName: row.name,
    useYn: row.useYn,
  };
}

export function mapToMenuDetailRow(menuDetail: MenuDetailResponse): MenuDetailRow {
  return {
    id: menuDetail.sysId ?? `${menuDetail.linkSysId}-${menuDetail.ordNo}`,
    sysId: menuDetail.sysId,
    masterId: menuDetail.linkSysId ?? '',
    ordNo: menuDetail.ordNo ?? 0,
    fileUlid: menuDetail.fileUlid,
    values: {
      menuName: menuDetail.menuName ?? '',
      menuPrice: menuDetail.menuPrice != null ? String(menuDetail.menuPrice) : '',
      menuDescription: menuDetail.menuDescription ?? '',
      optionUseYn: menuDetail.optionUseYn === 'Y' ? 'Y' : 'N',
      useYn: menuDetail.useYn === 'N' ? 'N' : 'Y',
    },
  };
}

export function mapToMenuDetailPayload(row: MenuDetailRow): MenuDetailItem {
  return {
    sysId: row.sysId,
    linkSysId: row.masterId,
    menuName: row.values.menuName ?? '',
    menuPrice: Number(row.values.menuPrice) || 0,
    menuDescription: row.values.menuDescription ?? '',
    optionUseYn: row.values.optionUseYn ?? 'N',
    useYn: row.values.useYn ?? 'Y',
    fileUlid: row.fileUlid,
    ordNo: row.ordNo,
  };
}

function isSameMenuDetailRow(a: MenuDetailRow, b: MenuDetailRow) {
  return (
    a.masterId === b.masterId &&
    a.values.menuName === b.values.menuName &&
    a.values.menuPrice === b.values.menuPrice &&
    a.values.menuDescription === b.values.menuDescription &&
    a.values.optionUseYn === b.values.optionUseYn &&
    a.values.useYn === b.values.useYn &&
    a.ordNo === b.ordNo
  );
}

export function buildMenuDetailRequest(
  currentRows: MenuDetailRow[],
  originalRows: MenuDetailRow[],
): MenuDetailRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToMenuDetailPayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameMenuDetailRow(row, originalRow) : false;
    })
    .map(mapToMenuDetailPayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToMenuDetailPayload);

  return {
    newItems,
    updateItems,
    delItems,
  };
}

export function hasMenuDetailChanges(request: MenuDetailRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function useMenuCategoryQuery(searchKeyword = '') {
  return useGetMenuMaster(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.menuManagement.masters(searchKeyword),
      ...queryPolicies.clientCrudList,
    },
  });
}

export function useMenuDetailQuery(masterId = '') {
  return useGetMenuDetail(masterId, {
    query: {
      enabled: Boolean(masterId),
      queryKey: queryKeys.menuManagement.details(masterId),
      ...queryPolicies.clientCrudList,
    },
  });
}

export function useSaveMenuCategoryMutation() {
  const newMutation = useNewMenuMaster();
  const updateMutation = useUpdateMenuMaster();

  return {
    mutateAsync: async (row: MenuCategoryRow, isCreateMode: boolean) => {
      const payload = mapToMenuCategoryPayload(row);
      return isCreateMode
        ? newMutation.mutateAsync({ data: payload })
        : updateMutation.mutateAsync({ data: payload });
    },
    isPending: newMutation.isPending || updateMutation.isPending,
  };
}

export function useDeleteMenuCategoriesMutation() {
  const mutation = useDelMenuMaster();

  return {
    mutateAsync: async (rows: MenuCategoryRow[]) =>
      mutation.mutateAsync({ data: rows.map(mapToMenuCategoryPayload) }),
    isPending: mutation.isPending,
  };
}

/**
 * 생성된 `useSaveMenuDetail`은 menuDetailRequest/fileRequest를 query string으로 보내
 * 중첩 객체 값이 전달되지 않는다(OpenAPI 명세상 @RequestParam로 정의됨).
 * 다른 상세 저장 API와 동일하게 JSON body로 직접 호출한다.
 */
function saveMenuDetail(request: MenuDetailRequest) {
  return httpClient<{ success: boolean }>({
    url: '/api/client/menu_manage/menu/detail/save',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: request,
  });
}

export function useSaveMenuDetailsMutation() {
  const mutation = useMutation({ mutationFn: saveMenuDetail });

  return {
    mutateAsync: async (request: MenuDetailRequest) => mutation.mutateAsync(request),
    isPending: mutation.isPending,
  };
}

export function useMenuDetailAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile({ linkSysId: trimmed }, { query: { enabled: trimmed.length > 0 } });
}
