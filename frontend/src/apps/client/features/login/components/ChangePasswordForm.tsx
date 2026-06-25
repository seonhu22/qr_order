import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';

type ChangePasswordFormProps = {
  newPassword: string;
  newPasswordConfirm: string;
  changePasswordError: string;
  isPending: boolean;
  onNewPasswordChange: (value: string) => void;
  onNewPasswordConfirmChange: (value: string) => void;
  onClearError: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function ChangePasswordForm({
  newPassword,
  newPasswordConfirm,
  changePasswordError,
  isPending,
  onNewPasswordChange,
  onNewPasswordConfirmChange,
  onClearError,
  onSubmit,
}: ChangePasswordFormProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">비밀번호 변경</h1>
        <p className="login-card__subheading">초기 비밀번호를 변경해주세요.</p>
      </div>

      {changePasswordError && (
        <FormAlert
          type="error"
          description={changePasswordError}
          dismissible
          onDismiss={onClearError}
        />
      )}

      <div className="login-card__fields">
        <TextInput
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="change-pw"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          isError={!!changePasswordError}
        />
        <TextInput
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="change-pw-confirm"
          autoComplete="new-password"
          value={newPasswordConfirm}
          onChange={(e) => onNewPasswordConfirmChange(e.target.value)}
          isError={!!changePasswordError}
        />
        <Button type="submit" size="lg" className="login-card__submit" disabled={isPending}>
          {isPending ? '변경 중...' : '변경하기'}
        </Button>
      </div>
    </form>
  );
}
