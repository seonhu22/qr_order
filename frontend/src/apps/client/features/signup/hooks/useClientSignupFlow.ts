import { useEffect, useState, type FormEvent } from 'react';
import type { ChkEmailValidParams } from '@/generated/types/chkEmailValidParams';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { EmailValidRequest } from '@/generated/types/emailValidRequest';
import type { SignUpRequest } from '@/generated/types/signUpRequest';
import type { useResultModalFlow } from '@/shared/hooks/useResultModalFlow';
import { isValidEmail } from '@/shared/lib/validators/isValidEmail';
import { validatePasswordPair } from '@/shared/lib/validators/validatePasswordPair';
import {
  buildSignupBusinessVerificationPayload,
  getSignupBusinessVerificationErrorMessage,
  isSignupBusinessVerificationError,
  useSignupBusinessVerificationMutation,
} from '../api/signupBusinessVerificationApi';
import {
  buildSignupEmailCodeRequest,
  isSignupEmailCodeValidationError,
  useSignupEmailCodeResendMutation,
  useSignupEmailCodeSendMutation,
} from '../api/signupEmailCodeApi';
import {
  buildSignupEmailVerifyParams,
  isSignupEmailVerifyValidationError,
  useSignupEmailVerifyMutation,
} from '../api/signupEmailVerifyApi';
import {
  buildSignupIdDuplicateParams,
  isSignupIdDuplicateValidationError,
  mapIdDuplicateResult,
  useSignupIdDuplicateMutation,
} from '../api/signupIdDuplicateApi';
import {
  buildSignupNewUserRequest,
  isSignupNewUserValidationError,
  useSignupNewUserMutation,
} from '../api/signupNewUserApi';
import { getSignupApiErrorMessage } from '../api/signupApiUtils';

type UseClientSignupFlowParams = {
  modal: ReturnType<typeof useResultModalFlow>;
  goToStep: (step: 'login' | 'signup-consent' | 'signup-business' | 'signup' | 'signup-complete') => void;
};

export function useClientSignupFlow({ modal, goToStep }: UseClientSignupFlowParams) {
  const [consentChecked, setConsentChecked] = useState(false);

  const [businessNo, setBusinessNo] = useState('');
  const [businessRepName, setBusinessRepName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [businessError, setBusinessError] = useState('');

  const [signupId, setSignupId] = useState('');
  const [idCheckStatus, setIdCheckStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [signupError, setSignupError] = useState('');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailTimerSeconds, setEmailTimerSeconds] = useState(0);
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailCodeError, setEmailCodeError] = useState('');

  useEffect(() => {
    if (emailTimerSeconds <= 0) return;
    const id = setTimeout(() => setEmailTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [emailTimerSeconds]);

  const { mutate: verifyBusinessMutate, isPending: isBusinessPending } =
    useSignupBusinessVerificationMutation({
      mutation: {
        onSuccess: (data) => {
          if (data.success) {
            setBusinessError('');
            modal.showSuccess({
              title: '인증 완료',
              description: data.message ?? '사업자 인증이 완료되었습니다.',
              onConfirm: () => {
                modal.close();
                goToStep('signup');
              },
            });
            return;
          }

          modal.showError({
            title: '인증 실패',
            description: data.message ?? '사업자 정보를 확인해주세요.',
          });
        },
        onError: (error) => {
          setBusinessError('');
          modal.showError({
            title: '인증 실패',
            description: getSignupBusinessVerificationErrorMessage(error),
          });
        },
      },
    });

  const { mutate: checkIdMutate, isPending: isIdCheckPending } = useSignupIdDuplicateMutation();
  const { mutate: sendEmailCodeMutate, isPending: isEmailSendPending } =
    useSignupEmailCodeSendMutation();
  const { mutate: resendEmailCodeMutate, isPending: isEmailResendPending } =
    useSignupEmailCodeResendMutation();
  const { mutate: verifyEmailCodeMutate, isPending: isEmailVerifyPending } =
    useSignupEmailVerifyMutation();
  const { mutate: signupMutate, isPending: isSignupPending } = useSignupNewUserMutation();

  const isEmailCodePending = isEmailSendPending || isEmailResendPending;
  const emailFieldDisabled = emailSent && !emailVerified && emailTimerSeconds > 0;

  const handleEmailCodeSuccess = () => {
    setEmailError('');
    setEmailSent(true);
    setEmailTimerSeconds(300);
  };

  const handleEmailCodeError = (error: unknown) => {
    setEmailError(getSignupApiErrorMessage(error, '이메일 인증 코드 발송에 실패했습니다.'));
  };

  const handleIdDuplicateSuccess = (isDuplicated: boolean) => {
    setIdCheckStatus(mapIdDuplicateResult(isDuplicated));
  };

  const handleIdDuplicateError = () => {
    setIdCheckStatus('idle');
    setSignupError('아이디 중복 확인에 실패했습니다.');
  };

  const handleEmailVerifySuccess = (isValid: boolean) => {
    if (!isValid) {
      setEmailCodeError('인증 코드가 일치하지 않습니다.');
      return;
    }
    setEmailVerified(true);
    setEmailTimerSeconds(0);
    setEmailCodeError('');
  };

  const handleEmailVerifyError = (error: unknown) => {
    setEmailCodeError(getSignupApiErrorMessage(error, '인증 코드 확인에 실패했습니다.'));
  };

  const handleSignupSuccess = (data: CommonResponse) => {
    if (data.success) {
      modal.showSuccess({
        title: '가입 완료',
        description: '회원가입이 완료되었습니다.\n로그인 후 서비스를 이용하실 수 있습니다.',
        onConfirm: () => {
          modal.close();
          goToStep('signup-complete');
        },
      });
      return;
    }
    setSignupError(data.message ?? '회원가입에 실패했습니다.');
  };

  const handleSignupError = (error: unknown) => {
    modal.showError({
      title: '서버 오류',
      description: getSignupApiErrorMessage(error),
    });
  };

  const runIdDuplicateCheck = (nextSignupId: string) => {
    const params = buildSignupIdDuplicateParams(nextSignupId);
    if (isSignupIdDuplicateValidationError(params)) {
      setSignupError(params.message);
      setIdCheckStatus('idle');
      return;
    }
    setSignupError('');
    checkIdMutate(params, {
      onSuccess: handleIdDuplicateSuccess,
      onError: handleIdDuplicateError,
    });
  };

  const runEmailCodeSend = (variables: { data: EmailValidRequest }, resend: boolean) => {
    const options = { onSuccess: handleEmailCodeSuccess, onError: handleEmailCodeError };
    if (resend) {
      resendEmailCodeMutate(variables, options);
      return;
    }
    sendEmailCodeMutate(variables, options);
  };

  const runEmailVerify = (params: ChkEmailValidParams) => {
    verifyEmailCodeMutate(params, {
      onSuccess: handleEmailVerifySuccess,
      onError: handleEmailVerifyError,
    });
  };

  const runSignup = (request: { data: SignUpRequest }) => {
    signupMutate(request, { onSuccess: handleSignupSuccess, onError: handleSignupError });
  };

  const handleSendEmailCode = () => {
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setEmailError('');
    setEmailVerifyCode('');
    setEmailCodeError('');
    const payload = buildSignupEmailCodeRequest(email);
    if (isSignupEmailCodeValidationError(payload)) {
      setEmailError(payload.message);
      return;
    }
    runEmailCodeSend({ data: payload }, emailSent);
  };

  const handleVerifyEmailCode = () => {
    const params = buildSignupEmailVerifyParams(email, emailVerifyCode);
    if (isSignupEmailVerifyValidationError(params)) {
      setEmailCodeError(params.message);
      return;
    }
    setEmailCodeError('');
    runEmailVerify(params);
  };

  const handleBusinessSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusinessError('');
    const payload = buildSignupBusinessVerificationPayload({
      businessNo,
      businessRepName,
      openDate,
    });
    if (isSignupBusinessVerificationError(payload)) {
      setBusinessError(payload.message);
      return;
    }
    verifyBusinessMutate({ data: payload });
  };

  const handleSignupSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    const passwordValidation = validatePasswordPair(signupPw, signupPwConfirm);
    if (!passwordValidation.ok) {
      setSignupError(passwordValidation.message);
      return;
    }
    const request = buildSignupNewUserRequest({
      businessNo,
      businessRepName,
      openDate,
      signupId,
      signupPw,
      signupPwConfirm,
      email,
      emailVerifyCode,
    });
    if (isSignupNewUserValidationError(request)) {
      setSignupError(request.message);
      return;
    }
    runSignup({ data: request });
  };

  const reset = () => {
    setConsentChecked(false);
    setBusinessNo('');
    setBusinessRepName('');
    setOpenDate('');
    setBusinessError('');
    setSignupId('');
    setIdCheckStatus('idle');
    setSignupPw('');
    setSignupPwConfirm('');
    setEmail('');
    setEmailError('');
    setEmailSent(false);
    setEmailVerified(false);
    setEmailTimerSeconds(0);
    setEmailVerifyCode('');
    setEmailCodeError('');
    setSignupError('');
  };

  return {
    signupConsent: {
      consentChecked,
      onConsentChange: setConsentChecked,
      onCancel: () => {
        reset();
        goToStep('login');
      },
      onNext: () => goToStep('signup-business'),
    },
    signupBusiness: {
      businessNo,
      businessRepName,
      openDate,
      businessError,
      isPending: isBusinessPending,
      onBusinessNoChange: setBusinessNo,
      onBusinessRepNameChange: setBusinessRepName,
      onOpenDateChange: setOpenDate,
      onClearError: () => setBusinessError(''),
      onPrev: () => goToStep('signup-consent'),
      onSubmit: handleBusinessSubmit,
    },
    signup: {
      signupId,
      signupPw,
      signupPwConfirm,
      signupError,
      idCheckStatus,
      isIdCheckPending,
      email,
      emailError,
      emailVerified,
      emailFieldDisabled,
      emailSent,
      emailTimerSeconds,
      emailVerifyCode,
      emailCodeError,
      isEmailCodePending,
      isEmailVerifyPending,
      isSignupPending,
      onSignupIdChange: (value: string) => {
        setSignupId(value);
        setIdCheckStatus('idle');
      },
      onSignupPwChange: setSignupPw,
      onSignupPwConfirmChange: setSignupPwConfirm,
      onEmailChange: (value: string) => {
        setEmail(value);
        setEmailError('');
      },
      onEmailVerifyCodeChange: (value: string) => {
        setEmailVerifyCode(value);
        setEmailCodeError('');
      },
      onClearSignupError: () => setSignupError(''),
      onIdDuplicateCheck: () => runIdDuplicateCheck(signupId),
      onSendEmailCode: handleSendEmailCode,
      onVerifyEmailCode: handleVerifyEmailCode,
      onPrev: () => goToStep('signup-business'),
      onSubmit: handleSignupSubmit,
    },
    signupComplete: {
      onGoLogin: () => {
        reset();
        goToStep('login');
      },
    },
    reset,
  };
}
