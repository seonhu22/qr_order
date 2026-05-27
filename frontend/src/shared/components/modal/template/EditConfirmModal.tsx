// src/shared/components/modal/template/EditConfirmModal.tsx

/**
 * @fileoverview 수정 확인용 완성형 모달 컴포넌트
 *
 * @description
 * - ConfirmModal을 기반으로 수정 시나리오에 맞는 기본 title, tone, primary label을 제공한다.
 * - 아이콘은 ConfirmModal 내부의 공용 `Icon` 컴포넌트를 사용한다.
 *
 * @param {EditConfirmModalProps} props 수정 확인 모달 렌더링에 필요한 속성
 * @param {string} [props.title='수정 확인'] 모달 제목
 * @param {import('../base/modalType').ConfirmPrimaryAction} [props.primaryAction] 확인 버튼 설정
 * @returns {JSX.Element}
 *
 * @example
 * <EditConfirmModal
 *   open={open}
 *   description="변경사항을 수정하시겠습니까?"
 *   onClose={() => setOpen(false)}
 * />
 */

import { ConfirmModal } from './ConfirmModal';
import type { ConfirmModalProps } from '../base/modalType';

export type EditConfirmModalProps = Omit<ConfirmModalProps, 'tone'>;

export function EditConfirmModal({
  title = '수정 확인',
  primaryAction,
  ...rest
}: EditConfirmModalProps) {
  return (
    <ConfirmModal
      {...rest}
      tone="edit"
      title={title}
      primaryAction={{ label: '확인', ...primaryAction }}
    />
  );
}
