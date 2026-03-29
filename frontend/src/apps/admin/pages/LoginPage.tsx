import '@/shared/styles/login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button';
import { AdminBrand } from '../components/AdminBrand';

// TODO: 임시 로그인 fetch — 인증 정책 확정 후 AuthContext/TanStack Query로 교체
async function fetchLogin(userId: string, userPassword: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userPassword }),
  });

  const data = await res.json();
  return data as { success: boolean; message: string; error: string; data: unknown };
}

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const result = await fetchLogin(userId, userPassword);
    console.log('[임시] 로그인 응답:', result);
    if (result.success) {
      navigate('/admin/main', { replace: true });
    }
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

        <div className="login-card__body">
          <h1 className="login-card__heading">로그인</h1>

          <div className="login-card__fields">
            <TextInput
              label="아이디"
              placeholder="아이디를 입력하세요"
              size="lg"
              id="login-id"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
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
            />
            <Button size="lg" className="login-card__submit" onClick={handleLogin}>
              로그인
            </Button>
          </div>
        </div>
      </div>

      {/* 저작권 */}
      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>
    </main>
  );
}
