import './LoadingState.css';

type LoadingStateProps = {
  /** 로딩 안내 문구 */
  message?: string;
  className?: string;
};

/**
 * 데이터 조회 중 상태를 표시하는 공용 컴포넌트
 *
 * @example
 * // 단독 사용
 * <LoadingState message="대시보드 데이터를 불러오는 중입니다." />
 *
 * @example
 * // 테이블 tbody 안에서 사용
 * <tr>
 *   <td colSpan={5}>
 *     <LoadingState message="목록을 불러오는 중입니다." />
 *   </td>
 * </tr>
 */
export function LoadingState({ message = '불러오는 중입니다.', className }: LoadingStateProps) {
  return (
    <div
      className={['loading-state', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className="loading-state__spinner" aria-hidden="true" />
      <p className="loading-state__message">{message}</p>
    </div>
  );
}
