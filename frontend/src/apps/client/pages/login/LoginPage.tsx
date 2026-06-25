import '@/shared/styles/login.css';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';
import { useClientLoginPage } from '@/apps/client/features/login/hooks/useClientLoginPage';
import { LoginForm } from '@/apps/client/features/login/components/LoginForm';
import { ChangePasswordForm } from '@/apps/client/features/login/components/ChangePasswordForm';
import { SignupConsent } from '@/apps/client/features/signup/components/SignupConsent';
import { SignupBusinessForm } from '@/apps/client/features/signup/components/SignupBusinessForm';
import { SignupForm } from '@/apps/client/features/signup/components/SignupForm';
import { SignupComplete } from '@/apps/client/features/signup/components/SignupComplete';
import { FindPasswordForm } from '@/apps/client/features/password-reset/components/FindPasswordForm';
import { FindPasswordVerify } from '@/apps/client/features/password-reset/components/FindPasswordVerify';
import { FindPasswordReset } from '@/apps/client/features/password-reset/components/FindPasswordReset';
import { FindPasswordComplete } from '@/apps/client/features/password-reset/components/FindPasswordComplete';

export default function LoginPage() {
  const {
    step,
    isWide,
    ariaLabel,
    resultModal,
    login,
    changePassword,
    signupConsent,
    signupBusiness,
    signup,
    signupComplete,
    findPassword,
    findPasswordVerify,
    findPasswordReset,
    findPasswordComplete,
  } = useClientLoginPage();

  return (
    <main className="login-page login-page--client">
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      <div
        className={`login-card${isWide ? ' login-card--wide' : ''}`}
        role="region"
        aria-label={ariaLabel}
      >
        <header className="login-card__header">
          <ClientBrand />
        </header>

        {step === 'login' && <LoginForm {...login} />}
        {step === 'change-password' && <ChangePasswordForm {...changePassword} />}
        {step === 'signup-consent' && <SignupConsent {...signupConsent} />}
        {step === 'signup-business' && <SignupBusinessForm {...signupBusiness} />}
        {step === 'signup' && <SignupForm {...signup} />}
        {step === 'signup-complete' && <SignupComplete {...signupComplete} />}
        {step === 'find-password' && <FindPasswordForm {...findPassword} />}
        {step === 'find-password-verify' && <FindPasswordVerify {...findPasswordVerify} />}
        {step === 'find-password-reset' && <FindPasswordReset {...findPasswordReset} />}
        {step === 'find-password-complete' && <FindPasswordComplete {...findPasswordComplete} />}
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
