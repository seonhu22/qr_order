import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';

type SignupConsentProps = {
  consentChecked: boolean;
  onConsentChange: (value: boolean) => void;
  onCancel: () => void;
  onNext: () => void;
};

export function SignupConsent({
  consentChecked,
  onConsentChange,
  onCancel,
  onNext,
}: SignupConsentProps) {
  return (
    <div className="login-card__body">
      <div className="login-card__title">
        <h1 className="login-card__heading">개인정보 수집·이용 동의</h1>
        <p className="login-card__subheading">
          서비스 이용을 위해 아래 내용을 확인하고 동의해 주세요.
        </p>
      </div>
      <div className="login-card__consent-box">
        <p className="login-card__consent-section-title">수집 항목</p>
        <p className="login-card__consent-text">아이디, 비밀번호, 사업자 등록번호, 이메일</p>

        <p className="login-card__consent-section-title">수집 목적</p>
        <p className="login-card__consent-text">회원 식별, 서비스 제공, 계정 관리</p>

        <p className="login-card__consent-section-title">보유 기간</p>
        <p className="login-card__consent-text">
          회원 탈퇴 시까지 (관계 법령에 따라 일정 기간 보관될 수 있음)
        </p>

        <p className="login-card__consent-notice">
          위 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 제한됩니다.
        </p>
      </div>

      <CheckboxInput
        label="개인정보 수집·이용에 동의합니다 (필수)"
        checked={consentChecked}
        onChange={(checked) => onConsentChange(checked)}
      />

      <div className="login-card__consent-actions">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          취소
        </Button>
        <Button type="button" size="lg" disabled={!consentChecked} onClick={onNext}>
          동의 후 계속
        </Button>
      </div>
    </div>
  );
}
