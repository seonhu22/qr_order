import './AdminBrand.css';
import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 관리자 앱 브랜드 로고 컴포넌트
 *
 * 로그인 카드 헤더, 사이드바 상단 등 다크 배경 위에서 재사용
 *
 * @example
 * <AdminBrand />
 */
export function AdminBrand() {
  return (
    <div className="admin-brand">
      <div className="admin-brand__icon-box">
        <Icon id="i-qr" size={22} label="QR Order 로고" />
      </div>
      <span className="admin-brand__name" aria-label="QRorder">
        <span className="admin-brand__name--qr">QR</span>
        <span className="admin-brand__name--order">order</span>
      </span>
      <span className="admin-brand__badge" aria-label="관리자">ADMIN</span>
    </div>
  );
}
