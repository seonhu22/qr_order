// src/shared/components/modal/template/NoticeConfirmModal.tsx

/**
 * @fileoverview 안내 확인용 완성형 모달 컴포넌트
 *
 * @description
 * - NoticeModal을 기반으로 안내 확인 시나리오에 맞는 기본 title, tone, primary label을 제공한다.
 * - 아이콘은 NoticeModal 내부의 공용 `Icon` 컴포넌트를 사용한다.
 *
 * @param {NoticeConfirmModalProps} props 안내 확인 모달 렌더링에 필요한 속성
 * @param {string} [props.title='안내'] 모달 제목
 * @param {import('../base/modalType').ModalPrimaryAction} [props.primaryAction] 확인 버튼 설정
 * @returns {JSX.Element}
 *
 * @example
 * <NoticeConfirmModal
 *   open={open}
 *   description="입력한 내용을 다시 확인해주세요."
 *   onClose={() => setOpen(false)}
 * />
 */

import { NoticeModal } from './NoticeModal';
import type { NoticeModalProps } from '../base/modalType';

export type NoticeConfirmModalProps = Omit<NoticeModalProps, 'tone'>;

export function NoticeConfirmModal({
  title = '안내',
  primaryAction,
  ...rest
}: NoticeConfirmModalProps) {
  return (
    <NoticeModal
      {...rest}
      tone="info"
      title={title}
      primaryAction={{ label: '확인', ...primaryAction }}
    />
  );
}
