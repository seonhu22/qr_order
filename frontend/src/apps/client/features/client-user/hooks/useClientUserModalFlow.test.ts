/**
 * @fileoverview 매장 유저 등록/수정 모달 플로우 훅 테스트
 *
 * @description
 * - 등록/수정 모달 진입 시 초기 상태
 * - 필수값 검증과 필드 변경 시 에러 초기화
 * - 변경 없는 수정 시 안내, 변경된 수정/등록 시 저장 확인
 * - 저장 성공/실패 흐름
 * - 변경 내용 경고(닫기) 흐름
 * 을 검증한다.
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useClientUserModalFlow } from './useClientUserModalFlow';
import type { ClientUser } from '../types';

const sampleUser: ClientUser = {
  id: 'row-1',
  sysId: 'sys-1',
  userId: 'staff001',
  userName: '이철수',
  authorityCode: 'STAFF',
  authorityLabel: '스태프',
};

const createParams = (overrides?: Partial<Parameters<typeof useClientUserModalFlow>[0]>) => ({
  onSaveRow: vi.fn(async () => {}),
  onNotice: vi.fn(),
  ...overrides,
});

describe('useClientUserModalFlow', () => {
  it('opens the create modal with an empty, writable row', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isEditorOpen).toBe(true);
    expect(result.current.isCreateMode).toBe(true);
    expect(result.current.isUserIdReadonly).toBe(false);
    expect(result.current.editingRow).toEqual({ id: '', userId: '', userName: '', authorityCode: '' });
    expect(result.current.isDirty).toBe(false);
  });

  it('opens the edit modal with the target row and a readonly userId', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    expect(result.current.isEditorOpen).toBe(true);
    expect(result.current.isCreateMode).toBe(false);
    expect(result.current.isUserIdReadonly).toBe(true);
    expect(result.current.editingRow).toEqual({
      id: 'row-1',
      sysId: 'sys-1',
      userId: 'staff001',
      userName: '이철수',
      authorityCode: 'STAFF',
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('flags empty required fields on save and clears them as the user fills them in', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openCreateModal();
    });

    act(() => {
      result.current.requestSave();
    });

    expect(result.current.editorErrors).toEqual({ userId: true, userName: true, authorityCode: true });
    expect(result.current.isSaveConfirmOpen).toBe(false);

    act(() => {
      result.current.changeEditingField('userId', 'new001');
    });

    expect(result.current.editorErrors.userId).toBe(false);
    expect(result.current.editingRow?.userId).toBe('new001');
  });

  it('notifies that nothing changed when saving an edit row without modifications', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.requestSave();
    });

    expect(params.onNotice).toHaveBeenCalledWith({ title: '알림', description: '변경된 내용이 없습니다.' });
    expect(result.current.isSaveConfirmOpen).toBe(false);
  });

  it('opens the save confirm when an edited row is dirty and valid', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.changeEditingField('userName', '이철수수정');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.requestSave();
    });

    expect(result.current.isSaveConfirmOpen).toBe(true);
    expect(params.onNotice).not.toHaveBeenCalled();
  });

  it('saves successfully and resets the editor with a success notice', async () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.changeEditingField('userName', '이철수수정');
    });

    act(() => {
      result.current.requestSave();
    });

    await act(async () => {
      await result.current.confirmSave();
    });

    expect(params.onSaveRow).toHaveBeenCalledWith(
      { id: 'row-1', sysId: 'sys-1', userId: 'staff001', userName: '이철수수정', authorityCode: 'STAFF' },
      false,
    );
    expect(result.current.isSaveConfirmOpen).toBe(false);
    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingRow).toBeNull();
    expect(params.onNotice).toHaveBeenCalledWith({ title: '알림', description: '저장되었습니다.' });
  });

  it('keeps the editor open and shows an error notice when saving fails', async () => {
    const params = createParams({
      onSaveRow: vi.fn(async () => {
        throw new Error('서버 오류');
      }),
    });
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.changeEditingField('userName', '이철수수정');
    });

    act(() => {
      result.current.requestSave();
    });

    await act(async () => {
      await result.current.confirmSave();
    });

    expect(result.current.isSaveConfirmOpen).toBe(false);
    expect(result.current.isEditorOpen).toBe(true);
    expect(params.onNotice).toHaveBeenCalledWith({ title: '오류', description: '서버 오류' });
  });

  it('opens a dirty warning instead of closing when the form has unsaved changes', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.changeEditingField('userName', '이철수수정');
    });

    act(() => {
      result.current.closeEditorModal();
    });

    expect(result.current.isDirtyWarningOpen).toBe(true);
    expect(result.current.isEditorOpen).toBe(true);

    act(() => {
      result.current.forceCloseEditorModal();
    });

    expect(result.current.isDirtyWarningOpen).toBe(false);
    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingRow).toBeNull();
  });

  it('closes immediately when the form has no unsaved changes', () => {
    const params = createParams();
    const { result } = renderHook(() => useClientUserModalFlow(params));

    act(() => {
      result.current.openEditModal(sampleUser);
    });

    act(() => {
      result.current.closeEditorModal();
    });

    expect(result.current.isDirtyWarningOpen).toBe(false);
    expect(result.current.isEditorOpen).toBe(false);
  });
});
