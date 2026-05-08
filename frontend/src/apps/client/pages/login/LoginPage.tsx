import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import '@/shared/styles/login.css';
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { CheckboxInput } from '@/shared/components/checkbox';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';

const SAVED_ID_KEY = 'client_saved_userId';

async function clientLogin(data: { userId: string; userPassword: string }) {
  const res = await fetch('/api/client/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem(SAVED_ID_KEY);
    if (savedId) {
      setUserId(savedId);
      setSaveId(true);
    }
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: clientLogin,
    onSuccess: (data) => {
      if (data.success) {
        if (saveId) {
          localStorage.setItem(SAVED_ID_KEY, userId);
        } else {
          localStorage.removeItem(SAVED_ID_KEY);
        }
        navigate('/client/main');
      } else {
        setErrorMessage(data.message ?? '로그인에 실패했습니다.');
      }
    },
    onError: () => {
      setErrorMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage('');
    mutate({ userId, userPassword });
  };

  return (
    <main className="login-page login-page--client">
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      <div className="login-card" role="region" aria-label="로그인">
        <header className="login-card__header">
          <ClientBrand />
        </header>

        <form className="login-card__body" onSubmit={handleSubmit}>
          <div className="login-card__title">
            <h1 className="login-card__heading">로그인</h1>
            <p className="login-card__subheading">계정 정보를 입력하여 로그인하세요.</p>
          </div>

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
          </div>

          <div className="login-card__options">
            <CheckboxInput label="아이디 저장" size="sm" checked={saveId} onChange={(checked) => setSaveId(checked)} />
            <Button type="button" variant="link" size="sm">
              비밀번호 찾기
            </Button>
          </div>

          <Button type="submit" size="lg" className="login-card__submit" disabled={isPending}>
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>

      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>
    </main>
  );
}
