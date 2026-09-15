/**
 * @fileoverview 매장 > 유저 관리 > 유저 정보 관리 페이지 상태 조합 훅 테스트
 *
 * @description
 * - 목록 조회 상태(data/status)가 쿼리 결과에 반영되는지
 * - 행 선택/전체 선택, 삭제 확인 흐름과 안내 메시지
 * - 비밀번호 초기화 확인 흐름과 안내 메시지
 * - 등록/수정 모달 진입(handleCreate/handleEdit)
 * - 검색어 변경과 조회/초기화 시 선택 해제
 * 를 검증한다. API 연동 계층(`clientUserApi`)은 mock으로 대체해 순수 조합 로직만 검증한다.
 */

import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientUserPage } from './useClientUserPage';
import {
  useClientUserQuery,
  useDeleteClientUsersMutation,
  useResetClientUserPasswordMutation,
  useSaveClientUserMutation,
} from '../api/clientUserApi';
import type { ClientUser } from '../types';

vi.mock('../api/clientUserApi', () => ({
  mapToClientUserModel: (item: ClientUser) => item,
  getClientUserAuthorityOptionsWithFallback: () => [],
  useClientUserAuthorityComboQuery: () => ({ data: undefined }),
  useClientUserQuery: vi.fn(),
  useDeleteClientUsersMutation: vi.fn(),
  useResetClientUserPasswordMutation: vi.fn(),
  useSaveClientUserMutation: vi.fn(),
}));

const MOCK_ROWS: ClientUser[] = [
  { id: 'admin001', sysId: 'admin001', userId: 'admin001', userName: '홍길동', authorityCode: 'ADMIN', authorityLabel: '관리자' },
  { id: 'staff001', sysId: 'staff001', userId: 'staff001', userName: '이철수', authorityCode: 'STAFF', authorityLabel: '스태프' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useClientUserPage', () => {
  beforeEach(() => {
    vi.mocked(useClientUserQuery).mockReturnValue({
      data: MOCK_ROWS,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);
    vi.mocked(useDeleteClientUsersMutation).mockReturnValue({
      mutateAsync: vi.fn(async () => ({})),
      isPending: false,
    });
    vi.mocked(useResetClientUserPasswordMutation).mockReturnValue({
      mutateAsync: vi.fn(async () => ({})),
      isPending: false,
    });
    vi.mocked(useSaveClientUserMutation).mockReturnValue({
      mutateAsync: vi.fn(async () => ({})),
      isPending: false,
    });
  });

  it('reflects query rows and status', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    expect(result.current.data.rows).toEqual(MOCK_ROWS);
    expect(result.current.status).toMatchObject({
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  it('reflects loading/error status from the query', () => {
    vi.mocked(useClientUserQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: true,
      error: new Error('네트워크 오류'),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    expect(result.current.data.rows).toEqual([]);
    expect(result.current.status.isLoading).toBe(true);
    expect(result.current.status.isFetching).toBe(true);
    expect(result.current.status.isError).toBe(true);
    expect(result.current.status.error).toBeInstanceOf(Error);
  });

  it('toggles row selection and select-all', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleToggleRow('admin001', true);
    });

    expect(result.current.uiProps.selectedRowIds.has('admin001')).toBe(true);
    expect(result.current.uiProps.selectedDeleteCount).toBe(1);

    act(() => {
      result.current.actions.handleToggleAll(true);
    });

    expect(result.current.uiProps.selectedRowIds.size).toBe(2);

    act(() => {
      result.current.actions.handleToggleAll(false);
    });

    expect(result.current.uiProps.selectedRowIds.size).toBe(0);
  });

  it('shows a notice instead of opening the delete confirm when nothing is selected', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleDelete();
    });

    expect(result.current.uiProps.isDeleteConfirmOpen).toBe(false);
    expect(result.current.uiProps.noticeState).toEqual({
      title: '안내',
      description: '항목을 먼저 선택해주세요.',
    });
  });

  it('deletes the selected rows, refreshes the list and shows a success notice', async () => {
    const mutateAsync = vi.fn(async () => ({}));
    vi.mocked(useDeleteClientUsersMutation).mockReturnValue({ mutateAsync, isPending: false });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleToggleRow('admin001', true);
    });

    act(() => {
      result.current.actions.handleDelete();
    });

    expect(result.current.uiProps.isDeleteConfirmOpen).toBe(true);

    await act(async () => {
      await result.current.actions.confirmDelete();
    });

    expect(mutateAsync).toHaveBeenCalledWith([MOCK_ROWS[0]]);
    expect(invalidateSpy).toHaveBeenCalled();
    expect(result.current.uiProps.isDeleteConfirmOpen).toBe(false);
    expect(result.current.uiProps.selectedRowIds.size).toBe(0);
    expect(result.current.uiProps.noticeState).toEqual({ title: '알림', description: '삭제되었습니다.' });
  });

  it('shows an error notice when deletion fails', async () => {
    const mutateAsync = vi.fn(async () => {
      throw new Error('삭제 실패');
    });
    vi.mocked(useDeleteClientUsersMutation).mockReturnValue({ mutateAsync, isPending: false });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleToggleRow('admin001', true);
    });

    act(() => {
      result.current.actions.handleDelete();
    });

    await act(async () => {
      await result.current.actions.confirmDelete();
    });

    expect(result.current.uiProps.isDeleteConfirmOpen).toBe(false);
    expect(result.current.uiProps.noticeState).toEqual({ title: '오류', description: '삭제 실패' });
  });

  it('resets the password and shows the default-password helper text', async () => {
    const mutateAsync = vi.fn(async () => ({}));
    vi.mocked(useResetClientUserPasswordMutation).mockReturnValue({ mutateAsync, isPending: false });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleResetPassword('admin001');
    });

    expect(result.current.uiProps.passwordResetTarget).toEqual({ sysId: 'admin001', userId: 'admin001' });

    await act(async () => {
      await result.current.actions.confirmResetPassword();
    });

    expect(mutateAsync).toHaveBeenCalledWith('admin001');
    expect(result.current.uiProps.passwordResetTarget).toBeNull();
    expect(result.current.uiProps.noticeState).toEqual({
      title: '알림',
      description: '비밀번호가 초기화되었습니다.',
      helperText: '초기 비밀번호는 SN111111 입니다.',
    });
  });

  it('shows an error notice when password reset fails', async () => {
    const mutateAsync = vi.fn(async () => {
      throw new Error('초기화 실패');
    });
    vi.mocked(useResetClientUserPasswordMutation).mockReturnValue({ mutateAsync, isPending: false });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleResetPassword('admin001');
    });

    await act(async () => {
      await result.current.actions.confirmResetPassword();
    });

    expect(result.current.uiProps.passwordResetTarget).toBeNull();
    expect(result.current.uiProps.noticeState).toEqual({ title: '오류', description: '초기화 실패' });
  });

  it('opens the create/edit modal with the expected mode', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleCreate();
    });

    expect(result.current.uiProps.editor.open).toBe(true);
    expect(result.current.uiProps.editor.isCreateMode).toBe(true);

    act(() => {
      result.current.actions.forceCloseEditorModal();
    });

    act(() => {
      result.current.actions.handleEdit('staff001');
    });

    expect(result.current.uiProps.editor.open).toBe(true);
    expect(result.current.uiProps.editor.isCreateMode).toBe(false);
    expect(result.current.uiProps.editor.editingRow).toEqual({
      id: 'staff001',
      sysId: 'staff001',
      userId: 'staff001',
      userName: '이철수',
      authorityCode: 'STAFF',
    });
  });

  it('clears selection and the applied keyword on search and reset', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleToggleRow('admin001', true);
      result.current.actions.handleKeywordChange('홍길동');
    });

    expect(result.current.uiProps.draftKeyword).toBe('홍길동');

    act(() => {
      result.current.actions.handleSearch();
    });

    await waitFor(() => {
      expect(result.current.uiProps.selectedRowIds.size).toBe(0);
    });

    act(() => {
      result.current.actions.handleToggleRow('admin001', true);
    });

    act(() => {
      result.current.actions.handleReset();
    });

    await waitFor(() => {
      expect(result.current.uiProps.draftKeyword).toBe('');
      expect(result.current.uiProps.selectedRowIds.size).toBe(0);
    });
  });

  it('clears the notice state on closeNotice', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClientUserPage(), { wrapper });

    act(() => {
      result.current.actions.handleDelete();
    });

    expect(result.current.uiProps.noticeState).not.toBeNull();

    act(() => {
      result.current.actions.closeNotice();
    });

    expect(result.current.uiProps.noticeState).toBeNull();
  });
});
