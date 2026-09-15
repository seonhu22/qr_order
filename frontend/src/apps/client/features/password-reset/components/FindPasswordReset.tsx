import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';

type FindPasswordResetProps = {
  resetPw: string;
  resetPwConfirm: string;
  findError: string;
  isPending: boolean;
  onResetPwChange: (value: string) => void;
  onResetPwConfirmChange: (value: string) => void;
  onClearError: () => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function FindPasswordReset({
  resetPw,
  resetPwConfirm,
  findError,
  isPending,
  onResetPwChange,
  onResetPwConfirmChange,
  onClearError,
  onCancel,
  onSubmit,
}: FindPasswordResetProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">새 비밀번호 설정</h1>
        <p className="login-card__subheading">사용할 새 비밀번호를 입력해주세요.</p>
      </div>

      {findError && (
        <FormAlert type="error" description={findError} dismissible onDismiss={onClearError} />
      )}

      <div className="login-card__fields">
        <TextInput
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="reset-pw"
          autoComplete="new-password"
          value={resetPw}
          onChange={(e) => onResetPwChange(e.target.value)}
          isError={!!findError}
        />
        <TextInput
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="reset-pw-confirm"
          autoComplete="new-password"
          value={resetPwConfirm}
          onChange={(e) => onResetPwConfirmChange(e.target.value)}
          isError={!!findError}
        />
      </div>

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="lg" loading={isPending}>
          {isPending ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </div>
    </form>
  );
}
