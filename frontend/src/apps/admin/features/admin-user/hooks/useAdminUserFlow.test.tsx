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
  draftKeyword: '판교',
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
  it('shows a dirty confirmation modal before search and applies search after confirm', async () => {
    const params = createParams({ isDirty: true });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestSearch();
    });

    expect(result.current.state.simpleModalState?.description).toBe('조회하시겠습니까?');
    expect(result.current.state.simpleModalState?.helperText).toBe('저장되지 않은 내용이 있습니다.');

    await act(async () => {
      await result.current.confirmSimpleModal();
    });

    expect(params.onApplySearch).toHaveBeenCalledWith('판교');
    expect(params.onResetDraftRows).toHaveBeenCalledTimes(1);
  });

  it('opens wrapper modal when required field validation fails on save', () => {
    const params = createParams({
      onValidateRequiredFields: vi.fn(() => false),
    });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestSave();
    });

    expect(result.current.state.wrapperModalState).toEqual({
      title: '안내',
      description: '필수 항목을 모두 입력해주세요.',
    });
    expect(result.current.state.isSaveConfirmOpen).toBe(false);
  });

  it('opens save confirm first and shows success notice after confirm', async () => {
    const params = createParams();
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

  it('shows unsaved warning before password reset and resets after confirm', async () => {
    const params = createParams({
      isDirty: true,
    });
    const { result } = renderHook(() => useAdminUserFlow(params));

    act(() => {
      result.current.requestResetPassword('admin01');
    });

    expect(result.current.state.simpleModalState?.description).toBe('초기화하겠습니까?');
    expect(result.current.state.simpleModalState?.helperText).toBe('저장되지 않은 내용이 있습니다.');

    await act(async () => {
      await result.current.confirmSimpleModal();
    });

    expect(params.onResetPassword).toHaveBeenCalledWith('admin01');
    expect(result.current.state.simpleModalState).toEqual({
      description: '저장되었습니다.',
      helperText: '초기 비밀번호는 SN111111 입니다.',
    });
  });
});
