/**
 * @fileoverview 개발 전용 가이드 레이아웃
 *
 * @description
 * - /dev/* 경로에서 공통으로 사용하는 사이드 내비게이션 + 콘텐츠 영역
 * - 신규 컴포넌트 가이드 추가 시 NAV_ITEMS 배열에만 등록하면 된다
 *
 * @module dev/DevLayout
 */

import { NavLink, Outlet } from 'react-router-dom';
import './devStyles/DevLayout.css';

/* =====================================================
 * 내비게이션 메뉴 목록
 * 새 가이드 페이지를 추가할 때 여기에만 등록
 * ===================================================== */
const NAV_ITEMS = [
  { path: '/dev/input',  label: 'TextInput' },
  { path: '/dev/modal',  label: 'Modal' },
  { path: '/dev/select', label: 'SelectInput' },
  { path: '/dev/button',   label: 'Button' },
  { path: '/dev/checkbox', label: 'CheckboxInput' },
  { path: '/dev/radio',    label: 'RadioInput' },
  { path: '/dev/toggle',     label: 'ToggleInput' },
  { path: '/dev/form-alert', label: 'FormAlert' },
  { path: '/dev/table',     label: 'TableCard' },
  { path: '/dev/tree-menu', label: 'TreeMenu' },
  { path: '/dev/error-page', label: 'ErrorPage' },
  // { path: '/dev/feedback', label: 'Feedback' },
] as const;

export default function DevLayout() {
  return (
    <div className="dev-layout">
      {/* ── 사이드 내비게이션 ────────────────────────── */}
      <nav className="dev-layout__nav">
        {/* 로고 */}
        <div className="dev-layout__nav-logo">
          <span className="dev-layout__nav-logo-text">Dev Guide</span>
        </div>

        {/* 컴포넌트 목록 */}
        <ul className="dev-layout__nav-list">
          {NAV_ITEMS.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `dev-layout__nav-link${isActive ? ' dev-layout__nav-link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── 콘텐츠 영역 ─────────────────────────────── */}
      <main className="dev-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
