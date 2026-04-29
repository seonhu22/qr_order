/**
 * @fileoverview 파일 첨부 제약 안내 컴포넌트
 *
 * @description
 * - FileInputGroup 아래에 배치하여 파일 첨부 정책을 안내한다.
 * - 5가지 variant로 상황에 맞게 표현한다.
 *   · simple  : 아이콘 + 한 줄 텍스트 (기본 안내)
 *   · badge   : 칩 형식으로 각 제약을 개별 표기 (시각적으로 명확)
 *   · info    : 파란 박스 — 입력 전 일반 안내
 *   · warning : 노란 박스 — 한도 도달 임박 / 도달 시
 *   · error   : 빨간 박스 — 형식/크기 위반 발생 시
 * - maxSize · maxCount · allowedExts 각각 독립적으로 표시 여부를 제어한다.
 *   → 넘기지 않으면 해당 제약은 안내에서 제외된다.
 *
 * @module file-attachment/FileHint
 */

import './FileAttachment.css';
import { Icon } from '@/shared/assets/icons/Icon';

export type FileHintVariant = 'simple' | 'badge' | 'info' | 'warning' | 'error';

export type FileHintProps = {
  variant?: FileHintVariant;
  /** 파일당 최대 크기 (예: "10MB") — 미전달 시 표시 안 함 */
  maxSize?: string;
  /** 최대 파일 개수 — 미전달 시 표시 안 함 */
  maxCount?: number;
  /** 허용 확장자 목록 — 미전달 시 표시 안 함 */
  allowedExts?: string[];
  /** 커스텀 메시지 — 전달 시 자동 생성 메시지 대신 사용 */
  message?: string;
};


/* =====================================================
 * FileHint
 * ===================================================== */

export function FileHint({
  variant = 'simple',
  maxSize,
  maxCount,
  allowedExts,
  message,
}: FileHintProps) {
  const extStr = allowedExts?.join(' · ') ?? '';
  const parts = [
    maxSize && `최대 ${maxSize}`,
    maxCount && `최대 ${maxCount}개`,
    extStr || undefined,
  ].filter(Boolean) as string[];

  /* ── simple ── */
  if (variant === 'simple') {
    if (!parts.length && !message) return null;
    return (
      <p className="file-hint--simple">
        <Icon id="i-info" size={11} aria-hidden="true" />
        {message ?? parts.join(' · ')}
      </p>
    );
  }

  /* ── badge ── */
  if (variant === 'badge') {
    const badges: { emoji: string; text: string }[] = [];
    if (maxSize) badges.push({ emoji: '📏', text: `${maxSize} 이하` });
    if (maxCount) badges.push({ emoji: '📁', text: `최대 ${maxCount}개` });
    if (extStr) badges.push({ emoji: '📎', text: extStr });

    if (!badges.length && !message) return null;

    return (
      <div className="file-hint--badge">
        {message ? (
          <span className="file-hint__badge-item">{message}</span>
        ) : (
          badges.map((b, i) => (
            <span key={i} className="file-hint__badge-item">
              <span aria-hidden="true">{b.emoji}</span>
              {b.text}
            </span>
          ))
        )}
      </div>
    );
  }

  /* ── info / warning / error — 공통 박스 레이아웃 ── */
  const iconMap: Record<'info' | 'warning' | 'error', string> = {
    info: 'i-info',
    warning: 'i-lightbulb',
    error: 'i-error',
  };

  const defaultMessageMap: Record<'info' | 'warning' | 'error', string> = {
    info: [
      maxCount && `파일은 최대 ${maxCount}개`,
      maxSize && `각 ${maxSize}까지`,
      '첨부할 수 있습니다.',
      extStr && `허용 형식: ${extStr}`,
    ]
      .filter(Boolean)
      .join(' '),
    warning:
      maxCount
        ? `최대 ${maxCount}개 파일이 등록되었습니다. 추가하려면 기존 파일을 제거하세요.`
        : '파일 한도에 도달했습니다.',
    error: '허용되지 않는 파일 형식이나 크기 초과 파일이 포함되어 있습니다.',
  };

  if (variant === 'info' || variant === 'warning' || variant === 'error') {
    const text = message ?? defaultMessageMap[variant];
    if (!text) return null;

    return (
      <div className={`file-hint--${variant}`}>
        <Icon
          id={iconMap[variant]}
          size={12}
          className="file-hint__hint-icon"
          aria-hidden="true"
        />
        <p>{text}</p>
      </div>
    );
  }

  return null;
}
