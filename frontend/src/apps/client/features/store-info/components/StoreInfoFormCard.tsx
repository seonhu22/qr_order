/**
 * @fileoverview 매장 기본 정보 폼 카드
 *
 * @description
 * - 카드 헤더: 좌측 타이틀 "매장 정보" + 우측 "정보 수정" 체크박스 (편집 모드 토글)
 * - 카드 본문: STORE_INFO_FIELDS 메타데이터를 기반으로 TextInput 렌더
 *   - 사업자 인증 정보(editable=false)는 항상 read-only
 *   - 편집 가능 필드는 isEditMode === false 일 때 read-only로 잠금
 * - 카드 푸터: 우측 정렬 "저장" 버튼 (편집 모드일 때만 활성)
 * - 저장 클릭 시 필수 필드 미입력 여부를 검증하고 errorText를 노출한다
 */

import './StoreInfoFormCard.css';
import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { TextInput } from '@/shared/components/input';
import { STORE_INFO_FIELDS, type StoreInfo, type StoreInfoFieldKey } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StoreInfoFormCardProps = {
  values: StoreInfo;
  isEditMode: boolean;
  onToggleEditMode: (next: boolean) => void;
  onChangeField: (key: StoreInfoFieldKey, value: string) => void;
  onSave: () => void;
};

type StoreInfoErrors = Partial<Record<StoreInfoFieldKey, string>>;

export function StoreInfoFormCard({
  values,
  isEditMode,
  onToggleEditMode,
  onChangeField,
  onSave,
}: StoreInfoFormCardProps) {
  const [errors, setErrors] = useState<StoreInfoErrors>({});

  const handleToggleEditMode = (next: boolean) => {
    if (!next) {
      setErrors({});
    }
    onToggleEditMode(next);
  };

  const handleSave = () => {
    const nextErrors: StoreInfoErrors = {};

    STORE_INFO_FIELDS.forEach((field) => {
      if (field.required && field.editable && !values[field.key].trim()) {
        nextErrors[field.key] = `${field.label}을(를) 입력해주세요.`;
      } else if (field.inputType === 'email' && values[field.key] && !EMAIL_REGEX.test(values[field.key])) {
        nextErrors[field.key] = '올바른 이메일 형식이 아닙니다.';
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave();
  };

  const handleChange = (key: StoreInfoFieldKey, value: string) => {
    const fieldMeta = STORE_INFO_FIELDS.find((f) => f.key === key);
    const processedValue = fieldMeta?.inputType === 'tel' ? value.replace(/[^0-9]/g, '') : value;

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    onChangeField(key, processedValue);
  };

  return (
    <article className="store-info-card" aria-label="매장 정보">
      <header className="store-info-card__header">
        <h2 className="store-info-card__title">매장 정보</h2>
        <CheckboxInput
          label="정보 수정"
          size="sm"
          checked={isEditMode}
          onChange={handleToggleEditMode}
        />
      </header>

      <div className="store-info-card__body">
        {STORE_INFO_FIELDS.map((field) => {
          const isReadOnly = !field.editable || !isEditMode;
          return (
            <TextInput
              key={field.key}
              id={`store-info-${field.key}`}
              className="store-info-card__field"
              label={field.label}
              required={field.required}
              type={field.inputType ?? 'text'}
              value={values[field.key]}
              readOnly={isReadOnly}
              errorText={errors[field.key]}
              onChange={(event) => handleChange(field.key, event.target.value)}
            />
          );
        })}
      </div>

      <footer className="store-info-card__footer">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!isEditMode}
          onClick={handleSave}
        >
          저장
        </Button>
      </footer>
    </article>
  );
}
