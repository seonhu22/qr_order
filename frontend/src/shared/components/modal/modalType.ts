// frontend/src/shared/components/modal/types.ts
// 모달 컴포넌트에서 사용되는 타입들을 정의하는 파일입니다.

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/* =====================================================
 * BaseModal Props
 * ===================================================== */

/**
 * 베이스 모달(BaseModal) Props
 */
export interface BaseModalProps {
  /** 모달 노출 여부 */
  open: boolean;
  /** 모달 제목 (기본: '알림') */
  title?: string;
  /** 확인 버튼 라벨 (기본: '확인') */
  primaryLabel?: string;
  /** 본문 1차 설명 */
  primaryDescription?: string;
  /** 본문 2차 설명 — 빈 문자열/undefined는 렌더링하지 않음 */
  secondaryDescription?: string;
  /** 오버레이 클릭 닫기 허용 여부 (기본: true) */
  closeOnOverlayClick?: boolean;
  /** 모달 크기 (기본: 'sm') */
  size?: ModalSize;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 확인 버튼 핸들러 — 미지정 시 onClose fallback */
  onConfirm?: () => void;
}
