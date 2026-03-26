// src/shared/components/modal/template/NoticeModal.test.tsx

/**
 * @fileoverview NoticeModal 컴포넌트 테스트
 *
 * @description
 * - 1버튼 안내형 구조와 tone별 icon wrapper class를 검증한다.
 *
 * @param {never} _unused 테스트 파일이므로 런타임 파라미터를 사용하지 않는다.
 * @example
 * npx vitest run src/shared/components/modal/template/NoticeModal.test.tsx
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoticeModal } from '@/shared/components/modal';

describe('NoticeModal', () => {
  it('renders a single confirm action and no secondary action', () => {
    render(
      <NoticeModal
        open
        tone="info"
        title="안내"
        description="입력한 내용을 다시 확인해주세요."
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    expect(document.querySelector('.notice-modal__icon-wrapper--info')).toBeInTheDocument();
  });
});
