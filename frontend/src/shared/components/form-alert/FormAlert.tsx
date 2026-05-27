/**
 * @fileoverview 폼 알림 컴포넌트
 *
 * @description
 * - error / info / guide / success 4가지 유형의 인라인 알림 배너
 * - 제목·설명·에러 목록·닫기 버튼 조합 지원
 * - 제어(onDismiss) / 비제어(DismissibleFormAlert) 양쪽 모드 지원
 * - 아이콘은 sprite.svg 심볼 참조 (lucide-react 미사용)
 *
 * @module form-alert/FormAlert
 */

import './FormAlert.css';
import { useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import type { FormAlertProps, DismissibleFormAlertProps, FormAlertType } from './types';


/* =====================================================
 * 유형별 아이콘 매핑
 * ===================================================== */

const ICON_ID: Record<FormAlertType, string> = {
  error:   'i-error',
  info:    'i-info',
  guide:   'i-lightbulb',
  success: 'i-success',
};

const ICON_LABEL: Record<FormAlertType, string> = {
  error:   '오류',
  info:    '안내',
  guide:   '가이드',
  success: '성공',
};


/* =====================================================
 * FormAlert
 * ===================================================== */

/**
 * 폼 알림 컴포넌트
 *
 * @example
 * // 에러 — 제목 + 에러 목록
 * <FormAlert
 *   type="error"
 *   title="입력 내용을 확인해주세요"
 *   errors={['이메일 형식이 올바르지 않습니다', '비밀번호는 8자 이상이어야 합니다']}
 * />
 *
 * @example
 * // 안내 — 설명만
 * <FormAlert type="info" description="변경 사항은 저장 후 반영됩니다." />
 *
 * @example
 * // 가이드 — 제목 + 설명
 * <FormAlert type="guide" title="작성 팁" description="메뉴명은 고객에게 노출되는 이름입니다." />
 *
 * @example
 * // 성공 — 닫기 버튼 없음
 * <FormAlert type="success" title="저장 완료" dismissible={false} />
 *
 * @example
 * // 외부에서 닫기 제어
 * <FormAlert type="error" title="오류 발생" onDismiss={() => setVisible(false)} />
 */
export function FormAlert({
  type = 'error',
  title,
  description,
  errors,
  dismissible = true,
  onDismiss,
  className,
}: FormAlertProps) {
  return (
    <div
      className={[
        'form-alert',
        `form-alert--${type}`,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
    >
      {/* 아이콘 */}
      <span className="form-alert__icon" aria-hidden="true">
        <Icon id={ICON_ID[type]} size={16} label={ICON_LABEL[type]} />
      </span>

      {/* 본문 */}
      <div className="form-alert__body">
        {title && <p className="form-alert__title">{title}</p>}

        {description && (
          <p className="form-alert__desc">{description}</p>
        )}

        {errors && errors.length > 0 && (
          <ul className="form-alert__errors">
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 닫기 버튼 */}
      {dismissible && (
        <button
          type="button"
          className="form-alert__dismiss"
          aria-label="알림 닫기"
          onClick={onDismiss}
        >
          <Icon id="i-close" size={14} />
        </button>
      )}
    </div>
  );
}


/* =====================================================
 * DismissibleFormAlert — 자체 show/hide 상태 관리
 * ===================================================== */

/**
 * 자체적으로 표시/숨김을 관리하는 FormAlert 래퍼
 *
 * @example
 * <DismissibleFormAlert
 *   type="info"
 *   title="공지사항"
 *   description="점검 시간: 매일 02:00 – 03:00"
 * />
 */
export function DismissibleFormAlert({
  defaultShow = true,
  ...props
}: DismissibleFormAlertProps) {
  const [visible, setVisible] = useState(defaultShow);
  if (!visible) return null;
  return (
    <FormAlert
      {...props}
      dismissible
      onDismiss={() => setVisible(false)}
    />
  );
}