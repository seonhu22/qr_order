/**
 * @fileoverview 매장 기본 정보 폼 카드
 *
 * @description
 * - 카드 헤더: 좌측 타이틀 "매장 정보" + 우측 "정보 수정" 체크박스 (편집 모드 토글)
 * - 카드 본문: STORE_INFO_FIELDS 메타데이터를 기반으로 TextInput 9개 렌더
 *   - 사업자 인증 정보(editable=false)는 항상 read-only
 *   - 편집 가능 필드는 isEditMode === false 일 때 read-only로 잠금
 * - 카드 푸터: 우측 정렬 "저장" 버튼 (편집 모드일 때만 활성)
 */

import './StoreInfoFormCard.css';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { TextInput } from '@/shared/components/input';
import { STORE_INFO_FIELDS, type StoreInfo, type StoreInfoFieldKey } from '../types';

type StoreInfoFormCardProps = {
  values: StoreInfo;
  isEditMode: boolean;
  onToggleEditMode: (next: boolean) => void;
  onChangeField: (key: StoreInfoFieldKey, value: string) => void;
  onSave: () => void;
};

export function StoreInfoFormCard({
  values,
  isEditMode,
  onToggleEditMode,
  onChangeField,
  onSave,
}: StoreInfoFormCardProps) {
  return (
    <article className="store-info-card" aria-label="매장 정보">
      <header className="store-info-card__header">
        <h2 className="store-info-card__title">매장 정보</h2>
        <CheckboxInput
          label="정보 수정"
          size="sm"
          checked={isEditMode}
          onChange={onToggleEditMode}
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
              onChange={(event) => onChangeField(field.key, event.target.value)}
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
          onClick={onSave}
        >
          저장
        </Button>
      </footer>
    </article>
  );
}
