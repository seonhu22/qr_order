// src/apps/admin/layout/AdminSidebarNav.tsx

import './AdminSidebarNav.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { ADMIN_SIDEBAR_MENU } from './adminSidebarMenu';

/**
 * AdminSidebarNav — 사이드바 트리 내비게이션 Wrapper
 *
 * 3계층 구조: Depth1(카테고리) > Depth2(그룹) > Depth3(페이지)
 * 시맨틱: <nav> > <ul> > <li> > <button>
 *
 * UI only — 라우터 기반 활성 상태·펼침 토글은 추후 연결
 */
export function AdminSidebarNav() {
  return (
    <nav className="admin-sidebar-nav" aria-label="사이드 메뉴">
      <ul className="admin-sidebar-nav__list">
        {ADMIN_SIDEBAR_MENU.map((depth1) => (
          <li key={depth1.label} className="admin-sidebar-nav__d1-item">
            <button
              type="button"
              className={`admin-sidebar-nav__d1${depth1.active ? ' admin-sidebar-nav__d1--active' : ''}`}
              aria-expanded={depth1.expanded}
            >
              <span
                className={`admin-sidebar-nav__d1-label${depth1.active ? '' : ' admin-sidebar-nav__d1-label--inactive'}`}
              >
                {depth1.label}
              </span>
              <span
                className={`admin-sidebar-nav__chevron${depth1.expanded ? ' admin-sidebar-nav__chevron--open' : ''}`}
              >
                <Icon id={depth1.expanded ? 'i-chevron-up' : 'i-chevron-right'} size={13} />
              </span>
            </button>

            {depth1.groups.length > 0 && depth1.expanded ? (
              <ul className="admin-sidebar-nav__d2-list">
                {depth1.groups.map((group) => (
                  <li key={group.label} className="admin-sidebar-nav__d2-item">
                    <button
                      type="button"
                      className={`admin-sidebar-nav__d2${group.expanded ? ' admin-sidebar-nav__d2--expanded' : ''}`}
                      aria-expanded={group.expanded}
                    >
                      <span
                        className={`admin-sidebar-nav__d2-label${group.expanded ? '' : ' admin-sidebar-nav__d2-label--muted'}`}
                      >
                        {group.label}
                      </span>
                      <span
                        className={`admin-sidebar-nav__chevron${group.expanded ? ' admin-sidebar-nav__chevron--open' : ''}`}
                      >
                        <Icon id={group.expanded ? 'i-chevron-up' : 'i-chevron-right'} size={11} />
                      </span>
                    </button>

                    {group.items.length > 0 && group.expanded ? (
                      <ul className="admin-sidebar-nav__d3-list">
                        {group.items.map((item) => (
                          <li key={item.label}>
                            <button
                              type="button"
                              className={`admin-sidebar-nav__d3${item.active ? ' admin-sidebar-nav__d3--active' : ''}`}
                              aria-current={item.active ? 'page' : undefined}
                            >
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
