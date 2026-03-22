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

/* =====================================================
 * 내비게이션 메뉴 목록
 * 새 가이드 페이지를 추가할 때 여기에만 등록
 * ===================================================== */
const NAV_ITEMS = [
  { path: '/dev/input', label: 'TextInput' },
  { path: '/dev/modal', label: 'Modal' },
  // { path: '/dev/button',   label: 'Button' },       // 추후 추가
  // { path: '/dev/table',    label: 'Table' },
  // { path: '/dev/feedback', label: 'Feedback' },
] as const;

export default function DevLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--typography-font-base)' }}>
      {/* ── 사이드 내비게이션 ────────────────────────── */}
      <nav
        style={{
          width: '200px',
          flexShrink: 0,
          background: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border-divider)',
          padding: '1.5rem 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* 로고 */}
        <div
          style={{
            padding: '0 1rem 1.25rem',
            borderBottom: '1px solid var(--color-border-divider)',
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-brand-default)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Dev Guide
          </span>
        </div>

        {/* 컴포넌트 목록 */}
        <ul style={{ listStyle: 'none', padding: '0 0.5rem', margin: 0 }}>
          {NAV_ITEMS.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-button)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-brand-default)' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-bg-selected)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background var(--transition-ui), color var(--transition-ui)',
                })}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── 콘텐츠 영역 ─────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
