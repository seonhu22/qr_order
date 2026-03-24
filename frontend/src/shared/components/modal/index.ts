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
 * import { WrapperModal } from '@/shared/components/modal';
 *
 * @example
 * // 타입 사용
 * import type { ModalSize, WrapperModalProps } from '@/shared/components/modal';
 */

export { WrapperModal } from './WrapperModal';

export type { ModalSize, WrapperModalActions, WrapperModalLayout, WrapperModalProps } from './modalType';
