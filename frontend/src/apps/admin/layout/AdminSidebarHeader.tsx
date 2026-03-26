import './AdminSidebarHeader.css';
import { AdminBrand } from '../components/AdminBrand';
import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 관리자 사이드바 브랜드 헤더
 *
 * - AdminBrand (QR 아이콘 박스 + QRorder 텍스트 + ADMIN 뱃지)
 * - 우측 닫기(X) 버튼
 *
 * Figma: node 17-4098
 */
export function AdminSidebarHeader() {
  return (
    <div className="admin-sidebar-header">
      <AdminBrand />
      <button type="button" className="admin-sidebar-header__close" aria-label="사이드바 닫기">
        <Icon id="i-close" size={16} />
      </button>
    </div>
  );
}
