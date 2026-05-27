// src/shared/components/modal/template/DeleteConfirmModal.tsx

/**
 * @fileoverview 삭제 확인용 완성형 모달 컴포넌트
 *
 * @description
 * - ConfirmModal을 기반으로 삭제 시나리오에 맞는 기본 title, tone, primary label을 제공한다.
 * - 아이콘은 ConfirmModal 내부의 공용 `Icon` 컴포넌트를 사용한다.
 *
 * @param {DeleteConfirmModalProps} props 삭제 확인 모달 렌더링에 필요한 속성
 * @param {string} [props.title='삭제 확인'] 모달 제목
 * @param {import('../base/modalType').ConfirmPrimaryAction} [props.primaryAction] 삭제 버튼 설정
 * @returns {JSX.Element}
 *
 * @example
 * <DeleteConfirmModal
 *   open={open}
 *   description="선택한 항목을 삭제하시겠습니까?"
 *   onClose={() => setOpen(false)}
 * />
 */

import { ConfirmModal } from './ConfirmModal';
import type { ConfirmModalProps } from '../base/modalType';

export type DeleteConfirmModalProps = Omit<ConfirmModalProps, 'tone'>;

export function DeleteConfirmModal({
  title = '삭제 확인',
  primaryAction,
  ...rest
}: DeleteConfirmModalProps) {
  return (
    <ConfirmModal {...rest} tone="danger" title={title} primaryAction={{ ...primaryAction }} />
  );
}
