/**
 * @fileoverview FormAlert 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 *
 * @example
 * import { FormAlert, DismissibleFormAlert } from '@/shared/components/form-alert';
 */

/* 컴포넌트 */
export { FormAlert, DismissibleFormAlert } from './FormAlert';

/* 타입 */
export type {
  FormAlertType,
  FormAlertProps,
  DismissibleFormAlertProps,
} from './types';