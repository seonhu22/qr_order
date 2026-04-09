/**
 * @fileoverview 관리자 관리 테이블 컴포넌트 테스트
 *
 * @description
 * - 기존 행의 아이디 입력 readonly 처리
 * - 신규 행의 아이디 입력 가능 상태
 * - 선택 행 스타일과 클릭 이벤트
 * - 필드 에러 상태 반영
 * 을 검증한다.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminUserTable } from './AdminUserTable';
import type { SelectOption } from '@/shared/components/input';
import type { AdminUserRow, AdminUserRowErrors } from '../types';

const plantOptions: SelectOption[] = [
  { value: 'PLANT-001', label: '본사' },
  { value: 'PLANT-002', label: '판교점' },
];

const rows: AdminUserRow[] = [
  {
    id: 'row-1',
    sysId: 'sys-1',
    userId: 'admin01',
    userName: '관리자 1',
    plantCd: 'PLANT-001',
    plantName: '본사',
    isNew: false,
  },
  {
    id: 'row-2',
    userId: '',
    userName: '',
    plantCd: '',
    plantName: '',
    isNew: true,
  },
];

const rowErrors: AdminUserRowErrors = {
  'row-1': { userId: false, userName: false, plantCd: false },
  'row-2': { userId: true, userName: true, plantCd: true },
};

const createProps = () => ({
  rows,
  selectedRowId: 'row-1',
  plantOptions,
  rowErrors,
  isLoading: false,
  isError: false,
  isSaving: false,
  isResettingPassword: false,
  onSelectRow: vi.fn(),
  onChangeRowField: vi.fn(),
  onChangeRowPlant: vi.fn(),
  onAddRow: vi.fn(),
  onDeleteRow: vi.fn(),
  onSave: vi.fn(),
  onResetPassword: vi.fn(),
});

describe('AdminUserTable', () => {
  it('renders existing userId as readonly and new row userId as editable', () => {
    const props = createProps();
    const { container } = render(<AdminUserTable {...props} />);

    const existingUserIdInput = screen.getByDisplayValue('admin01') as HTMLInputElement;
    const newUserIdInput = screen.getByPlaceholderText('아이디를 입력하세요') as HTMLInputElement;

    expect(existingUserIdInput).toHaveAttribute('readonly');
    expect(existingUserIdInput.closest('.admin-user-page__input--readonly')).toBeInTheDocument();
    expect(newUserIdInput).not.toHaveAttribute('readonly');

    const selectedRow = container.querySelector('tbody tr.is-selected');
    expect(selectedRow).toBeInTheDocument();
  });

  it('applies error state to invalid fields and calls row selection handler on click', () => {
    const props = createProps();
    const { container } = render(<AdminUserTable {...props} />);

    const newRowUserIdInput = screen.getByPlaceholderText('아이디를 입력하세요');
    const [, newRowUserNameInput] = screen.getAllByPlaceholderText('사용자 명을 입력하세요');
    const selectTrigger = screen.getByRole('button', { name: '사업장을 선택하세요' });

    expect(newRowUserIdInput.closest('.input-control')).toHaveAttribute('data-state', 'error');
    expect(newRowUserNameInput.closest('.input-control')).toHaveAttribute('data-state', 'error');
    expect(selectTrigger.closest('.select-control')).toHaveAttribute('data-state', 'error');

    const rowsInBody = container.querySelectorAll('tbody tr');
    fireEvent.click(rowsInBody[1]);

    expect(props.onSelectRow).toHaveBeenCalledWith('row-2');
  });
});
