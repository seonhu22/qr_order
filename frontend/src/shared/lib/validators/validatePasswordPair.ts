type ValidatePasswordPairOptions = {
  emptyMessage?: string;
  mismatchMessage?: string;
};

export type PasswordPairValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function validatePasswordPair(
  password: string,
  passwordConfirm: string,
  {
    emptyMessage = '비밀번호를 입력해주세요.',
    mismatchMessage = '비밀번호가 일치하지 않습니다.',
  }: ValidatePasswordPairOptions = {},
): PasswordPairValidationResult {
  if (!password || !passwordConfirm) {
    return { ok: false, message: emptyMessage };
  }

  if (password !== passwordConfirm) {
    return { ok: false, message: mismatchMessage };
  }

  return { ok: true };
}
