// src/shared/components/modal/index.ts

/**
 * @fileoverview Modal 계열 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 * - WrapperModal 컴포넌트와 modalType 타입을 함께 재내보내기
 *
 * @param {never} _unused 이 파일은 런타임 파라미터를 사용하지 않는 export 배럴 파일이다.
 * @example
 * // 일반 사용
 * import { NoticeModal, ConfirmModal, WrapperModal } from '@/shared/components/modal';
 *
 * @example
 * // 타입 사용
 * import type { ModalCommonProps, ModalSize, WrapperModalProps } from '@/shared/components/modal';
 */

export type {
  ModalActionConfig,
  ModalCommonProps,
  ModalPrimaryAction,
  ModalSecondaryAction,
  ModalSize,
  ConfirmPrimaryAction,
  ConfirmSecondaryAction,
  NoticeModalProps,
  ConfirmModalProps,
  ConfirmModalTone,
  WrapperModalLayout,
  WrapperModalProps,
} from './base/modalType';

export { WrapperModal } from './wrapper/WrapperModal';
export { NoticeModal } from './template/NoticeModal';
export { NoticeConfirmModal } from './template/NoticeConfirmModal';
export { ConfirmModal } from './template/ConfirmModal';
export { SaveConfirmModal } from './template/SaveConfirmModal';
export { DeleteConfirmModal } from './template/DeleteConfirmModal';
export { EditConfirmModal } from './template/EditConfirmModal';
export type { NoticeConfirmModalProps } from './template/NoticeConfirmModal';
export type { SaveConfirmModalProps } from './template/SaveConfirmModal';
export type { DeleteConfirmModalProps } from './template/DeleteConfirmModal';
export type { EditConfirmModalProps } from './template/EditConfirmModal';
