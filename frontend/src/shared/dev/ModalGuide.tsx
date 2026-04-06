// src/shared/dev/ModalGuide.tsx

/**
 * @fileoverview WrapperModal 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/modal)
 * - WrapperModal의 주요 시나리오와 props 조합을 빠르게 검증
 *
 * @module dev/ModalGuide
 *
 * @example
 * <ModalGuide />
 */

import { useMemo, useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  NoticeModal,
  NoticeConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
  WrapperModal,
} from '@/shared/components/modal';
import type { ModalSize, WrapperModalLayout } from '@/shared/components/modal';
import './devStyles/ModalGuide.css';

type Preset = {
  key: string;
  label: string;
  title?: string;
  subtitle?: string;
  size: ModalSize;
  layout?: WrapperModalLayout;
  closeOnOverlayClick?: boolean;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  icon?: string;
  onConfirmType?: 'default-close' | 'custom-close';
};

const PRESETS: Preset[] = [
  {
    key: 'default',
    label: '기본 모달',
    title: '기본 안내',
    size: 'sm',
    subtitle: '가장 기본적인 안내 모달입니다.',
    primaryActionLabel: '확인',
    onConfirmType: 'default-close',
  },
  {
    key: 'double-action',
    label: '2버튼 모달',
    title: '주문 취소 확인',
    size: 'md',
    subtitle: '진행 중인 주문을 취소하시겠습니까?',
    primaryActionLabel: '취소하기',
    secondaryActionLabel: '닫기',
    onConfirmType: 'custom-close',
  },
  {
    key: 'notice-single',
    label: '안내형 1버튼',
    title: '저장 완료',
    size: 'sm',
    layout: 'notice',
    subtitle: '정상적으로 저장되었습니다.',
    icon: 'i-modal-check',
    primaryActionLabel: '확인',
    onConfirmType: 'default-close',
  },
  {
    key: 'notice-double',
    label: '안내형 2버튼',
    title: '삭제 확인',
    size: 'md',
    layout: 'notice',
    subtitle: '선택한 항목을 삭제하시겠습니까?',
    icon: 'i-modal-information',
    primaryActionLabel: '삭제',
    secondaryActionLabel: '닫기',
    onConfirmType: 'custom-close',
  },
  {
    key: 'size-sm',
    label: '사이즈 sm',
    title: 'Small Modal',
    size: 'sm',
    subtitle: 'sm 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-md',
    label: '사이즈 md',
    title: 'Medium Modal',
    size: 'md',
    subtitle: 'md 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-lg',
    label: '사이즈 lg',
    title: 'Large Modal',
    size: 'lg',
    subtitle: 'lg 사이즈 확인용 모달입니다.',
    onConfirmType: 'default-close',
  },
  {
    key: 'size-xl',
    label: '사이즈 xl',
    title: 'X-Large Modal',
    size: 'xl',
    subtitle: 'xl 사이즈 확인용 모달입니다.',
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
  '닫기(X) 버튼: IconButton 도입 시 WrapperModal의 close 버튼 영역부터 교체',
  '확인 버튼: Button 도입 시 base-modal__confirm 스타일 대응 variant 정의',
  '보조 버튼: Button 도입 시 base-modal__secondary 스타일 대응 variant 정의',
  '교체 후에도 onConfirm 미지정 시 onClose fallback 동작 유지',
];

/**
 * NoticeModal 가이드 섹션을 렌더링한다.
 *
 * @returns {JSX.Element}
 */
function NoticeModalSection() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">NoticeModal (안내)</p>
        <p className="modal-guide__card-description">
          information 아이콘 · 1버튼 고정 · layout=notice
        </p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setAlertOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <NoticeModal
        open={alertOpen}
        title="안내"
        description={'비밀번호를 5번이상 틀리셨습니다.\n관리자에게 문의해주세요.'}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}

/**
 * NoticeConfirmModal 가이드 섹션을 렌더링한다.
 *
 * @returns {JSX.Element}
 */
function NoticeConfirmModalSection() {
  const [noticeConfirmOpen, setNoticeConfirmOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">NoticeConfirmModal (안내 확인)</p>
        <p className="modal-guide__card-description">
          information 아이콘 · 1버튼 고정 · layout=notice
        </p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setNoticeConfirmOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <NoticeConfirmModal
        open={noticeConfirmOpen}
        title="안내"
        description="입력한 내용을 다시 확인해주세요."
        onClose={() => setNoticeConfirmOpen(false)}
      />
    </>
  );
}

/**
 * EditConfirmModal 가이드 섹션을 렌더링한다.
 *
 * @returns {JSX.Element}
 */
function EditConfirmModalSection() {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">EditConfirmModal (수정)</p>
        <p className="modal-guide__card-description">pencil 아이콘 · 2버튼 고정 · layout=notice</p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setEditOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <EditConfirmModal
        open={editOpen}
        title="수정 확인"
        description="선택한 정보를 수정하시겠습니까?"
        primaryAction={{ onClick: () => setEditOpen(false) }}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}

/**
 * SaveConfirmModal 가이드 섹션을 렌더링한다.
 *
 * @returns {JSX.Element}
 */
function SaveConfirmModalSection() {
  const [saveOpen, setSaveOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">SaveConfirmModal (저장)</p>
        <p className="modal-guide__card-description">check 아이콘 · 2버튼 고정 · layout=notice</p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setSaveOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <SaveConfirmModal
        open={saveOpen}
        title="저장 확인"
        description="입력한 정보를 저장하시겠습니까?"
        primaryAction={{ onClick: () => setSaveOpen(false) }}
        onClose={() => setSaveOpen(false)}
      />
    </>
  );
}

/**
 * DeleteConfirmModal 가이드 섹션을 렌더링한다.
 *
 * @returns {JSX.Element}
 */
function DeleteConfirmModalSection() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">DeleteConfirmModal (삭제)</p>
        <p className="modal-guide__card-description">trash 아이콘 · 2버튼 고정 · layout=notice</p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <DeleteConfirmModal
        open={deleteOpen}
        title="삭제 확인"
        description="선택한 항목을 삭제하시겠습니까?"
        primaryAction={{ onClick: () => setDeleteOpen(false) }}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}

function SimpleDefaultModalSection() {
  const [simpleDefaultOpen, setSimpleDefaultOpen] = useState(false);

  return (
    <>
      <div className="modal-guide__card">
        <p className="modal-guide__card-label">SimpleDefaultModal (기본 안내)</p>
        <p className="modal-guide__card-description">
          default 레이아웃 · 1버튼 안내 · description 아래 helperText 추가
        </p>
        <button
          className="modal-guide__card-button"
          type="button"
          onClick={() => setSimpleDefaultOpen(true)}
        >
          모달 열기
        </button>
      </div>

      <SimpleDefaultModal
        open={simpleDefaultOpen}
        title="안내"
        description="항목을 먼저 선택해주세요."
        helperText="삭제할 행을 선택 및 체크박스로 선택 후 진행하세요."
        onClose={() => setSimpleDefaultOpen(false)}
      />
    </>
  );
}

/**
 * 가이드 카드 UI를 렌더링한다.
 *
 * @param {{ label: string; description: string; onOpen: () => void }} props 카드 표시 정보
 * @param {string} props.label 카드 제목
 * @param {string} props.description 카드 설명
 * @param {() => void} props.onOpen 클릭 시 모달을 여는 핸들러
 * @returns {JSX.Element}
 *
 * @example
 * <GuideCard label="기본 모달" description="size=sm" onOpen={() => {}} />
 */
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

/**
 * WrapperModal 조합을 미리보기하는 개발용 가이드 페이지이다.
 *
 * @param {object} _props 별도 props를 받지 않는다.
 * @returns {JSX.Element}
 *
 * @example
 * <ModalGuide />
 */
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
          <h1 className="modal-guide__title">WrapperModal Guide</h1>
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
          <h2 className="modal-guide__section-title">NoticeModal</h2>
          <p className="modal-guide__card-description" style={{ marginBottom: '12px' }}>
            <code>NoticeModal</code>은 WrapperModal <code>layout=&quot;notice&quot;</code> 기반의
            1버튼 안내형 완성 모달입니다.
          </p>
          <div className="modal-guide__grid">
            <NoticeModalSection />
            <NoticeConfirmModalSection />
          </div>
        </section>

        <section className="modal-guide__section">
          <h2 className="modal-guide__section-title">SimpleDefaultModal</h2>
          <p className="modal-guide__card-description" style={{ marginBottom: '12px' }}>
            <code>SimpleDefaultModal</code>은 WrapperModal <code>layout=&quot;default&quot;</code>{' '}
            기반의 1버튼 안내 모달로, description 아래에 helperText 한 줄을 추가할 수 있습니다.
          </p>
          <div className="modal-guide__grid">
            <SimpleDefaultModalSection />
          </div>
        </section>

        <section className="modal-guide__section">
          <h2 className="modal-guide__section-title">ConfirmModal</h2>
          <p className="modal-guide__card-description" style={{ marginBottom: '12px' }}>
            <code>ConfirmModal</code>은 삭제/수정/저장 확인 같은 2버튼 상태 전달용 완성 모달입니다.
          </p>
          <div className="modal-guide__grid">
            <div className="modal-guide__card">
              <p className="modal-guide__card-label">ConfirmModal (2버튼)</p>
              <p className="modal-guide__card-description">
                danger tone · 확인/닫기 버튼 · layout=notice
              </p>
              <button
                className="modal-guide__card-button"
                type="button"
                onClick={() => setActivePresetKey('notice-double')}
              >
                모달 열기
              </button>
            </div>
            <DeleteConfirmModalSection />
            <SaveConfirmModalSection />
            <EditConfirmModalSection />
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
        <WrapperModal
          open={Boolean(activePreset)}
          title={activePreset.title}
          subtitle={activePreset.subtitle}
          layout={activePreset.layout}
          icon={activePreset.icon ? <Icon id={activePreset.icon} size={28} /> : undefined}
          primaryAction={
            activePreset.primaryActionLabel
              ? {
                  label: activePreset.primaryActionLabel,
                  onClick:
                    activePreset.onConfirmType === 'custom-close' ? handleConfirm : undefined,
                }
              : undefined
          }
          secondaryAction={
            activePreset.secondaryActionLabel
              ? { label: activePreset.secondaryActionLabel, onClick: closeModal }
              : undefined
          }
          closeOnOverlayClick={activePreset.closeOnOverlayClick}
          size={activePreset.size}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
