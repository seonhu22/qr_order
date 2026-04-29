/**
 * @fileoverview 관리자 관리 공통 flow 훅 테스트
 *
 * @description
 * - dirty 조회 확인
 * - 저장 전 검증 실패
 * - 저장 성공 안내
 * - 비밀번호 초기화 흐름
 * 을 검증한다.
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAdminUserFlow } from './useAdminUserFlow';

const createParams = (overrides?: Partial<Parameters<typeof useAdminUserFlow>[0]>) => ({
  isDirty: false,
  selectedRowId: 'row-1',
  onApplySearch: vi.fn(),
  onResetFilters: vi.fn(),
  onResetDraftRows: vi.fn(),
  onDeleteSelectedRow: vi.fn(),
  onValidateRequiredFields: vi.fn(() => true),
  onSaveChanges: vi.fn(async () => 'saved' as const),
  onResetPassword: vi.fn(async () => {}),
  ...overrides,
});

describe('useAdminUserFlow', () => {
  it('sets pendingFilterAction to search when dirty and applies search after confirm', () => {
    const params = createParams({ isDirty: true });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestSearch();
    });

    expect(result.current.state.pendingFilterAction).toBe('search');

    act(() => {
      result.current.confirmFilterAction();
    });

    expect(params.onApplySearch).toHaveBeenCalledTimes(1);
    expect(params.onResetDraftRows).toHaveBeenCalledTimes(1);
    expect(result.current.state.pendingFilterAction).toBeNull();
  });

  it('does not open save confirm when required field validation fails', () => {
    const params = createParams({
      onValidateRequiredFields: vi.fn(() => false),
    });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestSave();
    });

    // 필수값 미입력 시 모달 없이 input error 스타일만 표시
    expect(result.current.state.isSaveConfirmOpen).toBe(false);
    expect(result.current.state.simpleModalState).toBeNull();
  });

  it('opens save confirm first and shows success notice after confirm', async () => {
    const params = createParams({ isDirty: true });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestSave();
    });

    expect(result.current.state.isSaveConfirmOpen).toBe(true);

    await act(async () => {
      await result.current.confirmSave();
    });

    expect(params.onSaveChanges).toHaveBeenCalledTimes(1);
    expect(result.current.state.isSaveConfirmOpen).toBe(false);
    expect(result.current.state.simpleModalState).toEqual({
      description: '저장되었습니다.',
      helperText: '초기 비밀번호는 SN111111 입니다.',
    });
  });

  it('shows user id password reset confirm and resets after confirm', async () => {
    const params = createParams({
      isDirty: true,
    });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestResetPassword('admin01');
    });

    expect(result.current.state.simpleModalState?.type).toBe('passwordResetConfirm');
    expect(result.current.state.simpleModalState?.userId).toBe('admin01');
    expect(result.current.state.simpleModalState?.description).toBe('admin01 비밀번호를 초기화 하시겠습니까?');
    expect(result.current.state.simpleModalState?.helperText).toBeUndefined();

    await act(async () => {
      await result.current.confirmSimpleModal();
    });

    expect(params.onResetPassword).toHaveBeenCalledWith('admin01');
    expect(result.current.state.simpleModalState).toEqual({
      description: '비밀번호가 초기화되었습니다.',
      helperText: '초기 비밀번호는 SN111111 입니다.',
    });
  });
});
