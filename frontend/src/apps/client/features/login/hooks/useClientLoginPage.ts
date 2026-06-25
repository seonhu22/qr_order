/**
 * @fileoverview 클라이언트 로그인 페이지 오케스트레이션 훅
 *
 * @description
 * - 10개 step (login, change-password, signup 4단, find-password 4단)을 한 곳에서 관리
 * - step 그룹별 상태/핸들러를 묶어 반환 → 페이지는 각 그룹을 컴포넌트에 spread
 * - sessionStorage 복원은 마운트 1회 (lazy init)
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import type { ChkEmailValidParams } from '@/generated/types/chkEmailValidParams';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { EmailValidRequest } from '@/generated/types/emailValidRequest';
import type { SignUpRequest } from '@/generated/types/signUpRequest';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthLoginMutation } from '@/shared/auth/hooks/useAuthLoginMutation';
import { useInitPwdActiveMutation } from '@/shared/auth/hooks/useInitPwdActiveMutation';
import {
  getAuthResponseData,
  hasInitialPasswordRequirementSignal,
  isInitialPasswordChangeRequired,
} from '@/shared/auth/initPassword';
import {
  buildSignupBusinessVerificationPayload,
  getSignupBusinessVerificationErrorMessage,
  isSignupBusinessVerificationError,
  useSignupBusinessVerificationMutation,
} from '@/apps/client/features/signup/api/signupBusinessVerificationApi';
import {
  buildSignupEmailCodeRequest,
  isSignupEmailCodeValidationError,
  useSignupEmailCodeResendMutation,
  useSignupEmailCodeSendMutation,
} from '@/apps/client/features/signup/api/signupEmailCodeApi';
import {
  buildSignupEmailVerifyParams,
  isSignupEmailVerifyValidationError,
  useSignupEmailVerifyMutation,
} from '@/apps/client/features/signup/api/signupEmailVerifyApi';
import {
  buildSignupIdDuplicateParams,
  isSignupIdDuplicateValidationError,
  mapIdDuplicateResult,
  useSignupIdDuplicateMutation,
} from '@/apps/client/features/signup/api/signupIdDuplicateApi';
import {
  buildSignupNewUserRequest,
  isSignupNewUserValidationError,
  useSignupNewUserMutation,
} from '@/apps/client/features/signup/api/signupNewUserApi';
import { getSignupApiErrorMessage } from '@/apps/client/features/signup/api/signupApiUtils';
import {
  buildSendPwdChangeCodeRequest,
  isSendPwdChangeCodeValidationError,
  useReSendPwdChangeCodeMutation,
  useSendPwdChangeCodeMutation,
} from '@/apps/client/features/password-reset/api/sendPwdChangeCodeApi';
import {
  buildVerifyPwdChangeRequest,
  isVerifyPwdChangeValidationError,
  useVerifyPwdChangeMutation,
} from '@/apps/client/features/password-reset/api/verifyPwdChangeApi';
import {
  buildChangePwdRequest,
  isChangePwdValidationError,
  useChangePwdMutation,
} from '@/apps/client/features/password-reset/api/changePwdApi';
import {
  clearPasswordResetState,
  readPasswordResetState,
  writePasswordResetState,
} from '@/apps/client/features/password-reset/utils/passwordResetStorage';
import type { Step } from '../types';
import { getAriaLabel } from '../utils/getAriaLabel';

const SAVED_ID_KEY = 'client_saved_userId';

type ResultModalState = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
};

export function useClientLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // sessionStorage는 마운트 1회만 읽음
  const [initialPasswordResetState] = useState(() => readPasswordResetState());

  // Step
  const [step, setStep] = useState<Step>(initialPasswordResetState?.step ?? 'login');

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

  // 결과 모달
  const [resultModal, setResultModal] = useState<ResultModalState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const closeResultModal = () => setResultModal((prev) => ({ ...prev, open: false }));

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
  const [findId, setFindId] = useState(initialPasswordResetState?.userId ?? '');
  const [findEmail, setFindEmail] = useState(initialPasswordResetState?.email ?? '');
  const [verifyCode, setVerifyCode] = useState('');
  const [findError, setFindError] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');

  // 이메일 인증 타이머
  useEffect(() => {
    if (emailTimerSeconds <= 0) return;
    const id = setTimeout(() => setEmailTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [emailTimerSeconds]);

  const emailFieldDisabled = emailSent && !emailVerified && emailTimerSeconds > 0;

  const refetchCurrentUser = async () => {
    const meData = await getCurrentUser();
    queryClient.setQueryData(queryKeys.auth.me, meData);
    return getAuthResponseData(meData);
  };

  // ── Mutations ──
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
            setLoggedInUserId(
              typeof responseData?.userId === 'string' ? responseData.userId : userId,
            );
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

  const { mutate: changePasswordMutate, isPending: isChangePending } = useInitPwdActiveMutation();

  const { mutate: verifyBusinessMutate, isPending: isBusinessPending } =
    useSignupBusinessVerificationMutation({
      mutation: {
        onSuccess: (data) => {
          if (data.success) {
            setBusinessError('');
            setResultModal({
              open: true,
              title: '인증 완료',
              description: data.message ?? '사업자 인증이 완료되었습니다.',
              onConfirm: () => {
                closeResultModal();
                setStep('signup');
              },
            });
            return;
          }
          setResultModal({
            open: true,
            title: '인증 실패',
            description: data.message ?? '사업자 정보를 확인해주세요.',
            onConfirm: closeResultModal,
          });
        },
        onError: (error) => {
          setBusinessError('');
          setResultModal({
            open: true,
            title: '인증 실패',
            description: getSignupBusinessVerificationErrorMessage(error),
            onConfirm: closeResultModal,
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
  const { mutate: sendPwdChangeCodeMutate, isPending: isFindSendPending } =
    useSendPwdChangeCodeMutation();
  const { mutate: reSendPwdChangeCodeMutate, isPending: isFindResendPending } =
    useReSendPwdChangeCodeMutation();
  const { mutate: verifyPwdChangeMutate, isPending: isFindVerifyPending } =
    useVerifyPwdChangeMutation();
  const { mutate: changePwdMutate, isPending: isResetPending } = useChangePwdMutation();

  const isEmailCodePending = isEmailSendPending || isEmailResendPending;
  const isFindSendingCode = isFindSendPending || isFindResendPending;

  // ── 핸들러 ──
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
      setResultModal({
        open: true,
        title: '가입 완료',
        description: '회원가입이 완료되었습니다.\n로그인 후 서비스를 이용하실 수 있습니다.',
        onConfirm: () => {
          closeResultModal();
          setStep('signup-complete');
        },
      });
      return;
    }
    setSignupError(data.message ?? '회원가입에 실패했습니다.');
  };

  const handleSignupError = (error: unknown) => {
    setResultModal({
      open: true,
      title: '서버 오류',
      description: getSignupApiErrorMessage(error),
      onConfirm: closeResultModal,
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    loginMutate({ data: { userId, userPassword } });
  };

  const handleChangePasswordSuccess = (data: { success?: boolean; message?: string | null }) => {
    if (data.success) {
      setResultModal({
        open: true,
        title: '알림',
        description: '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요.',
        onConfirm: () => {
          closeResultModal();
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
        onConfirm: closeResultModal,
      });
    }
  };

  const handleChangePasswordError = () => {
    setResultModal({
      open: true,
      title: '비밀번호 변경 실패',
      description: '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
      onConfirm: closeResultModal,
    });
  };

  const handleChangePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    changePasswordMutate(
      {
        data: { password: newPassword, chkPassword: newPasswordConfirm },
        params: { userId: loggedInUserId },
      },
      { onSuccess: handleChangePasswordSuccess, onError: handleChangePasswordError },
    );
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

  const handleFindPasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildSendPwdChangeCodeRequest({ userId: findId, email: findEmail });
    if (isSendPwdChangeCodeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    sendPwdChangeCodeMutate(
      { data: payload },
      {
        onSuccess: () => {
          setVerifyCode('');
          writePasswordResetState({
            step: 'find-password-verify',
            userId: payload.userId ?? '',
            email: payload.email ?? '',
          });
          setStep('find-password-verify');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드 발송에 실패했습니다.'));
        },
      },
    );
  };

  const handleResendVerifyCode = () => {
    setFindError('');
    const payload = buildSendPwdChangeCodeRequest({ userId: findId, email: findEmail });
    if (isSendPwdChangeCodeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    reSendPwdChangeCodeMutate(
      { data: payload },
      {
        onSuccess: () => {
          writePasswordResetState({
            step: 'find-password-verify',
            userId: payload.userId ?? '',
            email: payload.email ?? '',
          });
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드 재발송에 실패했습니다.'));
        },
      },
    );
  };

  const handleVerifyCodeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildVerifyPwdChangeRequest({ email: findEmail, validCode: verifyCode });
    if (isVerifyPwdChangeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    verifyPwdChangeMutate(
      { data: payload },
      {
        onSuccess: () => {
          setResetPw('');
          setResetPwConfirm('');
          writePasswordResetState({
            step: 'find-password-reset',
            userId: findId.trim(),
            email: findEmail.trim(),
          });
          setStep('find-password-reset');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드가 일치하지 않습니다.'));
        },
      },
    );
  };

  const handleVerifyCodeBack = () => {
    setFindError('');
    writePasswordResetState({
      step: 'find-password',
      userId: findId.trim(),
      email: findEmail.trim(),
    });
    setStep('find-password');
  };

  const handleResetPasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildChangePwdRequest({
      userId: findId,
      pwd: resetPw,
      pwdConfirm: resetPwConfirm,
    });
    if (isChangePwdValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    changePwdMutate(
      { data: payload },
      {
        onSuccess: (data) => {
          if (data.success) {
            clearPasswordResetState();
            setStep('find-password-complete');
            return;
          }
          setFindError(data.message ?? '비밀번호 변경에 실패했습니다.');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '비밀번호 변경에 실패했습니다.'));
        },
      },
    );
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
    if (signupPw !== signupPwConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.');
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

  const goToLogin = () => {
    clearPasswordResetState();
    setStep('login');
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
    setFindId('');
    setFindEmail('');
    setVerifyCode('');
    setFindError('');
    setResetPw('');
    setResetPwConfirm('');
  };

  return {
    step,
    isWide: step !== 'login' && step !== 'change-password',
    ariaLabel: getAriaLabel(step),
    resultModal,
    login: {
      userId,
      userPassword,
      saveId,
      loginError,
      isPending: isLoginPending,
      onUserIdChange: setUserId,
      onUserPasswordChange: setUserPassword,
      onSaveIdChange: setSaveId,
      onClearError: () => setLoginError(''),
      onSubmit: handleLoginSubmit,
      onGoFindPassword: () => setStep('find-password'),
      onGoSignup: () => setStep('signup-consent'),
    },
    changePassword: {
      newPassword,
      newPasswordConfirm,
      changePasswordError,
      isPending: isChangePending,
      onNewPasswordChange: setNewPassword,
      onNewPasswordConfirmChange: setNewPasswordConfirm,
      onClearError: () => setChangePasswordError(''),
      onSubmit: handleChangePasswordSubmit,
    },
    signupConsent: {
      consentChecked,
      onConsentChange: setConsentChecked,
      onCancel: goToLogin,
      onNext: () => setStep('signup-business'),
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
      onPrev: () => setStep('signup-consent'),
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
      onPrev: () => setStep('signup-business'),
      onSubmit: handleSignupSubmit,
    },
    signupComplete: {
      onGoLogin: goToLogin,
    },
    findPassword: {
      findId,
      findEmail,
      findError,
      isPending: isFindSendPending,
      onFindIdChange: setFindId,
      onFindEmailChange: setFindEmail,
      onClearError: () => setFindError(''),
      onCancel: goToLogin,
      onSubmit: handleFindPasswordSubmit,
    },
    findPasswordVerify: {
      verifyCode,
      findError,
      isVerifyPending: isFindVerifyPending,
      isResendPending: isFindResendPending,
      isSendingCode: isFindSendingCode,
      onVerifyCodeChange: setVerifyCode,
      onClearError: () => setFindError(''),
      onResend: handleResendVerifyCode,
      onBack: handleVerifyCodeBack,
      onSubmit: handleVerifyCodeSubmit,
    },
    findPasswordReset: {
      resetPw,
      resetPwConfirm,
      findError,
      isPending: isResetPending,
      onResetPwChange: setResetPw,
      onResetPwConfirmChange: setResetPwConfirm,
      onClearError: () => setFindError(''),
      onCancel: goToLogin,
      onSubmit: handleResetPasswordSubmit,
    },
    findPasswordComplete: {
      onGoLogin: goToLogin,
    },
  };
}
