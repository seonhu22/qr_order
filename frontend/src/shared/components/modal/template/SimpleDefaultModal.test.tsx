// src/shared/components/modal/template/SimpleDefaultModal.test.tsx

/**
 * @fileoverview SimpleDefaultModal 컴포넌트 테스트
 *
 * @description
 * - default 레이아웃 기반 안내 모달의 기본 버튼과 helperText 렌더링을 검증한다.
 *
 * @example
 * npx vitest run src/shared/components/modal/template/SimpleDefaultModal.test.tsx
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimpleDefaultModal } from '@/shared/components/modal';

describe('SimpleDefaultModal', () => {
  it('renders title, description, helperText and a single confirm button', () => {
    render(
      <SimpleDefaultModal
        open
        title="안내"
        description="항목을 먼저 선택해주세요."
        helperText="삭제할 행을 선택 및 체크박스로 선택 후 진행하세요."
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('안내')).toBeInTheDocument();
    expect(screen.getByText('항목을 먼저 선택해주세요.')).toBeInTheDocument();
    expect(
      screen.getByText('삭제할 행을 선택 및 체크박스로 선택 후 진행하세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
  });

  it('uses onClose as the default confirm action handler', () => {
    const onClose = vi.fn();

    render(
      <SimpleDefaultModal open title="알림" description="저장되었습니다." onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render helperText when helperText is not provided', () => {
    const { container } = render(
      <SimpleDefaultModal open title="알림" description="저장되었습니다." onClose={() => {}} />,
    );

    expect(container.querySelector('.base-modal__notice-meta')).not.toBeInTheDocument();
  });

  it('uses primaryAction.onClick instead of onClose when provided', () => {
    const onClose = vi.fn();
    const onPrimaryClick = vi.fn();

    render(
      <SimpleDefaultModal
        open
        title="알림"
        description="저장되었습니다."
        primaryAction={{
          onClick: onPrimaryClick,
        }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders and uses secondaryAction when provided', () => {
    const onSecondaryClick = vi.fn();

    render(
      <SimpleDefaultModal
        open
        title="알림"
        description="저장되었습니다."
        secondaryAction={{
          onClick: onSecondaryClick,
        }}
        onClose={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when open is false', () => {
    render(
      <SimpleDefaultModal
        open={false}
        title="알림"
        description="저장되었습니다."
        onClose={() => {}}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('알림')).not.toBeInTheDocument();
  });
});
