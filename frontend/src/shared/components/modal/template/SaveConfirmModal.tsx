// src/shared/components/modal/template/SaveConfirmModal.tsx

/**
 * @fileoverview 저장 확인용 완성형 모달 컴포넌트
 *
 * @description
 * - ConfirmModal을 기반으로 저장 시나리오에 맞는 기본 title, tone, primary label을 제공한다.
 * - 아이콘은 ConfirmModal 내부의 공용 `Icon` 컴포넌트를 사용한다.
 *
 * @param {SaveConfirmModalProps} props 저장 확인 모달 렌더링에 필요한 속성
 * @param {string} [props.title='저장 확인'] 모달 제목
 * @param {import('../base/modalType').ConfirmPrimaryAction} [props.primaryAction] 저장 버튼 설정
 * @returns {JSX.Element}
 *
 * @example
 * <SaveConfirmModal
 *   open={open}
 *   description="입력한 정보를 저장하시겠습니까?"
 *   onClose={() => setOpen(false)}
 * />
 */

import { ConfirmModal } from './ConfirmModal';
import type { ConfirmModalProps } from '../base/modalType';

export type SaveConfirmModalProps = Omit<ConfirmModalProps, 'tone'>;

export function SaveConfirmModal({
  title = '저장 확인',
  primaryAction,
  ...rest
}: SaveConfirmModalProps) {
  return (
    <ConfirmModal
      {...rest}
      tone="success"
      title={title}
      primaryAction={{ label: '확인', ...primaryAction }}
    />
  );
}
