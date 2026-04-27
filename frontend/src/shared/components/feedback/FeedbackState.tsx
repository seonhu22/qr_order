import './FeedbackState.css';
import { Icon } from '@/shared/assets/icons/Icon';

export type FeedbackVariant = 'loading' | 'error' | 'empty' | 'select' | 'unauthorized';

type FeedbackStateProps = {
  variant: FeedbackVariant;
  /** 기본 문구를 덮어쓸 때 사용 */
  title?: string;
  /** 보조 설명 — 생략 가능 */
  description?: string;
  /** variant 기본 아이콘을 덮어쓸 때 사용 (예: 검색 결과 없음 → "i-search") */
  iconId?: string;
  /** 설명 아래에 렌더링할 커스텀 콘텐츠 (버튼 등) */
  children?: React.ReactNode;
  className?: string;
};

type VariantConfig = {
  defaultTitle: string;
  defaultDescription?: string;
  iconId?: string;
  iconSize?: number;
};

const VARIANT_CONFIG: Record<FeedbackVariant, VariantConfig> = {
  loading:      { defaultTitle: '불러오는 중입니다.' },
  error:        { defaultTitle: '불러오는데 실패했습니다', defaultDescription: '다시 한번 시도해주세요.', iconId: 'i-error', iconSize: 22 },
  empty:        { defaultTitle: '데이터가 없습니다.',        defaultDescription: '등록된 데이터가 없습니다.', iconId: 'i-empty-file',        iconSize: 22 },
  select:       { defaultTitle: '목록을 선택해주세요.',       defaultDescription: '위 목록에서 행을 클릭하면 상세 코드가 표시됩니다.',                               iconId: 'i-feedback-pointer', iconSize: 22 },
  unauthorized: { defaultTitle: '접근 권한이 없습니다.',     iconId: 'i-lock',             iconSize: 22 },
};

/**
 * 로딩·에러·빈 결과·권한 없음 등 다양한 상태를 variant 하나로 표현하는 공용 피드백 컴포넌트
 *
 * @example
 * <FeedbackState variant="loading" />
 * <FeedbackState variant="error" description="잠시 후 다시 시도해주세요." />
 * <FeedbackState variant="empty" title="목록을 선택해주세요" description="행을 클릭하면 상세가 표시됩니다." />
 * <FeedbackState variant="unauthorized" />
 */
export function FeedbackState({ variant, title, description, children, className }: FeedbackStateProps) {
  const config = VARIANT_CONFIG[variant];
  const resolvedTitle = title ?? config.defaultTitle;
  const resolvedDescription = description ?? config.defaultDescription;
  const isLoading = variant === 'loading';

  return (
    <section
      className={['feedback-state', `feedback-state--${variant}`, className].filter(Boolean).join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {isLoading ? (
        <span className="feedback-state__spinner" aria-hidden="true" />
      ) : (
        <div className="feedback-state__icon-wrap" aria-hidden="true">
          <Icon id={config.iconId!} size={config.iconSize!} />
        </div>
      )}
      <div className="feedback-state__body">
        <p className="feedback-state__title">{resolvedTitle}</p>
        {resolvedDescription && <p className="feedback-state__description">{resolvedDescription}</p>}
        {children}
      </div>
    </section>
  );
}
