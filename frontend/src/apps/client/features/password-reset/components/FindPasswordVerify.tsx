import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';

type FindPasswordVerifyProps = {
  verifyCode: string;
  findError: string;
  isVerifyPending: boolean;
  isResendPending: boolean;
  isSendingCode: boolean;
  onVerifyCodeChange: (value: string) => void;
  onClearError: () => void;
  onResend: () => void;
  onBack: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function FindPasswordVerify({
  verifyCode,
  findError,
  isVerifyPending,
  isResendPending,
  isSendingCode,
  onVerifyCodeChange,
  onClearError,
  onResend,
  onBack,
  onSubmit,
}: FindPasswordVerifyProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">인증 코드 확인</h1>
        <p className="login-card__subheading">이메일로 발송된 인증 코드를 입력하세요.</p>
      </div>

      {findError && (
        <FormAlert type="error" description={findError} dismissible onDismiss={onClearError} />
      )}

      <div className="login-card__fields">
        <TextInput
          label="인증 코드"
          placeholder="인증 코드를 입력하세요"
          size="lg"
          id="verify-code"
          value={verifyCode}
          onChange={(e) => onVerifyCodeChange(e.target.value)}
          isError={!!findError}
        />
        <Button
          type="button"
          variant="link"
          size="sm"
          loading={isResendPending}
          disabled={isSendingCode}
          onClick={onResend}
        >
          인증 코드 재전송
        </Button>
      </div>

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          이전
        </Button>
        <Button type="submit" size="lg" loading={isVerifyPending}>
          {isVerifyPending ? '확인 중...' : '확인'}
        </Button>
      </div>
    </form>
  );
}
