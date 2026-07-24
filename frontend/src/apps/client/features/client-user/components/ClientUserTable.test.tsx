/**
 * @fileoverview 클라이언트 유저 정보 목록 테이블 컴포넌트 테스트
 *
 * @description
 * - 로딩/에러 상태 표시(TableCardContentState 연동)
 * - 행 데이터(권한 배지 포함) 렌더링과 빈 목록 메시지
 * - 전체/행 선택 체크박스와 삭제 버튼 활성화 조건
 * - 신규/삭제/비밀번호 초기화/수정 액션 콜백 호출
 * 을 검증한다.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientUserTable } from './ClientUserTable';
import type { ClientUser } from '../types';

const rows: ClientUser[] = [
  {
    id: 'admin001',
    sysId: 'admin001',
    userId: 'admin001',
    userName: '홍길동',
    authorityCode: '01',
    authorityLabel: '관리자',
  },
  {
    id: 'staff001',
    sysId: 'staff001',
    userId: 'staff001',
    userName: '이철수',
    authorityCode: '02',
    authorityLabel: '스태프',
  },
];

const createProps = () => ({
  rows,
  selectedRowIds: new Set<string>(),
  isLoading: false,
  isError: false,
  onToggleRow: vi.fn(),
  onToggleAll: vi.fn(),
  onCreate: vi.fn(),
  onDelete: vi.fn(),
  onResetPassword: vi.fn(),
  onEdit: vi.fn(),
});

describe('ClientUserTable', () => {
  it('shows the loading feedback while the list is being fetched', () => {
    render(<ClientUserTable {...createProps()} isLoading />);

    expect(screen.getByText('유저 정보 목록을 불러오는 중입니다.')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
  });

  it('shows the error feedback when the query fails', () => {
    render(<ClientUserTable {...createProps()} isError />);

    expect(screen.getByText('불러오는데 실패했습니다')).toBeInTheDocument();
    expect(screen.getByText('다시 한번 시도해주세요.')).toBeInTheDocument();
  });

  it('renders rows with authority labels', () => {
    render(<ClientUserTable {...createProps()} />);

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
    expect(screen.getByText('이철수')).toBeInTheDocument();
    expect(screen.getByText('스태프')).toBeInTheDocument();
  });

  it('shows the empty message when there are no rows', () => {
    render(<ClientUserTable {...createProps()} rows={[]} />);

    expect(screen.getByText('조회된 유저가 없습니다.')).toBeInTheDocument();
  });

  it('disables the delete button until a row is selected', () => {
    const props = createProps();
    const { rerender } = render(<ClientUserTable {...props} />);

    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();

    rerender(<ClientUserTable {...props} selectedRowIds={new Set(['admin001'])} />);

    expect(screen.getByRole('button', { name: '삭제' })).not.toBeDisabled();
  });

  it('calls onCreate / onDelete when the header action buttons are clicked', () => {
    const props = createProps();
    render(<ClientUserTable {...props} selectedRowIds={new Set(['admin001'])} />);

    fireEvent.click(screen.getByRole('button', { name: '신규' }));
    expect(props.onCreate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('toggles select-all and individual row checkboxes', () => {
    const props = createProps();
    const { container } = render(<ClientUserTable {...props} />);

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);

    fireEvent.click(checkboxes[0]);
    expect(props.onToggleAll).toHaveBeenCalledWith(true);

    fireEvent.click(checkboxes[1]);
    expect(props.onToggleRow).toHaveBeenCalledWith('admin001', true);
  });

  it('calls onResetPassword and onEdit from row action buttons', () => {
    const props = createProps();
    render(<ClientUserTable {...props} />);

    const resetButtons = screen.getAllByRole('button', { name: '초기화' });
    fireEvent.click(resetButtons[0]);
    expect(props.onResetPassword).toHaveBeenCalledWith('admin001');

    fireEvent.click(screen.getByRole('button', { name: 'staff001 수정' }));
    expect(props.onEdit).toHaveBeenCalledWith('staff001');
  });
});
