// src/apps/admin/layout/AdminSidebarNav.tsx

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebarNav.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { ADMIN_SIDEBAR_MENU } from './adminSidebarMenu';
import { findExpandedMenuKeys } from './findExpandedMenuKeys';
import { useAdminLayoutStore } from '../stores/adminLayoutStore';

/**
 * AdminSidebarNav — 사이드바 트리 내비게이션 Wrapper
 *
 * 3계층 구조: Depth1(카테고리) > Depth2(그룹) > Depth3(페이지)
 * 시맨틱: <nav> > <ul> > <li> > <button>
 *
 * UI only — 라우터 기반 활성 상태·펼침 토글은 추후 연결
 */
export function AdminSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const expandedDepth1Key = useAdminLayoutStore((state) => state.expandedDepth1Key);
  const expandedDepth2Key = useAdminLayoutStore((state) => state.expandedDepth2Key);
  const setExpandedMenu = useAdminLayoutStore((state) => state.setExpandedMenu);
  const toggleDepth1 = useAdminLayoutStore((state) => state.toggleDepth1);
  const toggleDepth2 = useAdminLayoutStore((state) => state.toggleDepth2);

  // 초기 진입 시 URL에 맞는 메뉴 펼침 상태로 자동 설정
  useEffect(() => {
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname);

    if (!depth1Key) {
      return;
    }

    setExpandedMenu(depth1Key, depth2Key);
  }, [location.pathname, setExpandedMenu]);

  return (
    <nav className="admin-sidebar-nav" aria-label="사이드 메뉴">
      <ul className="admin-sidebar-nav__list">
        {ADMIN_SIDEBAR_MENU.map((depth1) => (
          <li key={depth1.key} className="admin-sidebar-nav__d1-item">
            {(() => {
              const hasDepth1Children = depth1.groups.length > 0;
              const isDepth1Expanded = expandedDepth1Key === depth1.key;

              return (
                <>
                  {/* Depth1 메뉴 */}
                  <button
                    type="button"
                    className={`admin-sidebar-nav__d1${isDepth1Expanded ? ' admin-sidebar-nav__d1--active' : ''}`}
                    aria-expanded={hasDepth1Children ? isDepth1Expanded : undefined}
                    onClick={() => toggleDepth1(depth1.key, hasDepth1Children)}
                  >
                    <span
                      className={`admin-sidebar-nav__d1-label${isDepth1Expanded ? '' : ' admin-sidebar-nav__d1-label--inactive'}`}
                    >
                      {depth1.label}
                    </span>
                    <span
                      className={`admin-sidebar-nav__chevron${isDepth1Expanded ? ' admin-sidebar-nav__chevron--open' : ''}`}
                    >
                      <Icon id={isDepth1Expanded ? 'i-chevron-up' : 'i-chevron-right'} size={13} />
                    </span>
                  </button>

                  {/* Depth2 메뉴 */}
                  {hasDepth1Children && isDepth1Expanded ? (
                    <ul className="admin-sidebar-nav__d2-list">
                      {depth1.groups.map((group) => {
                        const hasDepth2Children = group.items.length > 0;
                        const isDepth2Expanded = expandedDepth2Key === group.key;

                        return (
                          <li key={group.key} className="admin-sidebar-nav__d2-item">
                            <button
                              type="button"
                              className={`admin-sidebar-nav__d2${isDepth2Expanded ? ' admin-sidebar-nav__d2--expanded' : ''}`}
                              aria-expanded={hasDepth2Children ? isDepth2Expanded : undefined}
                              onClick={() => toggleDepth2(group.key, hasDepth2Children)}
                            >
                              <span
                                className={`admin-sidebar-nav__d2-label${isDepth2Expanded ? '' : ' admin-sidebar-nav__d2-label--muted'}`}
                              >
                                {group.label}
                              </span>
                              <span
                                className={`admin-sidebar-nav__chevron${isDepth2Expanded ? ' admin-sidebar-nav__chevron--open' : ''}`}
                              >
                                <Icon
                                  id={isDepth2Expanded ? 'i-chevron-up' : 'i-chevron-right'}
                                  size={11}
                                />
                              </span>
                            </button>

                            {/* Depth3 메뉴 */}
                            {hasDepth2Children && isDepth2Expanded ? (
                              <ul className="admin-sidebar-nav__d3-list">
                                {group.items.map((item) => {
                                  const isActive = location.pathname === item.path;

                                  return (
                                    <li key={item.key}>
                                      <button
                                        type="button"
                                        className={`admin-sidebar-nav__d3${isActive ? ' admin-sidebar-nav__d3--active' : ''}`}
                                        aria-current={isActive ? 'page' : undefined}
                                        onClick={() => navigate(item.path)}
                                      >
                                        {item.label}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              );
            })()}
          </li>
        ))}
      </ul>
    </nav>
  );
}
