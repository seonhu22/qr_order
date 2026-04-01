import './AdminSidebarUser.css';
import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 관리자 사이드바 — 하단 사용자 정보 영역
 *
 * 아바타 · 이름/역할 · 로그아웃 버튼
 * UI only — 실제 사용자 데이터·로그아웃 연결은 추후 진행
 */
export function AdminSidebarUser() {
  return (
    <footer className="admin-sidebar-user">
      <div className="admin-sidebar-user__avatar">
        관
      </div>
      <div className="admin-sidebar-user__info">
        <span className="admin-sidebar-user__name">관리자</span>
        <span className="admin-sidebar-user__role">admin</span>
      </div>
      <button type="button" className="admin-sidebar-user__logout" aria-label="로그아웃">
        <Icon id="i-logout" size={16} />
      </button>
    </footer>
  );
}
