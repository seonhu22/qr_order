import './AdminSidebar.css';
import { AdminSidebarHeader } from './AdminSidebarHeader';
import { AdminSidebarUser } from './AdminSidebarUser';
import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 관리자 사이드바
 *
 * 브랜드 헤더(AdminBrand) + 3단계 트리 내비게이션 + 하단 사용자 정보
 *
 * UI only — 토글·라우터 연결은 추후 진행
 */
export function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      {/* ---- 상단 브랜드 헤더 ---- */}
      <AdminSidebarHeader />

      {/* ---- 내비게이션 ---- */}
      <nav className="admin-sidebar__nav" aria-label="사이드 메뉴">
        {/* Depth 1 – 시스템 (활성/펼침) */}
        <div className="admin-sidebar__d1-group">
          <button
            type="button"
            className="admin-sidebar__d1 admin-sidebar__d1--active"
            aria-expanded="true"
          >
            <span className="admin-sidebar__d1-label">시스템</span>
            {/* 펼침 상태: chevron-up 을 180° 회전 → 아래 방향 화살표 */}
            <span className="admin-sidebar__chevron admin-sidebar__chevron--open">
              <Icon id="i-chevron-up" size={13} />
            </span>
          </button>

          {/* Depth 2 목록 */}
          <div className="admin-sidebar__d2-list">
            {/* Depth 2 – 시스템 관리 (활성/펼침) */}
            <div className="admin-sidebar__d2-group">
              <button
                type="button"
                className="admin-sidebar__d2 admin-sidebar__d2--expanded"
                aria-expanded="true"
              >
                <span className="admin-sidebar__d2-label">시스템 관리</span>
                <span className="admin-sidebar__chevron admin-sidebar__chevron--open">
                  <Icon id="i-chevron-up" size={11} />
                </span>
              </button>

              {/* Depth 3 목록 */}
              <div className="admin-sidebar__d3-list">
                <button
                  type="button"
                  className="admin-sidebar__d3 admin-sidebar__d3--active"
                  aria-current="page"
                >
                  공통코드 관리
                </button>
                <button type="button" className="admin-sidebar__d3">
                  사업장 조회
                </button>
                <button type="button" className="admin-sidebar__d3">
                  관리자 관리
                </button>
                <button type="button" className="admin-sidebar__d3">
                  메뉴 관리
                </button>
                <button type="button" className="admin-sidebar__d3">
                  메시지 관리
                </button>
                <button type="button" className="admin-sidebar__d3">
                  규칙 관리
                </button>
              </div>
            </div>

            {/* Depth 2 – 결제 관리 (닫힘) */}
            <button type="button" className="admin-sidebar__d2">
              <span className="admin-sidebar__d2-label admin-sidebar__d2-label--muted">
                결제 관리
              </span>
              <Icon id="i-chevron-right" size={11} className="admin-sidebar__chevron" />
            </button>

            {/* Depth 2 – 이력 관리 (닫힘) */}
            <button type="button" className="admin-sidebar__d2">
              <span className="admin-sidebar__d2-label admin-sidebar__d2-label--muted">
                이력 관리
              </span>
              <Icon id="i-chevron-right" size={11} className="admin-sidebar__chevron" />
            </button>
          </div>
        </div>

        {/* Depth 1 – 결제 관리 (비활성) */}
        <button type="button" className="admin-sidebar__d1">
          <span className="admin-sidebar__d1-label admin-sidebar__d1-label--inactive">
            결제 관리
          </span>
          <Icon id="i-chevron-right" size={13} className="admin-sidebar__chevron" />
        </button>

        {/* Depth 1 – 이력 관리 (비활성) */}
        <button type="button" className="admin-sidebar__d1">
          <span className="admin-sidebar__d1-label admin-sidebar__d1-label--inactive">
            이력 관리
          </span>
          <Icon id="i-chevron-right" size={13} className="admin-sidebar__chevron" />
        </button>
      </nav>

      {/* ---- 하단 사용자 정보 ---- */}
      <AdminSidebarUser />
    </div>
  );
}
