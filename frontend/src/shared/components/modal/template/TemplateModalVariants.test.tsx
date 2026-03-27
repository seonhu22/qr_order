// src/shared/components/modal/template/TemplateModalVariants.test.tsx

/**
 * @fileoverview 완성형 템플릿 모달 래퍼 테스트
 *
 * @description
 * - NoticeConfirmModal, SaveConfirmModal, EditConfirmModal, DeleteConfirmModal의 고정 tone과 기본 타이틀 계약을 검증한다.
 *
 * @param {never} _unused 테스트 파일이므로 런타임 파라미터를 사용하지 않는다.
 * @example
 * npx vitest run src/shared/components/modal/template/TemplateModalVariants.test.tsx
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  NoticeConfirmModal,
  SaveConfirmModal,
} from '@/shared/components/modal';

describe('template modal wrappers', () => {
  it('renders NoticeConfirmModal with a single confirm button', () => {
    render(
      <NoticeConfirmModal
        open
        description="입력한 내용을 다시 확인해주세요."
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    expect(document.querySelector('.notice-modal__icon-wrapper--info')).toBeInTheDocument();
  });

  it('renders SaveConfirmModal with success tone', () => {
    render(
      <SaveConfirmModal
        open
        description="입력한 정보를 저장하시겠습니까?"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('저장 확인')).toBeInTheDocument();
    expect(document.querySelector('.confirm-modal__icon-wrapper--success')).toBeInTheDocument();
  });

  it('renders EditConfirmModal with edit tone', () => {
    render(
      <EditConfirmModal
        open
        description="선택한 정보를 수정하시겠습니까?"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('수정 확인')).toBeInTheDocument();
    expect(document.querySelector('.confirm-modal__icon-wrapper--edit')).toBeInTheDocument();
  });

  it('renders DeleteConfirmModal with danger tone', () => {
    render(
      <DeleteConfirmModal
        open
        description="선택한 항목을 삭제하시겠습니까?"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('삭제 확인')).toBeInTheDocument();
    expect(document.querySelector('.confirm-modal__icon-wrapper--danger')).toBeInTheDocument();
  });
});
