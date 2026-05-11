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

type Step = 'login' | 'signup-consent' | 'signup' | 'signup-complete';

async function clientLogin(data: { userId: string; userPassword: string }) {
  const res = await fetch('/api/client/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

async function clientSignup(data: {
  userId: string;
  password: string;
  businessNo: string;
  email: string;
}) {
  const res = await fetch('/api/client/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('login');

  // 로그인 필드
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 동의
  const [consentChecked, setConsentChecked] = useState(false);

  // 회원가입 필드
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [businessNo, setBusinessNo] = useState('');
  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem(SAVED_ID_KEY);
    if (savedId) {
      setUserId(savedId);
      setSaveId(true);
    }
  }, []);

  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
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
        setLoginError(data.message ?? '로그인에 실패했습니다.');
      }
    },
    onError: () => {
      setLoginError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const { mutate: signupMutate, isPending: isSignupPending } = useMutation({
    mutationFn: clientSignup,
    onSuccess: (data) => {
      if (data.success) {
        setStep('signup-complete');
      } else {
        setSignupError(data.message ?? '회원가입에 실패했습니다.');
      }
    },
    onError: () => {
      setSignupError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const handleLoginSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoginError('');
    loginMutate({ userId, userPassword });
  };

  const handleSignupSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSignupError('');
    if (signupPw !== signupPwConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }
    signupMutate({ userId: signupId, password: signupPw, businessNo, email });
  };

  const goToLogin = () => {
    setStep('login');
    setConsentChecked(false);
    setSignupId('');
    setSignupPw('');
    setSignupPwConfirm('');
    setBusinessNo('');
    setEmail('');
    setSignupError('');
  };

  const isWide = step !== 'login';

  const ariaLabel =
    step === 'login' ? '로그인'
    : step === 'signup-consent' ? '개인정보 동의'
    : step === 'signup' ? '회원가입'
    : '가입 완료';

  return (
    <main className="login-page login-page--client">
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      <div className={`login-card${isWide ? ' login-card--wide' : ''}`} role="region" aria-label={ariaLabel}>
        <header className="login-card__header">
          <ClientBrand />
        </header>

        {/* ── 로그인 ── */}
        {step === 'login' && (
          <form className="login-card__body" onSubmit={handleLoginSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">로그인</h1>
              <p className="login-card__subheading">계정 정보를 입력하여 로그인하세요.</p>
            </div>

            {loginError && (
              <FormAlert type="error" description={loginError} dismissible onDismiss={() => setLoginError('')} />
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
                isError={!!loginError}
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
                isError={!!loginError}
              />
            </div>

            <div className="login-card__options">
              <CheckboxInput label="아이디 저장" size="sm" checked={saveId} onChange={(checked) => setSaveId(checked)} />
              <Button type="button" variant="link" size="sm">
                비밀번호 찾기
              </Button>
            </div>

            <div className="login-card__button-group">
              <Button type="submit" size="lg" className="login-card__submit" disabled={isLoginPending}>
                {isLoginPending ? '로그인 중...' : '로그인'}
              </Button>
              <Button type="button" variant="outline" size="lg" className="login-card__submit" onClick={() => setStep('signup-consent')}>
                회원가입
              </Button>
            </div>
          </form>
        )}

        {/* ── 개인정보 동의 ── */}
        {step === 'signup-consent' && (
          <div className="login-card__body">
            <div className="login-card__title">
              <h1 className="login-card__heading">개인정보 수집·이용 동의</h1>
              <p className="login-card__subheading">서비스 이용을 위해 아래 내용을 확인하고 동의해 주세요.</p>
            </div>
            <div className="login-card__consent-box">
              <p className="login-card__consent-section-title">수집 항목</p>
              <p className="login-card__consent-text">아이디, 비밀번호, 사업자 등록번호, 이메일</p>

              <p className="login-card__consent-section-title">수집 목적</p>
              <p className="login-card__consent-text">회원 식별, 서비스 제공, 계정 관리</p>

              <p className="login-card__consent-section-title">보유 기간</p>
              <p className="login-card__consent-text">회원 탈퇴 시까지 (관계 법령에 따라 일정 기간 보관될 수 있음)</p>

              <p className="login-card__consent-notice">
                위 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 제한됩니다.
              </p>
            </div>

            <CheckboxInput
              label="개인정보 수집·이용에 동의합니다 (필수)"
              checked={consentChecked}
              onChange={(checked) => setConsentChecked(checked)}
            />

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={goToLogin}>
                취소
              </Button>
              <Button type="button" size="lg" disabled={!consentChecked} onClick={() => setStep('signup')}>
                동의 후 계속
              </Button>
            </div>
          </div>
        )}

        {/* ── 회원가입 ── */}
        {step === 'signup' && (
          <form className="login-card__body" onSubmit={handleSignupSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">회원가입</h1>
              <p className="login-card__subheading">서비스 이용을 위한 계정을 생성합니다.</p>
            </div>
            {signupError && (
              <FormAlert type="error" description={signupError} dismissible onDismiss={() => setSignupError('')} />
            )}

            <div className="login-card__signup-grid">
              <TextInput
                label="아이디"
                placeholder="아이디를 입력하세요"
                size="lg"
                id="signup-id"
                autoComplete="username"
                value={signupId}
                onChange={(e) => setSignupId(e.target.value)}
                isError={!!signupError}
              />
              <TextInput
                label="이메일"
                placeholder="이메일을 입력하세요"
                type="email"
                size="lg"
                id="signup-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isError={!!signupError}
              />
              <TextInput
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="signup-pw"
                autoComplete="new-password"
                value={signupPw}
                onChange={(e) => setSignupPw(e.target.value)}
                isError={!!signupError}
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
                onChange={(e) => setSignupPwConfirm(e.target.value)}
                isError={!!signupError}
              />
              <TextInput
                label="사업자 등록번호"
                placeholder="000-00-00000"
                size="lg"
                id="signup-business-no"
                value={businessNo}
                onChange={(e) => setBusinessNo(e.target.value)}
                isError={!!signupError}
              />
            </div>

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep('signup-consent')}>
                이전
              </Button>
              <Button type="submit" size="lg" loading={isSignupPending}>
                {isSignupPending ? '처리 중...' : '가입하기'}
              </Button>
            </div>
          </form>
        )}

        {/* ── 가입 완료 ── */}
        {step === 'signup-complete' && (
          <div className="login-card__body">
            <div className="login-card__title">
              <h1 className="login-card__heading">가입 완료</h1>
            </div>
            <div className="login-card__locked-messages">
              <p className="login-card__subheading">회원가입이 완료되었습니다.</p>
              <p className="login-card__locked-desc">로그인 후 서비스를 이용할 수 있습니다.</p>
            </div>
            <Button type="button" size="lg" className="login-card__submit" onClick={goToLogin}>
              로그인하러 가기
            </Button>
          </div>
        )}
      </div>

      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>
    </main>
  );
}
