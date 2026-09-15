import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';

type FindPasswordFormProps = {
  findId: string;
  findEmail: string;
  findError: string;
  isPending: boolean;
  onFindIdChange: (value: string) => void;
  onFindEmailChange: (value: string) => void;
  onClearError: () => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function FindPasswordForm({
  findId,
  findEmail,
  findError,
  isPending,
  onFindIdChange,
  onFindEmailChange,
  onClearError,
  onCancel,
  onSubmit,
}: FindPasswordFormProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">비밀번호 찾기</h1>
        <p className="login-card__subheading">가입 시 등록한 아이디와 이메일을 입력하세요.</p>
      </div>

      {findError && (
        <FormAlert type="error" description={findError} dismissible onDismiss={onClearError} />
      )}

      <div className="login-card__fields">
        <TextInput
          label="아이디"
          placeholder="아이디를 입력하세요"
          size="lg"
          id="find-id"
          autoComplete="username"
          value={findId}
          onChange={(e) => onFindIdChange(e.target.value)}
          isError={!!findError}
        />
        <TextInput
          label="이메일"
          placeholder="이메일을 입력하세요"
          type="email"
          size="lg"
          id="find-email"
          autoComplete="email"
          value={findEmail}
          onChange={(e) => onFindEmailChange(e.target.value)}
          isError={!!findError}
        />
      </div>

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="lg" loading={isPending}>
          {isPending ? '처리 중...' : '인증 코드 받기'}
        </Button>
      </div>
    </form>
  );
}
