// src/shared/components/modal/template/ConfirmModal.test.tsx

/**
 * @fileoverview ConfirmModal 컴포넌트 테스트
 *
 * @description
 * - 2버튼 고정 구조와 tone별 icon wrapper class, 기본 라벨 규칙을 검증한다.
 *
 * @param {never} _unused 테스트 파일이므로 런타임 파라미터를 사용하지 않는다.
 * @example
 * npx vitest run src/shared/components/modal/template/ConfirmModal.test.tsx
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '@/shared/components/modal';

describe('ConfirmModal', () => {
  it('renders two fixed actions and a danger tone icon wrapper', () => {
    render(
      <ConfirmModal
        open
        tone="danger"
        title="알림"
        description="선택한 항목을 삭제하시겠습니까?"
        primaryAction={{ onClick: vi.fn() }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.getByText('선택한 항목을 삭제하시겠습니까?')).toBeInTheDocument();
    expect(document.querySelector('.confirm-modal__icon-wrapper--danger')).toBeInTheDocument();
  });

  it('uses onClose as the fallback handler for the secondary action', () => {
    const onClose = vi.fn();

    render(
      <ConfirmModal
        open
        title="알림"
        description="정말 진행하시겠습니까?"
        primaryAction={{ onClick: vi.fn() }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
