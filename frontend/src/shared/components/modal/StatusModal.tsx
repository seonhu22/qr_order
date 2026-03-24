// src/shared/components/modal/StatusModal.tsx

/**
 * @fileoverview 상태 전달용 완성형 모달 컴포넌트
 *
 * @description
 * - WrapperModal의 `layout="notice"` 조합을 사용하는 상태 전달용 완성형 모달이다.
 * - 저장, 수정, 확인, 삭제 같은 상태 메시지를 일관된 UI로 보여주기 위한 출발점이다.
 * - 현재는 정보형 아이콘과 단일 확인 버튼을 기본 제공하며, 추후 variant와 공용 버튼 컴포넌트로 확장한다.
 *
 * @example
 * <StatusModal
 *   open={open}
 *   title="안내"
 *   description={"비밀번호를 5번이상 틀리셨습니다.\n관리자에게 문의해주세요."}
 *   onClose={() => setOpen(false)}
 * />
 */

import { WrapperModal } from './WrapperModal';
import { StatusInfoIcon } from '@/shared/components/icon';
import type { StatusModalProps } from './modalType';
import './StatusModal.css';

/**
 * 상태 전달용 모달을 렌더링한다.
 *
 * @param {StatusModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
 * @param {string} [props.title='안내'] 모달 제목
 * @param {string} [props.description] 본문 설명 텍스트
 * @param {string} [props.primaryLabel='확인'] 확인 버튼 라벨
 * @param {() => void} props.onClose 모달 닫기 핸들러
 * @param {() => void} [props.onConfirm] 확인 버튼 클릭 핸들러
 * @returns {JSX.Element | null} 모달이 열려 있으면 다이얼로그를, 닫혀 있으면 null을 반환한다.
 */
export function StatusModal({
  open,
  title = '안내',
  description,
  primaryLabel = '확인',
  size = 'sm',
  onClose,
  onConfirm,
}: StatusModalProps) {
  return (
    <WrapperModal
      actions="single"
      icon={
        <div className="status-modal__icon-wrapper status-modal__icon-wrapper--info">
          <StatusInfoIcon className="status-modal__icon-svg" />
        </div>
      }
      noticeTopPadding
      layout="notice"
      open={open}
      primaryLabel={primaryLabel}
      size={size}
      title={title}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {description ? <p className="status-modal__description">{description}</p> : null}
    </WrapperModal>
  );
}
