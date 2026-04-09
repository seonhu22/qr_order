// src/apps/admin/features/sidebar/components/AdminSidebarHeader.tsx

import '@/apps/admin/features/sidebar/styles/AdminSidebarHeader.css';
import { AdminBrand } from '@/apps/admin/features/brand/components/AdminBrand';
import { Icon } from '@/shared/assets/icons/Icon';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';

/**
 * 관리자 사이드바 브랜드 헤더
 *
 * - AdminBrand (QR 아이콘 박스 + QRorder 텍스트 + ADMIN 뱃지)
 * - 우측 닫기(X) 버튼
 *
 * Figma: node 17-4098
 */
export function AdminSidebarHeader() {
  const closeSidebar = useAdminLayoutStore((state) => state.closeSidebar);

  return (
    <header className="admin-sidebar-header">
      <AdminBrand />
      <button
        type="button"
        className="admin-sidebar-header__close"
        aria-label="사이드바 닫기"
        onClick={closeSidebar}
      >
        <Icon id="i-close" size={16} />
      </button>
    </header>
  );
}
