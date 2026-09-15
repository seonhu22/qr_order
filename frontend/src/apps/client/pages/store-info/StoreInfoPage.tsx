import './StoreInfoPage.css';
import { useEffect, useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { TextInput } from '@/shared/components/input';
import { EditConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { StoreInfoFormCard } from '@/apps/client/features/store-info/components/StoreInfoFormCard';
import {
  EMPTY_STORE_INFO,
  mapStoreInfoResponseToForm,
  toStoreInfoRequest,
} from '@/apps/client/features/store-info/api/storeInfoRequestMapper';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import type { StoreInfo, StoreInfoFieldKey } from '@/apps/client/features/store-info/types';
import {
  pwdChk,
  useGetStoreInfo,
  useSaveStoreInfo,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { StoreInfoRequest } from '@/generated/types/storeInfoRequest';

type NoticeState = { title: string; description: string } | null;

export function StoreInfoPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [storeInfoSysId, setStoreInfoSysId] = useState<string | undefined>();
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(EMPTY_STORE_INFO);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalValues, setOriginalValues] = useState<StoreInfo | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [noticeState, setNoticeState] = useState<NoticeState>(null);

  const setHideBreadcrumb = useClientLayoutStore((s) => s.setHideBreadcrumb);
  const storeInfoQuery = useGetStoreInfo(undefined, {
    query: {
      enabled: isAuthenticated,
    },
  });
  const saveMutation = useSaveStoreInfo();

  const isDirty =
    isEditMode &&
    originalValues !== null &&
    JSON.stringify(storeInfo) !== JSON.stringify(originalValues);

  usePreventLeave(isDirty);

  useEffect(() => {
    setHideBreadcrumb(!isAuthenticated);
    return () => setHideBreadcrumb(false);
  }, [isAuthenticated, setHideBreadcrumb]);

  useEffect(() => {
    if (!isAuthenticated || isEditMode) return;

    const currentStoreInfo = storeInfoQuery.data?.[0];
    if (!currentStoreInfo) return;

    setStoreInfoSysId(currentStoreInfo.sysId);
    setStoreInfo(mapStoreInfoResponseToForm(currentStoreInfo));
    setOriginalValues(null);
  }, [isAuthenticated, isEditMode, storeInfoQuery.data]);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await pwdChk({ pwd: password });
      if (result === true) {
        setPasswordError('');
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setPasswordError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setPasswordError('인증 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEditMode = (next: boolean) => {
    if (!next && isDirty) {
      setIsDirtyWarningOpen(true);
      return;
    }
    if (next) {
      setOriginalValues({ ...storeInfo });
    } else {
      setOriginalValues(null);
    }
    setIsEditMode(next);
  };

  const handleChangeField = (key: StoreInfoFieldKey, value: string) => {
    setStoreInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscardChanges = () => {
    setIsDirtyWarningOpen(false);
    setStoreInfo(originalValues!);
    setOriginalValues(null);
    setIsEditMode(false);
  };

  const handleSaveConfirm = async () => {
    if (!storeInfoSysId) {
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: '매장 정보 식별자를 확인하지 못했습니다. 다시 조회 후 시도해주세요.',
      });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        data: toStoreInfoRequest(storeInfo, storeInfoSysId) as StoreInfoRequest,
      });
      await storeInfoQuery.refetch();
      setIsSaveConfirmOpen(false);
      setIsEditMode(false);
      setOriginalValues(null);
      setNoticeState({ title: '알림', description: '저장되었습니다.' });
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    }
  };

  if (isAuthenticated) {
    return (
      <section className="store-info-page" aria-label="매장 기본 정보">
        <StoreInfoFormCard
          values={storeInfo}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onChangeField={handleChangeField}
          onSave={() => setIsSaveConfirmOpen(true)}
        />

        <EditConfirmModal
          open={isSaveConfirmOpen}
          title="수정하시겠습니까?"
          description="변경된 내용이 저장됩니다."
          primaryAction={{ loading: saveMutation.isPending, onClick: handleSaveConfirm }}
          secondaryAction={{
            disabled: saveMutation.isPending,
            onClick: () => setIsSaveConfirmOpen(false),
          }}
          onClose={() => setIsSaveConfirmOpen(false)}
        />

        <SimpleDefaultModal
          open={isDirtyWarningOpen}
          title="알림"
          description="페이지를 나가시겠습니까?"
          helperText="수정하신 내용이 저장되지 않았습니다."
          primaryAction={{ label: '확인', onClick: handleDiscardChanges }}
          secondaryAction={{ onClick: () => setIsDirtyWarningOpen(false) }}
          onClose={() => setIsDirtyWarningOpen(false)}
        />

        <SimpleDefaultModal
          open={!!noticeState}
          title={noticeState?.title ?? '알림'}
          description={noticeState?.description}
          onClose={() => setNoticeState(null)}
        />
      </section>
    );
  }

  return (
    <section className="store-info-page" aria-label="매장 기본 정보">
      <div className="store-info-auth-wrapper">
        <div className="store-info-auth-card">
          <div className="store-info-auth-card__body">
            <div className="store-info-auth-card__notice">
              <span className="store-info-auth-icon" aria-hidden="true">
                <Icon id="i-lock" size={24} />
              </span>
              <h3 className="store-info-auth-card__title">매장 정보 접근 인증</h3>
              <p className="store-info-auth-card__subtitle">
                매장 정보를 확인하려면 비밀번호를 입력해주세요.
              </p>
            </div>
            <form className="store-info-auth-form" onSubmit={handleSubmit}>
              <TextInput
                id="store-info-access-password"
                type="password"
                size="lg"
                placeholder="비밀번호를 입력하세요"
                showPasswordToggle
                value={password}
                errorText={passwordError}
                aria-label="비밀번호"
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError('');
                }}
              />
              <Button
                className="store-info-auth-form__submit"
                size="lg"
                type="submit"
                loading={isSubmitting}
              >
                확인
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
