// src/shared/components/modal/template/NoticeModal.tsx

/**
 * @fileoverview 안내형 완성 모달 컴포넌트
 *
 * @description
 * - WrapperModal의 `layout="notice"` 조합을 사용하는 1버튼 안내 모달이다.
 * - 안내, 성공, 수정 같은 단일 확인 흐름에 사용한다.
 * - tone에 따라 아이콘과 컨테이너 색상, 기본 버튼 variant를 바꾼다.
 *
 * @example
 * <NoticeModal
 *   open={open}
 *   tone="info"
 *   title="안내"
 *   description="비밀번호를 5번 이상 틀리셨습니다."
 *   onClose={() => setOpen(false)}
 * />
 */

import { Icon } from '@/shared/assets/icons/Icon';
import { WrapperModal } from '../wrapper/WrapperModal';
import { CONFIRM_MODAL_ICON_MAP } from '../base/modal.constants';
import type { NoticeModalProps } from '../base/modalType';
import './ConfirmModal.css';

/**
 * 안내형 완성 모달을 렌더링한다.
 *
 * @param {NoticeModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
 * @param {string} [props.title='안내'] 모달 제목
 * @param {string} [props.description] 본문 설명 텍스트
 * @param {'info' | 'success' | 'danger' | 'edit'} [props.tone='info'] 안내 모달 종류
 * @param {{ label?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; variant?: 'primary' | 'danger' }} [props.primaryAction] 확인 버튼 설정
 * @param {() => void} props.onClose 모달 닫기 핸들러
 * @returns {JSX.Element | null} 모달이 열려 있으면 다이얼로그를, 닫혀 있으면 null을 반환한다.
 *
 * @example
 * <NoticeModal open title="저장 완료" onClose={() => {}} />
 */
export function NoticeModal({
  open,
  title = '안내',
  description,
  tone = 'info',
  size = 'sm',
  primaryAction,
  onClose,
}: NoticeModalProps) {
  const resolvedPrimaryAction = {
    label: '확인',
    variant: tone === 'danger' ? 'danger' : 'primary',
    ...primaryAction,
  } as const;

  return (
    <WrapperModal
      icon={
        <div className={`notice-modal__icon-wrapper notice-modal__icon-wrapper--${tone}`}>
          <Icon className="notice-modal__icon-svg" id={CONFIRM_MODAL_ICON_MAP[tone]} size={28} />
        </div>
      }
      layout="notice"
      open={open}
      primaryAction={resolvedPrimaryAction}
      size={size}
      title={title}
      onClose={onClose}
    >
      {description ? <p className="notice-modal__description">{description}</p> : null}
    </WrapperModal>
  );
}
