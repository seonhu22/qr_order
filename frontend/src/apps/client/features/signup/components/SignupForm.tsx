import type { FormEvent } from 'react';
import { TextInput, InputWrapper, InputBase } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { Icon } from '@/shared/assets/icons/Icon';

type IdCheckStatus = 'idle' | 'available' | 'taken';

type SignupFormProps = {
  signupId: string;
  signupPw: string;
  signupPwConfirm: string;
  signupError: string;
  idCheckStatus: IdCheckStatus;
  isIdCheckPending: boolean;
  email: string;
  emailError: string;
  emailVerified: boolean;
  emailFieldDisabled: boolean;
  emailSent: boolean;
  emailTimerSeconds: number;
  emailVerifyCode: string;
  emailCodeError: string;
  isEmailCodePending: boolean;
  isEmailVerifyPending: boolean;
  isSignupPending: boolean;
  onSignupIdChange: (value: string) => void;
  onSignupPwChange: (value: string) => void;
  onSignupPwConfirmChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEmailVerifyCodeChange: (value: string) => void;
  onClearSignupError: () => void;
  onIdDuplicateCheck: () => void;
  onSendEmailCode: () => void;
  onVerifyEmailCode: () => void;
  onPrev: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const formatTimer = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function SignupForm({
  signupId,
  signupPw,
  signupPwConfirm,
  signupError,
  idCheckStatus,
  isIdCheckPending,
  email,
  emailError,
  emailVerified,
  emailFieldDisabled,
  emailSent,
  emailTimerSeconds,
  emailVerifyCode,
  emailCodeError,
  isEmailCodePending,
  isEmailVerifyPending,
  isSignupPending,
  onSignupIdChange,
  onSignupPwChange,
  onSignupPwConfirmChange,
  onEmailChange,
  onEmailVerifyCodeChange,
  onClearSignupError,
  onIdDuplicateCheck,
  onSendEmailCode,
  onVerifyEmailCode,
  onPrev,
  onSubmit,
}: SignupFormProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">회원가입</h1>
        <p className="login-card__subheading">서비스 이용을 위한 계정을 생성합니다.</p>
      </div>
      {signupError && (
        <FormAlert
          type="error"
          description={signupError}
          dismissible
          onDismiss={onClearSignupError}
        />
      )}

      <div className="login-card__signup-grid">
        <InputWrapper
          inputId="signup-id"
          label="아이디"
          required
          successText={idCheckStatus === 'available' ? '사용 가능한 아이디입니다.' : undefined}
          errorText={idCheckStatus === 'taken' ? '이미 사용 중인 아이디입니다.' : undefined}
        >
          <div className="login-card__id-check-row">
            <InputBase
              id="signup-id"
              size="lg"
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              value={signupId}
              onChange={(e) => onSignupIdChange(e.target.value)}
              controlState={
                idCheckStatus === 'taken'
                  ? 'error'
                  : idCheckStatus === 'available'
                    ? 'success'
                    : ''
              }
            />
            <Button
              type="button"
              size="lg"
              variant="outline"
              loading={isIdCheckPending}
              disabled={!signupId || isIdCheckPending}
              onClick={onIdDuplicateCheck}
            >
              중복확인
            </Button>
          </div>
        </InputWrapper>

        <TextInput
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="signup-pw"
          autoComplete="new-password"
          value={signupPw}
          onChange={(e) => onSignupPwChange(e.target.value)}
          isError={!!signupError}
          required
        />

        <TextInput
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          type="password"
          showPasswordToggle
          size="lg"
          id="signup-pw-confirm"
          autoComplete="new-password"
          value={signupPwConfirm}
          onChange={(e) => onSignupPwConfirmChange(e.target.value)}
          isError={!!signupError}
          required
        />

        <InputWrapper
          inputId="signup-email"
          label="이메일"
          required
          errorText={emailError || undefined}
          successText={emailVerified ? '이메일 인증이 완료되었습니다.' : undefined}
        >
          <div className="login-card__id-check-row">
            <InputBase
              id="signup-email"
              type="email"
              size="lg"
              placeholder="이메일을 입력하세요"
              autoComplete="email"
              value={email}
              disabled={emailFieldDisabled}
              controlState={
                emailError
                  ? 'error'
                  : emailVerified
                    ? 'success'
                    : emailFieldDisabled
                      ? 'disabled'
                      : ''
              }
              onChange={(e) => onEmailChange(e.target.value)}
            />
            <Button
              type="button"
              size="lg"
              variant="outline"
              loading={isEmailCodePending}
              disabled={emailVerified || isEmailCodePending}
              onClick={onSendEmailCode}
            >
              {emailSent && emailTimerSeconds > 0 ? '재전송' : '인증'}
            </Button>
          </div>
        </InputWrapper>

        {emailSent && !emailVerified && (
          <InputWrapper
            inputId="signup-email-code"
            label="인증 코드"
            required
            errorText={emailCodeError || undefined}
          >
            <>
              <div className="login-card__id-check-row">
                <InputBase
                  id="signup-email-code"
                  size="lg"
                  placeholder="인증 코드를 입력하세요"
                  value={emailVerifyCode}
                  disabled={emailTimerSeconds === 0}
                  controlState={
                    emailCodeError ? 'error' : emailTimerSeconds === 0 ? 'disabled' : ''
                  }
                  onChange={(e) => onEmailVerifyCodeChange(e.target.value)}
                />
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  loading={isEmailVerifyPending}
                  disabled={emailTimerSeconds === 0 || isEmailVerifyPending}
                  onClick={onVerifyEmailCode}
                >
                  확인
                </Button>
              </div>
              {emailTimerSeconds > 0 ? (
                <span className="signup-timer">
                  <Icon id="i-clock" size={13} />
                  남은 시간 {formatTimer(emailTimerSeconds)}
                </span>
              ) : (
                <span className="signup-timer signup-timer--expired">
                  <Icon id="i-clock" size={13} />
                  인증 시간이 만료되었습니다. 이메일을 다시 입력 후 재시도해주세요.
                </span>
              )}
            </>
          </InputWrapper>
        )}
      </div>

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          이전
        </Button>
        <Button type="submit" size="lg" loading={isSignupPending}>
          {isSignupPending ? '처리 중...' : '가입하기'}
        </Button>
      </div>
    </form>
  );
}
