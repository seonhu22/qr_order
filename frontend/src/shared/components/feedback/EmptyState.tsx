import './EmptyState.css';

type EmptyStateProps = {
  /** 상단에 표시할 아이콘 */
  icon: React.ReactNode;
  /** 주요 안내 문구 */
  title: string;
  /** 보조 설명 — 생략 가능 */
  description?: string;
  /** 설명 아래에 렌더링할 커스텀 콘텐츠 (버튼 등) */
  children?: React.ReactNode;
  className?: string;
};

/**
 * 목록 미선택·빈 상태 등 사용자 안내가 필요할 때 표시하는 공용 피드백 컴포넌트
 *
 * @example
 * // 기본
 * <EmptyState
 *   icon={<Icon id="i-feedback-pointer" size={22} />}
 *   title="목록을 선택해주세요"
 *   description="행을 클릭하면 상세 내용이 표시됩니다."
 * />
 *
 * @example
 * // 커스텀 액션 포함
 * <EmptyState icon={...} title="데이터가 없습니다.">
 *   <Button onClick={handleAdd}>직접 추가하기</Button>
 * </EmptyState>
 */
export function EmptyState({ icon, title, description, children, className }: EmptyStateProps) {
  return (
    <section
      className={['empty-state', className].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <div className="empty-state__icon-wrap" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {children}
    </section>
  );
}
