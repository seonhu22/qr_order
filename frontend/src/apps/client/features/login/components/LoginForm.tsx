import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { CheckboxInput } from '@/shared/components/checkbox';

type LoginFormProps = {
  userId: string;
  userPassword: string;
  saveId: boolean;
  loginError: string;
  isPending: boolean;
  onUserIdChange: (value: string) => void;
  onUserPasswordChange: (value: string) => void;
  onSaveIdChange: (value: boolean) => void;
  onClearError: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoFindPassword: () => void;
  onGoSignup: () => void;
};

export function LoginForm({
  userId,
  userPassword,
  saveId,
  loginError,
  isPending,
  onUserIdChange,
  onUserPasswordChange,
  onSaveIdChange,
  onClearError,
  onSubmit,
  onGoFindPassword,
  onGoSignup,
}: LoginFormProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">로그인</h1>
        <p className="login-card__subheading">계정 정보를 입력하여 로그인하세요.</p>
      </div>

      {loginError && (
        <FormAlert type="error" description={loginError} dismissible onDismiss={onClearError} />
      )}

      <div className="login-card__fields">
        <TextInput
          label="아이디"
          placeholder="아이디를 입력하세요"
          size="lg"
          id="login-id"
          autoComplete="username"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          isError={!!loginError}
        />
        <TextInput
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="login-pw"
          autoComplete="current-password"
          value={userPassword}
          onChange={(e) => onUserPasswordChange(e.target.value)}
          isError={!!loginError}
        />
      </div>

      <div className="login-card__options">
        <CheckboxInput
          label="아이디 저장"
          size="sm"
          checked={saveId}
          onChange={(checked) => onSaveIdChange(checked)}
        />
        <Button type="button" variant="link" size="sm" onClick={onGoFindPassword}>
          비밀번호 찾기
        </Button>
      </div>

      <div className="login-card__button-group">
        <Button type="submit" size="lg" className="login-card__submit" disabled={isPending}>
          {isPending ? '로그인 중...' : '로그인'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="login-card__submit"
          onClick={onGoSignup}
        >
          회원가입
        </Button>
      </div>
    </form>
  );
}
