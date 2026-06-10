import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import '@/shared/styles/login.css';
import { TextInput, InputWrapper, InputBase } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { CheckboxInput } from '@/shared/components/checkbox';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';
import { Icon } from '@/shared/assets/icons/Icon';
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthLoginMutation } from '@/shared/auth/hooks/useAuthLoginMutation';
import {
  getAuthResponseData,
  hasInitialPasswordRequirementSignal,
  isInitialPasswordChangeRequired,
} from '@/shared/auth/initPassword';

const SAVED_ID_KEY = 'client_saved_userId';

type Step = 'login' | 'change-password' | 'signup-consent' | 'signup-business' | 'signup' | 'signup-complete' | 'find-password' | 'find-password-verify' | 'find-password-complete';

function formatBusinessNo(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

async function clientInitPwdActive(data: { password: string; chkPassword: string; userId: string }) {
  const res = await fetch('/api/client/auth/init-pwd-active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

// 비밀번호 찾기 — 아이디·이메일 제출 (API 미정, 임시 엔드포인트)
async function findPassword(data: { userId: string; email: string }) {
  const res = await fetch('/api/client/auth/find-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

// 비밀번호 찾기 — 인증 코드 확인 (API 미정, 임시 엔드포인트)
async function verifyFindPasswordCode(data: { userId: string; verifyCode: string }) {
  const res = await fetch('/api/client/auth/find-password/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

// 아이디 중복 확인 (API 미정, 임시 통과 처리)
async function checkDuplicateId(_data: { userId: string }) {
  return { success: true, available: true } as { success: boolean; available: boolean; message?: string };
}

// 사업자 인증 (API 미정, 임시 통과 처리)
async function verifyBusiness(_data: { businessNo: string; representativeName: string; openDate: string }) {
  return { success: true, message: undefined } as { success: boolean; message?: string };
}

// 회원가입 (API 미정, 임시 엔드포인트)
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
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('login');

  // 로그인 필드
  const [userId, setUserId] = useState(() => localStorage.getItem(SAVED_ID_KEY) ?? '');
  const [userPassword, setUserPassword] = useState('');
  const [saveId, setSaveId] = useState(() => !!localStorage.getItem(SAVED_ID_KEY));
  const [loginError, setLoginError] = useState('');

  // 비밀번호 변경 필드
  const [loggedInUserId, setLoggedInUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [resultModal, setResultModal] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>(
    { open: false, title: '', description: '', onConfirm: () => {} },
  );

  // 동의
  const [consentChecked, setConsentChecked] = useState(false);

  // 사업자 인증 필드
  const [businessNo, setBusinessNo] = useState('');
  const [businessRepName, setBusinessRepName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [businessError, setBusinessError] = useState('');

  // 회원가입 필드
  const [signupId, setSignupId] = useState('');
  const [idCheckStatus, setIdCheckStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [signupError, setSignupError] = useState('');

  // 이메일 인증 필드
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailTimerSeconds, setEmailTimerSeconds] = useState(0);
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailCodeError, setEmailCodeError] = useState('');

  // 비밀번호 찾기 필드
  const [findId, setFindId] = useState('');
  const [findEmail, setFindEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [findError, setFindError] = useState('');

  // 이메일 인증 타이머
  useEffect(() => {
    if (emailTimerSeconds <= 0) return;
    const id = setTimeout(() => setEmailTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [emailTimerSeconds]);

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSendEmailCode = () => {
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setEmailError('');
    setEmailVerifyCode('');
    setEmailCodeError('');
    // TODO: 이메일 인증 코드 발송 API 연결
    setEmailSent(true);
    setEmailTimerSeconds(300);
  };

  const handleVerifyEmailCode = () => {
    if (!emailVerifyCode) {
      setEmailCodeError('인증 코드를 입력해주세요.');
      return;
    }
    // TODO: 이메일 인증 코드 확인 API 연결 (현재 임시 통과)
    setEmailVerified(true);
    setEmailTimerSeconds(0);
    setEmailCodeError('');
  };

  const emailFieldDisabled = emailSent && !emailVerified && emailTimerSeconds > 0;

  const refetchCurrentUser = async () => {
    const meData = await getCurrentUser();
    queryClient.setQueryData(queryKeys.auth.me, meData);

    return getAuthResponseData(meData);
  };

  const { mutate: loginMutate, isPending: isLoginPending } = useAuthLoginMutation({
    mutation: {
      onSuccess: async (data) => {
        if (data.success) {
          if (saveId) {
            localStorage.setItem(SAVED_ID_KEY, userId);
          } else {
            localStorage.removeItem(SAVED_ID_KEY);
          }

          let responseData = getAuthResponseData(data);

          if (!hasInitialPasswordRequirementSignal(responseData)) {
            try {
              responseData = await refetchCurrentUser();
            } catch {
              setLoginError('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
              return;
            }
          }

          if (!responseData) {
            setLoginError('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
            return;
          }

          if (isInitialPasswordChangeRequired(responseData)) {
            setLoggedInUserId(typeof responseData?.userId === 'string' ? responseData.userId : userId);
            setUserPassword('');
            setStep('change-password');
          } else {
            navigate('/client/main');
          }
        } else {
          setLoginError(data.message ?? '로그인에 실패했습니다.');
        }
      },
      onError: (error) => {
        setLoginError(
          error instanceof Error
            ? error.message
            : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      },
    },
  });

  const { mutate: changePasswordMutate, isPending: isChangePending } = useMutation({
    mutationFn: clientInitPwdActive,
    onSuccess: (data) => {
      if (data.success) {
        setResultModal({
          open: true,
          title: '알림',
          description: '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요.',
          onConfirm: () => {
            setResultModal((prev) => ({ ...prev, open: false }));
            setStep('login');
            setNewPassword('');
            setNewPasswordConfirm('');
            setChangePasswordError('');
          },
        });
      } else {
        setResultModal({
          open: true,
          title: '비밀번호 변경 실패',
          description: data.message ?? '비밀번호 변경에 실패했습니다.',
          onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
        });
      }
    },
    onError: () => {
      setResultModal({
        open: true,
        title: '비밀번호 변경 실패',
        description: '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
      });
    },
  });

  const { mutate: verifyBusinessMutate, isPending: isBusinessPending } = useMutation({
    mutationFn: verifyBusiness,
    onSuccess: (data) => {
      if (data.success) {
        setResultModal({
          open: true,
          title: '인증 완료',
          description: '사업자 인증이 완료되었습니다.',
          onConfirm: () => {
            setResultModal((prev) => ({ ...prev, open: false }));
            setStep('signup');
          },
        });
      } else {
        setResultModal({
          open: true,
          title: '인증 실패',
          description: data.message ?? '사업자 정보를 확인해주세요.',
          onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
        });
      }
    },
    onError: () => {
      setResultModal({
        open: true,
        title: '서버 오류',
        description: '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
      });
    },
  });

  const { mutate: checkIdMutate, isPending: isIdCheckPending } = useMutation({
    mutationFn: checkDuplicateId,
    onSuccess: (data) => {
      setIdCheckStatus(data.available ? 'available' : 'taken');
    },
    onError: () => {
      setIdCheckStatus('idle');
    },
  });

  const { mutate: findPasswordMutate, isPending: isFindPending } = useMutation({
    mutationFn: findPassword,
    onSuccess: (data) => {
      if (data.success) {
        setStep('find-password-verify');
      } else {
        setFindError(data.message ?? '입력하신 정보를 확인해주세요.');
      }
    },
    onError: () => {
      setFindError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const { mutate: verifyCodeMutate, isPending: isVerifyPending } = useMutation({
    mutationFn: verifyFindPasswordCode,
    onSuccess: (data) => {
      if (data.success) {
        setStep('find-password-complete');
      } else {
        setFindError(data.message ?? '인증 코드를 확인해주세요.');
      }
    },
    onError: () => {
      setFindError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const { mutate: signupMutate, isPending: isSignupPending } = useMutation({
    mutationFn: clientSignup,
    onSuccess: (data) => {
      if (data.success) {
        setResultModal({
          open: true,
          title: '가입 완료',
          description: '회원가입이 완료되었습니다.\n로그인 후 서비스를 이용하실 수 있습니다.',
          onConfirm: () => {
            setResultModal((prev) => ({ ...prev, open: false }));
            setStep('signup-complete');
          },
        });
      } else {
        setSignupError(data.message ?? '회원가입에 실패했습니다.');
      }
    },
    onError: () => {
      setResultModal({
        open: true,
        title: '서버 오류',
        description: '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
      });
    },
  });

  const handleLoginSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoginError('');
    loginMutate({ data: { userId, userPassword } });
  };

  const handleChangePasswordSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setChangePasswordError('');
    if (!newPassword || !newPasswordConfirm) {
      setChangePasswordError('비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setChangePasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }
    changePasswordMutate({ password: newPassword, chkPassword: newPasswordConfirm, userId: loggedInUserId });
  };

  const handleBusinessSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setBusinessError('');
    verifyBusinessMutate({ businessNo, representativeName: businessRepName, openDate });
  };

  const handleFindPasswordSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setFindError('');
    findPasswordMutate({ userId: findId, email: findEmail });
  };

  const handleVerifyCodeSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setFindError('');
    verifyCodeMutate({ userId: findId, verifyCode });
  };

  const handleSignupSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSignupError('');
    if (idCheckStatus !== 'available') {
      setSignupError('아이디 중복 확인을 해주세요.');
      return;
    }
    if (!emailVerified) {
      setSignupError('이메일 인증을 완료해주세요.');
      return;
    }
    if (signupPw !== signupPwConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }
    signupMutate({ userId: signupId, password: signupPw, businessNo, email });
  };

  const goToLogin = () => {
    setStep('login');
    setConsentChecked(false);
    setBusinessNo(''); setBusinessRepName(''); setOpenDate(''); setBusinessError('');
    setSignupId(''); setIdCheckStatus('idle'); setSignupPw(''); setSignupPwConfirm('');
    setEmail(''); setEmailError(''); setEmailSent(false); setEmailVerified(false);
    setEmailTimerSeconds(0); setEmailVerifyCode(''); setEmailCodeError('');
    setSignupError('');
    setFindId(''); setFindEmail(''); setVerifyCode(''); setFindError('');
  };

  const isWide = step !== 'login' && step !== 'change-password';

  const ariaLabel =
    step === 'login' ? '로그인'
    : step === 'change-password' ? '비밀번호 변경'
    : step === 'signup-consent' ? '개인정보 동의'
    : step === 'signup-business' ? '사업자 인증'
    : step === 'signup' ? '회원가입'
    : step === 'signup-complete' ? '가입 완료'
    : step === 'find-password' ? '비밀번호 찾기'
    : step === 'find-password-verify' ? '인증 코드 확인'
    : '비밀번호 찾기 완료';

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
              <Button type="button" variant="link" size="sm" onClick={() => setStep('find-password')}>
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

        {/* ── 비밀번호 변경 (초기 비밀번호) ── */}
        {step === 'change-password' && (
          <form className="login-card__body" onSubmit={handleChangePasswordSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">비밀번호 변경</h1>
              <p className="login-card__subheading">초기 비밀번호를 변경해주세요.</p>
            </div>

            {changePasswordError && (
              <FormAlert type="error" description={changePasswordError} dismissible onDismiss={() => setChangePasswordError('')} />
            )}

            <div className="login-card__fields">
              <TextInput
                label="새 비밀번호"
                placeholder="새 비밀번호를 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="change-pw"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                isError={!!changePasswordError}
              />
              <TextInput
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="change-pw-confirm"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                isError={!!changePasswordError}
              />
              <Button type="submit" size="lg" className="login-card__submit" disabled={isChangePending}>
                {isChangePending ? '변경 중...' : '변경하기'}
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
              <Button type="button" size="lg" disabled={!consentChecked} onClick={() => setStep('signup-business')}>
                동의 후 계속
              </Button>
            </div>
          </div>
        )}

        {/* ── 사업자 인증 ── */}
        {step === 'signup-business' && (
          <form className="login-card__body" onSubmit={handleBusinessSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">사업자 인증</h1>
              <p className="login-card__subheading">사업자 정보를 입력하여 인증을 진행해주세요.</p>
            </div>

            {businessError && (
              <FormAlert type="error" description={businessError} dismissible onDismiss={() => setBusinessError('')} />
            )}

            <div className="login-card__signup-grid">
              <TextInput
                label="사업자 등록번호"
                placeholder="000-00-00000"
                size="lg"
                id="biz-no"
                value={businessNo}
                onChange={(e) => setBusinessNo(formatBusinessNo(e.target.value))}
                required
              />
              <TextInput
                label="대표자명"
                placeholder="대표자명을 입력하세요"
                size="lg"
                id="biz-rep-name"
                value={businessRepName}
                onChange={(e) => setBusinessRepName(e.target.value)}
                required
              />
              <TextInput
                label="개업일자"
                type="date"
                size="lg"
                id="biz-open-date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                required
              />
            </div>

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep('signup-consent')}>
                이전
              </Button>
              <Button type="submit" size="lg" loading={isBusinessPending}>
                {isBusinessPending ? '처리 중...' : '인증하기'}
              </Button>
            </div>
          </form>
        )}

        {/* ── 회원가입 (유저 정보) ── */}
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
              {/* 아이디 */}
              <InputWrapper
                inputId="signup-id"
                label="아이디"
                required
                successText={idCheckStatus === 'available' ? '사용 가능한 아이디입니다.' : undefined}
                errorText={idCheckStatus === 'taken' ? '이미 사용 중인 아이디입니다.' : undefined}
              >
                <div className="login-card__id-check-row">
                  <InputBase
                    id="signup-id"
                    size="lg"
                    placeholder="아이디를 입력하세요"
                    autoComplete="username"
                    value={signupId}
                    onChange={(e) => { setSignupId(e.target.value); setIdCheckStatus('idle'); }}
                    controlState={
                      idCheckStatus === 'taken' ? 'error' :
                      idCheckStatus === 'available' ? 'success' : ''
                    }
                  />
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    loading={isIdCheckPending}
                    disabled={!signupId || isIdCheckPending}
                    onClick={() => checkIdMutate({ userId: signupId })}
                  >
                    중복확인
                  </Button>
                </div>
              </InputWrapper>

              {/* 비밀번호 */}
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
                required
              />

              {/* 비밀번호 확인 */}
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
                required
              />

              {/* ── 이메일 인증 (하단) ── */}
              <InputWrapper
                inputId="signup-email"
                label="이메일"
                required
                errorText={emailError || undefined}
                successText={emailVerified ? '이메일 인증이 완료되었습니다.' : undefined}
              >
                <div className="login-card__id-check-row">
                  <InputBase
                    id="signup-email"
                    type="email"
                    size="lg"
                    placeholder="이메일을 입력하세요"
                    autoComplete="email"
                    value={email}
                    disabled={emailFieldDisabled}
                    controlState={emailError ? 'error' : emailVerified ? 'success' : emailFieldDisabled ? 'disabled' : ''}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  />
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    disabled={emailVerified}
                    onClick={handleSendEmailCode}
                  >
                    {emailSent && emailTimerSeconds > 0 ? '재전송' : '인증'}
                  </Button>
                </div>
              </InputWrapper>

              {emailSent && !emailVerified && (
                <>
                  <InputWrapper
                    inputId="signup-email-code"
                    label="인증 코드"
                    required
                    errorText={emailCodeError || undefined}
                  >
                    <>
                      <div className="login-card__id-check-row">
                        <InputBase
                          id="signup-email-code"
                          size="lg"
                          placeholder="인증 코드를 입력하세요"
                          value={emailVerifyCode}
                          disabled={emailTimerSeconds === 0}
                          controlState={emailCodeError ? 'error' : emailTimerSeconds === 0 ? 'disabled' : ''}
                          onChange={(e) => { setEmailVerifyCode(e.target.value); setEmailCodeError(''); }}
                        />
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          disabled={emailTimerSeconds === 0}
                          onClick={handleVerifyEmailCode}
                        >
                          확인
                        </Button>
                      </div>
                      {emailTimerSeconds > 0 ? (
                        <span className="signup-timer">
                          <Icon id="i-clock" size={13} />
                          남은 시간 {formatTimer(emailTimerSeconds)}
                        </span>
                      ) : (
                        <span className="signup-timer signup-timer--expired">
                          <Icon id="i-clock" size={13} />
                          인증 시간이 만료되었습니다. 이메일을 다시 입력 후 재시도해주세요.
                        </span>
                      )}
                    </>
                  </InputWrapper>
                </>
              )}
            </div>

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep('signup-business')}>
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

        {/* ── 비밀번호 찾기 — 아이디·이메일 입력 ── */}
        {step === 'find-password' && (
          <form className="login-card__body" onSubmit={handleFindPasswordSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">비밀번호 찾기</h1>
              <p className="login-card__subheading">가입 시 등록한 아이디와 이메일을 입력하세요.</p>
            </div>

            {findError && (
              <FormAlert type="error" description={findError} dismissible onDismiss={() => setFindError('')} />
            )}

            <div className="login-card__fields">
              <TextInput
                label="아이디"
                placeholder="아이디를 입력하세요"
                size="lg"
                id="find-id"
                autoComplete="username"
                value={findId}
                onChange={(e) => setFindId(e.target.value)}
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
                onChange={(e) => setFindEmail(e.target.value)}
                isError={!!findError}
              />
            </div>

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={goToLogin}>취소</Button>
              <Button type="submit" size="lg" loading={isFindPending}>
                {isFindPending ? '처리 중...' : '인증 코드 받기'}
              </Button>
            </div>
          </form>
        )}

        {/* ── 비밀번호 찾기 — 인증 코드 입력 ── */}
        {step === 'find-password-verify' && (
          <form className="login-card__body" onSubmit={handleVerifyCodeSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">인증 코드 확인</h1>
              <p className="login-card__subheading">이메일로 발송된 인증 코드를 입력하세요.</p>
            </div>

            {findError && (
              <FormAlert type="error" description={findError} dismissible onDismiss={() => setFindError('')} />
            )}

            <div className="login-card__fields">
              <TextInput
                label="인증 코드"
                placeholder="인증 코드를 입력하세요"
                size="lg"
                id="verify-code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                isError={!!findError}
              />
            </div>

            <div className="login-card__consent-actions">
              <Button type="button" variant="outline" size="lg" onClick={() => { setFindError(''); setStep('find-password'); }}>이전</Button>
              <Button type="submit" size="lg" loading={isVerifyPending}>
                {isVerifyPending ? '확인 중...' : '확인'}
              </Button>
            </div>
          </form>
        )}

        {/* ── 비밀번호 찾기 완료 ── */}
        {step === 'find-password-complete' && (
          <div className="login-card__body">
            <div className="login-card__title">
              <h1 className="login-card__heading">인증 완료</h1>
            </div>
            <div className="login-card__locked-messages">
              <p className="login-card__subheading">인증이 완료되었습니다.</p>
              <p className="login-card__locked-desc">임시 비밀번호가 이메일로 발송되었습니다.</p>
            </div>
            <Button type="button" size="lg" className="login-card__submit" onClick={goToLogin}>
              로그인하러 가기
            </Button>
          </div>
        )}
      </div>

      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>

      <SimpleDefaultModal
        open={resultModal.open}
        title={resultModal.title}
        description={resultModal.description}
        primaryAction={{ label: '확인', onClick: resultModal.onConfirm }}
        onClose={resultModal.onConfirm}
      />
    </main>
  );
}
