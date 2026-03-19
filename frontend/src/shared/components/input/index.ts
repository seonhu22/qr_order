/**
 * @fileoverview Input 계열 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 * - InputBase / InputWrapper 는 고급 조합용으로도 공개
 * - types.ts 의 타입도 함께 재내보내기
 *
 * @example
 * // 일반 사용
 * import { TextInput } from '@/shared/components/input';
 *
 * @example
 * // 커스텀 조합 (Select 등 신규 컴포넌트 작성 시)
 * import { InputBase, InputWrapper } from '@/shared/components/input';
 */

/* 컴포넌트 */
export { InputBase }    from './InputBase';
export { InputWrapper } from './InputWrapper';
export { TextInput }    from './TextInput';

/* 타입 */
export type {
  InputSize,
  LabelPosition,
  InputControlState,
  InputWrapperBaseProps,
  InputBaseProps,
  TextInputProps,
} from './types';
