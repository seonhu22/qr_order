/**
 * @fileoverview 관리자 관리 목록 상태 훅 테스트
 *
 * @description
 * - baseRows / draftRows 분리
 * - 필수값 검증
 * - 행 추가/삭제
 * - 사업장 선택 반영
 * 를 검증한다.
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminUserListState } from './useAdminUserListState';
import type { AdminUserRow } from '../types';
import type { SelectOption } from '@/shared/components/input';

const baseRows: AdminUserRow[] = [
  {
    id: 'row-1',
    sysId: 'sys-1',
    userId: 'admin01',
    userName: '관리자 1',
    plantCd: 'PLANT-001',
    plantName: '본사',
    isNew: false,
  },
];

const plantOptions: SelectOption[] = [
  { value: 'PLANT-001', label: '본사' },
  { value: 'PLANT-002', label: '판교점' },
];

describe('useAdminUserListState', () => {
  it('uses baseRows as the initial source of truth and starts clean', () => {
    const { result } = renderHook(() =>
      useAdminUserListState({
        baseRows,
        plantOptions,
      }),
    );

    expect(result.current.rows).toEqual(baseRows);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.selectedRowId).toBe('');
  });

  it('adds a new row, validates required fields, and updates plant info from options', () => {
    const { result } = renderHook(() =>
      useAdminUserListState({
        baseRows,
        plantOptions,
      }),
    );

    act(() => {
      result.current.addRow();
    });

    const newRow = result.current.rows.find((row) => row.isNew);

    expect(newRow).toBeDefined();
    expect(result.current.isDirty).toBe(true);
    expect(result.current.selectedRowId).toBe(newRow?.id);

    act(() => {
      expect(result.current.validateRequiredFields()).toBe(false);
    });

    expect(result.current.rowErrors[newRow!.id]).toEqual({
      userId: true,
      userName: true,
      plantCd: true,
    });

    act(() => {
      result.current.changeRowField(newRow!.id, 'userId', 'new-admin');
      result.current.changeRowField(newRow!.id, 'userName', '신규 관리자');
      result.current.changeRowPlant(newRow!.id, 'PLANT-002');
    });

    const updatedNewRow = result.current.rows.find((row) => row.id === newRow!.id);

    expect(updatedNewRow).toMatchObject({
      userId: 'new-admin',
      userName: '신규 관리자',
      plantCd: 'PLANT-002',
      plantName: '판교점',
    });
    expect(result.current.rowErrors[newRow!.id]).toEqual({
      userId: false,
      userName: false,
      plantCd: false,
    });
  });

  it('deletes the selected row and clears selection', () => {
    const { result } = renderHook(() =>
      useAdminUserListState({
        baseRows,
        plantOptions,
      }),
    );

    act(() => {
      result.current.selectRow('row-1');
    });

    expect(result.current.selectedRowId).toBe('row-1');

    let deleted = false;
    act(() => {
      deleted = result.current.deleteSelectedRow();
    });

    expect(deleted).toBe(true);
    expect(result.current.rows).toEqual([]);
    expect(result.current.selectedRowId).toBe('');
    expect(result.current.isDirty).toBe(true);
  });
});
