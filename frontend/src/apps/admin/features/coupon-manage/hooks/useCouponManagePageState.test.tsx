import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCouponManagePageState } from './useCouponManagePageState';
import {
  mapToCouponRow,
  useCouponQuery,
  useDeleteCouponsMutation,
  useSaveCouponMutation,
} from '../api/couponManageApi';

const modalFlowMock = {
  isEditorOpen: false,
  isDirty: false,
  isCreateMode: false,
  isCodeReadonly: false,
  editingRow: null,
  editorErrors: {
    couponCd: false,
    couponNm: false,
    startDate: false,
    endDate: false,
    useYn: false,
  },
  isSaveConfirmOpen: false,
  isDeleteConfirmOpen: false,
  isDirtyWarningOpen: false,
  isConfirming: false,
  isConfirmingDelete: false,
  noticeState: null,
  openCreateModal: vi.fn(),
  requestDelete: vi.fn(),
  openEditModal: vi.fn(),
  changeEditingField: vi.fn(),
  requestSave: vi.fn(),
  confirmSave: vi.fn(),
  confirmDelete: vi.fn(),
  closeEditorModal: vi.fn(),
  forceCloseEditorModal: vi.fn(),
  closeSaveConfirm: vi.fn(),
  closeDeleteConfirm: vi.fn(),
  closeDirtyWarning: vi.fn(),
  closeNotice: vi.fn(),
};

const invalidateQueriesMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

vi.mock('../api/couponManageApi', () => ({
  useCouponQuery: vi.fn(),
  useSaveCouponMutation: vi.fn(),
  useDeleteCouponsMutation: vi.fn(),
  mapToCouponRow: vi.fn((item) => ({
    id: item.sysId ?? item.couponCd ?? '',
    sysId: item.sysId,
    couponCd: item.couponCd ?? '',
    couponNm: item.couponNm ?? '',
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
    useYn: item.useYn === 'Y' ? 'Y' : 'N',
  })),
}));

vi.mock('./useCouponManageModalFlow', () => ({
  editorRowToCouponRow: vi.fn((row) => row),
  useCouponManageModalFlow: vi.fn(() => modalFlowMock),
}));

const mockedUseCouponQuery = vi.mocked(useCouponQuery);
const mockedUseSaveCouponMutation = vi.mocked(useSaveCouponMutation);
const mockedUseDeleteCouponsMutation = vi.mocked(useDeleteCouponsMutation);
const mockedMapToCouponRow = vi.mocked(mapToCouponRow);

describe('useCouponManagePageState', () => {
  beforeEach(() => {
    invalidateQueriesMock.mockReset();
    mockedUseCouponQuery.mockReset();
    mockedUseSaveCouponMutation.mockReset();
    mockedUseDeleteCouponsMutation.mockReset();
    mockedMapToCouponRow.mockClear();

    mockedUseCouponQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);
    mockedUseSaveCouponMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
    mockedUseDeleteCouponsMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it('keeps draftKeyword separate from appliedKeyword until search runs', () => {
    const { result } = renderHook(() => useCouponManagePageState());

    expect(mockedUseCouponQuery).toHaveBeenLastCalledWith('');

    act(() => {
      result.current.actions.handleKeywordChange('쿠폰');
    });

    expect(result.current.uiProps.draftKeyword).toBe('쿠폰');
    expect(mockedUseCouponQuery).toHaveBeenLastCalledWith('');

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(mockedUseCouponQuery).toHaveBeenLastCalledWith('쿠폰');
  });

  it('maps fetched coupon rows into table rows', () => {
    mockedUseCouponQuery.mockReturnValue({
      data: [
        {
          sysId: 'coupon-1',
          couponCd: 'CP001',
          couponNm: '신규 가입 쿠폰',
          startDate: '2026-04-01',
          endDate: '2026-04-30',
          useYn: 'Y',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    const { result } = renderHook(() => useCouponManagePageState());

    expect(result.current.data.rows).toEqual([
      {
        id: 'coupon-1',
        sysId: 'coupon-1',
        couponCd: 'CP001',
        couponNm: '신규 가입 쿠폰',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        useYn: 'Y',
      },
    ]);
  });
});
