import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/shared/styles/login.css';
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { AdminBrand } from '../components/AdminBrand';
import { useLogin } from '@/generated/login-controller/login-controller';
import { useAuth } from '@/shared/auth/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate: loginMutate, isPending } = useLogin({
    mutation: {
    onSuccess: (data) => {
      if (data.success) {
        signIn(data.data ?? null);
        navigate('/admin/main');
      } else {
        setErrorMessage(data.message ?? '로그인에 실패했습니다.');
      }
    },
    onError: () => {
      setErrorMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
    },
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage('');
    loginMutate({ data: { userId, userPassword } });
  };

  return (
    <main className="login-page">
      {/* 배경 장식 원형 */}
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      {/* 로그인 카드 */}
      <div className="login-card" role="region" aria-label="로그인">
        <header className="login-card__header">
          <AdminBrand />
        </header>

        <form className="login-card__body" onSubmit={handleSubmit}>
          <div className="login-card__title">
            <h1 className="login-card__heading">로그인</h1>
            <p className="login-card__subheading">계정 정보를 입력하여 로그인하세요.</p>
          </div>

          {/* 에러 알림 — 폼 최상단 */}
          {errorMessage && (
            <FormAlert
              type="error"
              description={errorMessage}
              dismissible
              onDismiss={() => setErrorMessage('')}
            />
          )}

          <div className="login-card__fields">
            <TextInput
              label="아이디"
              placeholder="아이디를 입력하세요"
              size="lg"
              id="login-id"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              isError={!!errorMessage}
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
              onChange={(e) => setUserPassword(e.target.value)}
              isError={!!errorMessage}
            />
            <Button
              type="submit"
              size="lg"
              className="login-card__submit"
              disabled={isPending}
            >
              {isPending ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>
      </div>

      {/* 저작권 */}
      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>
    </main>
  );
}
