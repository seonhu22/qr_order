import './AdminHeader.css';
import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 관리자 레이아웃 상단 헤더
 *
 * - 사이드바 토글 버튼 (햄버거 메뉴)
 * - 상단 내비게이션 탭 (시스템 / 게시판)
 *
 * TODO: 활성 탭·토글 동작은 라우트·상태 연결 예정 (현재 UI only)
 */
export function AdminHeader() {
  return (
    <div className="admin-header">
      {/* 사이드바 토글 버튼 */}
      <button type="button" className="admin-header__toggle" aria-label="메뉴 열기/닫기">
        <Icon id="i-menu" size={20} />
      </button>

      {/* 상단 내비게이션 탭 */}
      <nav className="admin-header__nav" aria-label="상단 메뉴">
        {/* TODO : CONTANTS를 받아  반복문 UL LI 구조으로 제작  */}
        {/* --ACTIVE를 사용하면 활성 탭 표시 가능 */}
        <button
          type="button"
          className="admin-header__nav-item admin-header__nav-item--active"
          aria-current="page"
        >
          시스템
        </button>
        <button type="button" className="admin-header__nav-item">
          게시판
        </button>
      </nav>
    </div>
  );
}
