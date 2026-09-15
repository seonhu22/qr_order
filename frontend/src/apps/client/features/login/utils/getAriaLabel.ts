import type { Step } from '../types';

const ARIA_LABELS: Record<Step, string> = {
  login: '로그인',
  'change-password': '비밀번호 변경',
  'signup-consent': '개인정보 동의',
  'signup-business': '사업자 인증',
  signup: '회원가입',
  'signup-complete': '가입 완료',
  'find-password': '비밀번호 찾기',
  'find-password-verify': '인증 코드 확인',
  'find-password-reset': '새 비밀번호 설정',
  'find-password-complete': '비밀번호 찾기 완료',
};

export function getAriaLabel(step: Step): string {
  return ARIA_LABELS[step];
}
