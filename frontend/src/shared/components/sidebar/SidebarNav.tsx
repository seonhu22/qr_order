/**
 * @fileoverview 사이드바 3계층 내비게이션 공용 컴포넌트
 *
 * @description
 * 메뉴 데이터와 펼침 상태를 props로 받아 3계층 nav를 렌더한다.
 * 특정 라우터·스토어에 의존하지 않으므로 어드민·사용자 양쪽에서 재사용 가능.
 *
 * @module shared/components/sidebar/SidebarNav
 */

import './SidebarNav.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { SidebarNavDepth1 } from './types';


type SidebarNavProps = {
  /** 3계층 메뉴 데이터 */
  menus: readonly SidebarNavDepth1[];
  /** 현재 펼쳐진 1depth 키 */
  expandedDepth1Key: string | null;
  /** 현재 펼쳐진 2depth 키 */
  expandedDepth2Key: string | null;
  /** 현재 URL 경로 (active 상태 판별용) */
  currentPathname: string;
  /** 1depth 토글 콜백 */
  onToggleDepth1: (key: string, hasChildren?: boolean) => void;
  /** 2depth 토글 콜백 */
  onToggleDepth2: (key: string, hasChildren?: boolean) => void;
  /** 페이지 이동 콜백 */
  onNavigate: (path: string) => void;
  /**
   * false이면 depth1 버튼을 숨기고 depth2 그룹을 최상위 항목으로 렌더한다.
   * 헤더 등 다른 영역에서 이미 depth1을 표시하는 경우에 사용.
   * @default true
   */
  showDepth1?: boolean;
};

/**
 * 사이드바 트리 내비게이션 컴포넌트
 *
 * @example
 * <SidebarNav
 *   menus={ADMIN_SIDEBAR_MENU}
 *   expandedDepth1Key={expandedDepth1Key}
 *   expandedDepth2Key={expandedDepth2Key}
 *   currentPathname={location.pathname}
 *   onToggleDepth1={toggleDepth1}
 *   onToggleDepth2={toggleDepth2}
 *   onNavigate={navigate}
 * />
 */
/** depth2 그룹 + depth3 아이템을 렌더하는 내부 헬퍼 */
function GroupItems({
  group,
  expandedDepth2Key,
  currentPathname,
  onToggleDepth2,
  onNavigate,
  /* depth1이 숨겨졌을 때 그룹 헤더에 d1 스타일 적용 여부 */
  useD1Style = false,
}: {
  group: SidebarNavDepth1['groups'][number];
  expandedDepth2Key: string | null;
  currentPathname: string;
  onToggleDepth2: (key: string, hasChildren?: boolean) => void;
  onNavigate: (path: string) => void;
  useD1Style?: boolean;
}) {
  const hasChildren = group.items.length > 0;
  const isExpanded = expandedDepth2Key === group.key;

  /* depth1이 없을 때 그룹 헤더는 d1 버튼 스타일로 최상위처럼 보이게 한다 */
  const btnClass = useD1Style
    ? `sidebar-nav__d1${isExpanded ? ' sidebar-nav__d1--active' : ''}`
    : `sidebar-nav__d2${isExpanded ? ' sidebar-nav__d2--expanded' : ''}`;

  const labelClass = useD1Style
    ? `sidebar-nav__d1-label${isExpanded ? '' : ' sidebar-nav__d1-label--inactive'}`
    : `sidebar-nav__d2-label${isExpanded ? '' : ' sidebar-nav__d2-label--muted'}`;

  return (
    <li className={useD1Style ? 'sidebar-nav__d1-item' : 'sidebar-nav__d2-item'}>
      <button
        type="button"
        className={btnClass}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={() => onToggleDepth2(group.key, hasChildren)}
      >
        <span className={labelClass}>{group.label}</span>
        <span className={`sidebar-nav__chevron${isExpanded ? ' sidebar-nav__chevron--open' : ''}`}>
          <Icon id={isExpanded ? 'i-chevron-up' : 'i-chevron-right'} size={13} />
        </span>
      </button>

      {hasChildren && isExpanded && (
        <ul className="sidebar-nav__d3-list">
          {group.items.map((item) => {
            const isActive = currentPathname === item.path;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`sidebar-nav__d3${isActive ? ' sidebar-nav__d3--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(item.path)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function SidebarNav({
  menus,
  expandedDepth1Key,
  expandedDepth2Key,
  currentPathname,
  onToggleDepth1,
  onToggleDepth2,
  onNavigate,
  showDepth1 = true,
}: SidebarNavProps) {
  /* ── showDepth1=false: depth1 버튼 없이 모든 그룹을 최상위로 렌더 ── */
  if (!showDepth1) {
    const allGroups = menus.flatMap((d1) => d1.groups);
    return (
      <nav className="sidebar-nav" aria-label="사이드 메뉴">
        <ul className="sidebar-nav__list">
          {allGroups.map((group) => (
            <GroupItems
              key={group.key}
              group={group}
              expandedDepth2Key={expandedDepth2Key}
              currentPathname={currentPathname}
              onToggleDepth2={onToggleDepth2}
              onNavigate={onNavigate}
              useD1Style
            />
          ))}
        </ul>
      </nav>
    );
  }

  /* ── showDepth1=true(기본): 3계층 전체 렌더 ── */
  return (
    <nav className="sidebar-nav" aria-label="사이드 메뉴">
      <ul className="sidebar-nav__list">
        {menus.map((depth1) => {
          const hasDepth1Children = depth1.groups.length > 0;
          const isDepth1Expanded = expandedDepth1Key === depth1.key;

          return (
            <li key={depth1.key} className="sidebar-nav__d1-item">
              {/* Depth1 메뉴 */}
              <button
                type="button"
                className={`sidebar-nav__d1${isDepth1Expanded ? ' sidebar-nav__d1--active' : ''}`}
                aria-expanded={hasDepth1Children ? isDepth1Expanded : undefined}
                onClick={() => onToggleDepth1(depth1.key, hasDepth1Children)}
              >
                <span
                  className={`sidebar-nav__d1-label${isDepth1Expanded ? '' : ' sidebar-nav__d1-label--inactive'}`}
                >
                  {depth1.label}
                </span>
                <span
                  className={`sidebar-nav__chevron${isDepth1Expanded ? ' sidebar-nav__chevron--open' : ''}`}
                >
                  <Icon id={isDepth1Expanded ? 'i-chevron-up' : 'i-chevron-right'} size={13} />
                </span>
              </button>

              {/* Depth2 + Depth3 */}
              {hasDepth1Children && isDepth1Expanded && (
                <ul className="sidebar-nav__d2-list">
                  {depth1.groups.map((group) => (
                    <GroupItems
                      key={group.key}
                      group={group}
                      expandedDepth2Key={expandedDepth2Key}
                      currentPathname={currentPathname}
                      onToggleDepth2={onToggleDepth2}
                      onNavigate={onNavigate}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
