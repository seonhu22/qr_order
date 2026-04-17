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
export function SidebarNav({
  menus,
  expandedDepth1Key,
  expandedDepth2Key,
  currentPathname,
  onToggleDepth1,
  onToggleDepth2,
  onNavigate,
}: SidebarNavProps) {
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

              {/* Depth2 메뉴 */}
              {hasDepth1Children && isDepth1Expanded && (
                <ul className="sidebar-nav__d2-list">
                  {depth1.groups.map((group) => {
                    const hasDepth2Children = group.items.length > 0;
                    const isDepth2Expanded = expandedDepth2Key === group.key;

                    return (
                      <li key={group.key} className="sidebar-nav__d2-item">
                        <button
                          type="button"
                          className={`sidebar-nav__d2${isDepth2Expanded ? ' sidebar-nav__d2--expanded' : ''}`}
                          aria-expanded={hasDepth2Children ? isDepth2Expanded : undefined}
                          onClick={() => onToggleDepth2(group.key, hasDepth2Children)}
                        >
                          <span
                            className={`sidebar-nav__d2-label${isDepth2Expanded ? '' : ' sidebar-nav__d2-label--muted'}`}
                          >
                            {group.label}
                          </span>
                          <span
                            className={`sidebar-nav__chevron${isDepth2Expanded ? ' sidebar-nav__chevron--open' : ''}`}
                          >
                            <Icon
                              id={isDepth2Expanded ? 'i-chevron-up' : 'i-chevron-right'}
                              size={11}
                            />
                          </span>
                        </button>

                        {/* Depth3 메뉴 */}
                        {hasDepth2Children && isDepth2Expanded && (
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
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
