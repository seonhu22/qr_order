import './AdminSidebarNav.css';
import { Icon } from '@/shared/assets/icons/Icon';

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

        {/* ── Depth 1 : 시스템 (활성/펼침) ── */}
        <li className="admin-sidebar-nav__d1-item">
          <button
            type="button"
            className="admin-sidebar-nav__d1 admin-sidebar-nav__d1--active"
            aria-expanded="true"
          >
            <span className="admin-sidebar-nav__d1-label">시스템</span>
            <span className="admin-sidebar-nav__chevron admin-sidebar-nav__chevron--open">
              <Icon id="i-chevron-up" size={13} />
            </span>
          </button>

          <ul className="admin-sidebar-nav__d2-list">

            {/* Depth 2 : 시스템 관리 (활성/펼침) */}
            <li className="admin-sidebar-nav__d2-item">
              <button
                type="button"
                className="admin-sidebar-nav__d2 admin-sidebar-nav__d2--expanded"
                aria-expanded="true"
              >
                <span className="admin-sidebar-nav__d2-label">시스템 관리</span>
                <span className="admin-sidebar-nav__chevron admin-sidebar-nav__chevron--open">
                  <Icon id="i-chevron-up" size={11} />
                </span>
              </button>

              <ul className="admin-sidebar-nav__d3-list">
                <li>
                  <button
                    type="button"
                    className="admin-sidebar-nav__d3 admin-sidebar-nav__d3--active"
                    aria-current="page"
                  >
                    공통코드 관리
                  </button>
                </li>
                <li>
                  <button type="button" className="admin-sidebar-nav__d3">사업장 조회</button>
                </li>
                <li>
                  <button type="button" className="admin-sidebar-nav__d3">관리자 관리</button>
                </li>
                <li>
                  <button type="button" className="admin-sidebar-nav__d3">메뉴 관리</button>
                </li>
                <li>
                  <button type="button" className="admin-sidebar-nav__d3">메시지 관리</button>
                </li>
                <li>
                  <button type="button" className="admin-sidebar-nav__d3">규칙 관리</button>
                </li>
              </ul>
            </li>

            {/* Depth 2 : 결제 관리 (닫힘) */}
            <li>
              <button type="button" className="admin-sidebar-nav__d2">
                <span className="admin-sidebar-nav__d2-label admin-sidebar-nav__d2-label--muted">
                  결제 관리
                </span>
                <Icon id="i-chevron-right" size={11} className="admin-sidebar-nav__chevron" />
              </button>
            </li>

            {/* Depth 2 : 이력 관리 (닫힘) */}
            <li>
              <button type="button" className="admin-sidebar-nav__d2">
                <span className="admin-sidebar-nav__d2-label admin-sidebar-nav__d2-label--muted">
                  이력 관리
                </span>
                <Icon id="i-chevron-right" size={11} className="admin-sidebar-nav__chevron" />
              </button>
            </li>

          </ul>
        </li>

        {/* ── Depth 1 : 결제 관리 (비활성) ── */}
        <li>
          <button type="button" className="admin-sidebar-nav__d1">
            <span className="admin-sidebar-nav__d1-label admin-sidebar-nav__d1-label--inactive">
              결제 관리
            </span>
            <Icon id="i-chevron-right" size={13} className="admin-sidebar-nav__chevron" />
          </button>
        </li>

        {/* ── Depth 1 : 이력 관리 (비활성) ── */}
        <li>
          <button type="button" className="admin-sidebar-nav__d1">
            <span className="admin-sidebar-nav__d1-label admin-sidebar-nav__d1-label--inactive">
              이력 관리
            </span>
            <Icon id="i-chevron-right" size={13} className="admin-sidebar-nav__chevron" />
          </button>
        </li>

      </ul>
    </nav>
  );
}
