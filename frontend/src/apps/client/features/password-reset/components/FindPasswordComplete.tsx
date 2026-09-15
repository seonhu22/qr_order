import { Button } from '@/shared/components/button';

type FindPasswordCompleteProps = {
  onGoLogin: () => void;
};

export function FindPasswordComplete({ onGoLogin }: FindPasswordCompleteProps) {
  return (
    <div className="login-card__body">
      <div className="login-card__title">
        <h1 className="login-card__heading">비밀번호 변경 완료</h1>
      </div>
      <div className="login-card__locked-messages">
        <p className="login-card__subheading">비밀번호가 변경되었습니다.</p>
        <p className="login-card__locked-desc">새 비밀번호로 다시 로그인해주세요.</p>
      </div>
      <Button type="button" size="lg" className="login-card__submit" onClick={onGoLogin}>
        로그인하러 가기
      </Button>
    </div>
  );
}
