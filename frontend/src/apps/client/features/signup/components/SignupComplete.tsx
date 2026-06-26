import { Button } from '@/shared/components/button';

type SignupCompleteProps = {
  onGoLogin: () => void;
};

export function SignupComplete({ onGoLogin }: SignupCompleteProps) {
  return (
    <div className="login-card__body">
      <div className="login-card__title">
        <h1 className="login-card__heading">가입 완료</h1>
      </div>
      <div className="login-card__locked-messages">
        <p className="login-card__subheading">회원가입이 완료되었습니다.</p>
        <p className="login-card__locked-desc">로그인 후 서비스를 이용할 수 있습니다.</p>
      </div>
      <Button type="button" size="lg" className="login-card__submit" onClick={onGoLogin}>
        로그인하러 가기
      </Button>
    </div>
  );
}
