import '@/apps/admin/features/brand/styles/AdminBrand.css';
import { Icon } from '@/shared/assets/icons/Icon';

export function ClientBrand() {
  return (
    <div className="admin-brand">
      <div className="admin-brand__icon-box">
        <Icon id="i-qr" size={22} label="QR Order 로고" />
      </div>
      <span className="admin-brand__name" aria-label="QRorder">
        <span className="admin-brand__name--qr">QR</span>
        <span className="admin-brand__name--order">order</span>
      </span>
      <span className="admin-brand__badge" aria-label="클라이언트">
        CLIENT
      </span>
    </div>
  );
}
