/**
 * @fileoverview BaseModal 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/modal)
 * - BaseModal의 주요 시나리오와 props 조합을 빠르게 검증
 *
 * @module dev/ModalGuide
 */

import { useMemo, useState } from 'react';
import { BaseModal } from '@/shared/components/modal';
import { ModalSize } from '@/shared/components/modal/modalType';
import './devStyles/ModalGuide.css';

type Preset = {
  key: string;
  label: string;
  title: string;
  size: ModalSize;
  primaryDescription?: string;
  secondaryDescription?: string;
  closeOnOverlayClick?: boolean;
  primaryLabel?: string;
  onConfirmType?: 'default-close' | 'custom-close';
};

const PRESETS: Preset[] = [
  {
    key: 'default',
    label: '기본 모달',
    title: '기본 안내',
    size: 'sm',
    primaryDescription: '가장 기본적인 안내 모달입니다.',
    primaryLabel: '확인',
    onConfirmType: 'default-close',
  },
  {
    key: 'double-description',
    label: '설명 2줄',
    title: '주문 취소 확인',
    size: 'md',
    primaryDescription: '진행 중인 주문을 취소하시겠습니까?',
    secondaryDescription: '취소 후에는 되돌릴 수 없습니다.',
    primaryLabel: '취소하기',
    onConfirmType: 'custom-close',
  },
  {
    key: 'secondary-empty',
    label: 'secondaryDescription 빈값',
    title: '빈 문자열 처리',
    size: 'sm',
    primaryDescription: 'secondaryDescription이 빈 문자열이면 노출되지 않습니다.',
    secondaryDescription: '',
    primaryLabel: '확인',
    onConfirmType: 'default-close',
  },
  {
    key: 'overlay-locked',
    label: '오버레이 닫기 비활성',
    title: '강제 확인 필요',
    size: 'md',
    primaryDescription: '오버레이를 클릭해도 닫히지 않습니다.',
    secondaryDescription: '닫기(X) 또는 확인 버튼으로만 종료할 수 있습니다.',
    closeOnOverlayClick: false,
    primaryLabel: '확인',
    onConfirmType: 'custom-close',
  },
  {
    key: 'size-sm',
    label: '사이즈 sm',
    title: 'Small Modal',
    size: 'sm',
    primaryDescription: 'sm 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-md',
    label: '사이즈 md',
    title: 'Medium Modal',
    size: 'md',
    primaryDescription: 'md 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-lg',
    label: '사이즈 lg',
    title: 'Large Modal',
    size: 'lg',
    primaryDescription: 'lg 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-xl',
    label: '사이즈 xl',
    title: 'X-Large Modal',
    size: 'xl',
    primaryDescription: 'xl 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
];

const A11Y_CHECK_ITEMS = [
  'Esc 키 입력 시 모달이 닫히는지 확인',
  'overlay 닫기 비활성 옵션에서 배경 클릭으로 닫히지 않는지 확인',
  '모달 내부 클릭 시 overlay click 이벤트가 전파되지 않는지 확인',
  'role="dialog", aria-modal, aria-label 속성이 유지되는지 확인',
];

const BUTTON_MIGRATION_NOTES = [
  '닫기(X) 버튼: IconButton 도입 시 BaseModal의 close 버튼 영역부터 교체',
  '확인 버튼: Button 도입 시 base-modal__confirm 스타일 대응 variant 정의',
  '교체 후에도 onConfirm 미지정 시 onClose fallback 동작 유지',
];

function GuideCard({
  label,
  description,
  onOpen,
}: {
  label: string;
  description: string;
  onOpen: () => void;
}) {
  return (
    <div className="modal-guide__card">
      <p className="modal-guide__card-label">{label}</p>
      <p className="modal-guide__card-description">{description}</p>
      <button className="modal-guide__card-button" type="button" onClick={onOpen}>
        모달 열기
      </button>
    </div>
  );
}

export default function ModalGuide() {
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);
  const [confirmCount, setConfirmCount] = useState(0);

  const activePreset = useMemo(
    () => PRESETS.find((preset) => preset.key === activePresetKey) ?? null,
    [activePresetKey],
  );

  const closeModal = () => {
    setActivePresetKey(null);
  };

  const handleConfirm = () => {
    if (!activePreset || activePreset.onConfirmType === 'default-close') {
      return undefined;
    }

    setConfirmCount((count) => count + 1);
    closeModal();
    return undefined;
  };

  return (
    <div className="modal-guide">
      <div className="modal-guide__container">
        <div className="modal-guide__header">
          <h1 className="modal-guide__title">BaseModal Guide</h1>
          <p className="modal-guide__subtitle">개발 전용 미리보기 · /dev/modal</p>
          <p className="modal-guide__meta">custom confirm 호출 횟수: {confirmCount}</p>
        </div>

        <section className="modal-guide__section">
          <h2 className="modal-guide__section-title">Variants</h2>
          <div className="modal-guide__grid">
            {PRESETS.map((preset) => (
              <GuideCard
                key={preset.key}
                label={preset.label}
                description={`size=${preset.size}, overlay=${preset.closeOnOverlayClick ?? true}`}
                onOpen={() => setActivePresetKey(preset.key)}
              />
            ))}
          </div>
        </section>

        <section className="modal-guide__section">
          <h2 className="modal-guide__section-title">Accessibility Checklist</h2>
          <ul className="modal-guide__checklist">
            {A11Y_CHECK_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="modal-guide__section">
          <h2 className="modal-guide__section-title">Shared Button Migration</h2>
          <ul className="modal-guide__checklist">
            {BUTTON_MIGRATION_NOTES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {activePreset && (
        <BaseModal
          open={Boolean(activePreset)}
          title={activePreset.title}
          primaryLabel={activePreset.primaryLabel}
          primaryDescription={activePreset.primaryDescription}
          secondaryDescription={activePreset.secondaryDescription}
          closeOnOverlayClick={activePreset.closeOnOverlayClick}
          size={activePreset.size}
          onClose={closeModal}
          onConfirm={activePreset.onConfirmType === 'custom-close' ? handleConfirm : undefined}
        />
      )}
    </div>
  );
}
