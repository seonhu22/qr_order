import type { FormEvent } from 'react';
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { formatBusinessNo } from '../utils/formatBusinessNo';

type SignupBusinessFormProps = {
  businessNo: string;
  businessRepName: string;
  openDate: string;
  businessError: string;
  isPending: boolean;
  onBusinessNoChange: (value: string) => void;
  onBusinessRepNameChange: (value: string) => void;
  onOpenDateChange: (value: string) => void;
  onClearError: () => void;
  onPrev: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function SignupBusinessForm({
  businessNo,
  businessRepName,
  openDate,
  businessError,
  isPending,
  onBusinessNoChange,
  onBusinessRepNameChange,
  onOpenDateChange,
  onClearError,
  onPrev,
  onSubmit,
}: SignupBusinessFormProps) {
  return (
    <form className="login-card__body" onSubmit={onSubmit}>
      <div className="login-card__title">
        <h1 className="login-card__heading">사업자 인증</h1>
        <p className="login-card__subheading">사업자 정보를 입력하여 인증을 진행해주세요.</p>
      </div>

      {businessError && (
        <FormAlert type="error" description={businessError} dismissible onDismiss={onClearError} />
      )}

      <div className="login-card__signup-grid">
        <TextInput
          label="사업자 등록번호"
          placeholder="000-00-00000"
          size="lg"
          id="biz-no"
          value={businessNo}
          onChange={(e) => onBusinessNoChange(formatBusinessNo(e.target.value))}
          required
        />
        <TextInput
          label="대표자명"
          placeholder="대표자명을 입력하세요"
          size="lg"
          id="biz-rep-name"
          value={businessRepName}
          onChange={(e) => onBusinessRepNameChange(e.target.value)}
          required
        />
        <TextInput
          label="개업일자"
          type="date"
          size="lg"
          id="biz-open-date"
          value={openDate}
          onChange={(e) => onOpenDateChange(e.target.value)}
          required
        />
      </div>

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          이전
        </Button>
        <Button type="submit" size="lg" loading={isPending} disabled={isPending}>
          {isPending ? '처리 중...' : '인증하기'}
        </Button>
      </div>
    </form>
  );
}
