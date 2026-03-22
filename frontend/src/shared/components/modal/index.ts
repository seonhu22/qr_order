/**
 * @fileoverview Modal 계열 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 * - BaseModal 컴포넌트와 modalType 타입을 함께 재내보내기
 *
 * @example
 * // 일반 사용
 * import { BaseModal } from '@/shared/components/modal';
 *
 * @example
 * // 타입 사용
 * import type { ModalSize, BaseModalProps } from '@/shared/components/modal';
 */

export { BaseModal } from './BaseModal';

export type { ModalSize, BaseModalProps } from './modalType';
