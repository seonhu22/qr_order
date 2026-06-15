import './StoreInfoPage.css';
import { FormEvent, useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { TextInput } from '@/shared/components/input';
import { WrapperModal } from '@/shared/components/modal';
import { StoreInfoFormCard } from '@/apps/client/features/store-info/components/StoreInfoFormCard';
import { STORE_INFO_MOCK } from '@/apps/client/features/store-info/mock/storeInfoMock';
import type { StoreInfo, StoreInfoFieldKey } from '@/apps/client/features/store-info/types';

export function StoreInfoPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [storeInfo, setStoreInfo] = useState<StoreInfo>(STORE_INFO_MOCK);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    setPasswordError('');
    setIsAuthenticated(true);
    setPassword('');
  };

  const handleChangeField = (key: StoreInfoFieldKey, value: string) => {
    setStoreInfo((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="store-info-page" aria-label="매장 기본 정보">
      {isAuthenticated ? (
        <StoreInfoFormCard
          values={storeInfo}
          isEditMode={isEditMode}
          onToggleEditMode={setIsEditMode}
          onChangeField={handleChangeField}
          onSave={() => {}}
        />
      ) : null}

      <WrapperModal
        closeOnOverlayClick={false}
        icon={
          <span className="store-info-access-modal__icon" aria-hidden="true">
            <Icon id="i-lock" size={24} />
          </span>
        }
        layout="notice"
        open={!isAuthenticated}
        size="md"
        subtitle="매장 정보를 확인하려면 비밀번호를 입력해주세요."
        title="매장 정보 접근 인증"
        onClose={() => {}}
      >
        <form className="store-info-access-modal__form" onSubmit={handleSubmit}>
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
          <Button className="store-info-access-modal__submit" size="lg" type="submit">
            확인
          </Button>
        </form>
      </WrapperModal>
    </section>
  );
}
