// src/shared/components/modal/StatusModal.tsx

/**
 * @fileoverview 상태 전달용 완성형 모달 컴포넌트
 *
 * @description
 * - WrapperModal의 `layout="notice"` 조합을 사용하는 상태 전달용 완성형 모달이다.
 * - StatusModal은 2버튼 구조로 고정하고, tone에 따라 아이콘과 컨테이너 색상, 기본 버튼 variant만 바꾼다.
 *
 * @example
 * <StatusModal
 *   open={open}
 *   tone="danger"
 *   title="삭제 확인"
 *   description="선택한 항목을 삭제하시겠습니까?"
 *   onClose={() => setOpen(false)}
 *   primaryAction={{ label: '삭제', onClick: handleDelete, variant: 'danger' }}
 * />
 */

import { Icon } from '@/shared/assets/icons/Icon';
import { WrapperModal } from './WrapperModal';
import { STATUS_MODAL_ICON_MAP } from './modal.constants';
import type { StatusModalProps } from './modalType';
import './StatusModal.css';

/**
 * 상태 전달용 모달을 렌더링한다.
 *
 * @param {StatusModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
 * @param {string} [props.title='안내'] 모달 제목
 * @param {string} [props.description] 본문 설명 텍스트
 * @param {'info' | 'success' | 'danger' | 'error'} [props.tone='info'] 상태 모달 종류
 * @param {{ disabled?: boolean; loading?: boolean; onClick?: () => void }} [props.primaryAction] 확인 버튼 설정
 * @param {{ disabled?: boolean; loading?: boolean; onClick?: () => void }} [props.secondaryAction] 닫기 버튼 설정
 * @param {() => void} props.onClose 모달 닫기 핸들러
 * @returns {JSX.Element | null} 모달이 열려 있으면 다이얼로그를, 닫혀 있으면 null을 반환한다.
 */
export function StatusModal({
  open,
  title = '안내',
  description,
  tone = 'info',
  size = 'sm',
  primaryAction,
  secondaryAction,
  onClose,
}: StatusModalProps) {
  const resolvedPrimaryAction = {
    label: '확인',
    variant: tone === 'danger' ? 'danger' : 'primary',
    ...primaryAction,
  } as const;

  const resolvedSecondaryAction = {
    label: '닫기',
    variant: 'secondary',
    onClick: onClose,
    ...secondaryAction,
  } as const;

  return (
    <WrapperModal
      icon={
        <div className={`status-modal__icon-wrapper status-modal__icon-wrapper--${tone}`}>
          <Icon className="status-modal__icon-svg" id={STATUS_MODAL_ICON_MAP[tone]} size={28} />
        </div>
      }
      layout="notice"
      open={open}
      primaryAction={resolvedPrimaryAction}
      secondaryAction={resolvedSecondaryAction}
      size={size}
      title={title}
      onClose={onClose}
    >
      {description ? <p className="status-modal__description">{description}</p> : null}
    </WrapperModal>
  );
}
