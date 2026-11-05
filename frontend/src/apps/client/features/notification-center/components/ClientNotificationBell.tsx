import { useEffect, useRef, useState } from 'react';
import '@/apps/client/features/notification-center/styles/ClientNotificationBell.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import type { ClientNotificationItem } from '../types';

type ClientNotificationBellProps = {
  items: ClientNotificationItem[];
  unseenCount: number;
  onItemClick: (item: ClientNotificationItem) => void;
  onMarkAllRead?: () => void;
};

const KIND_ICON: Record<ClientNotificationItem['kind'], string> = {
  notice: 'i-speaker',
  qna: 'i-info',
  staffCall: 'i-seat',
};

export function ClientNotificationBell({
  items,
  unseenCount,
  onItemClick,
  onMarkAllRead,
}: ClientNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleItemClick = (item: ClientNotificationItem) => {
    setOpen(false);
    onItemClick(item);
  };

  return (
    <div className="client-notification-bell" ref={panelRef}>
      <button
        type="button"
        className="client-notification-bell__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label={unseenCount > 0 ? `읽지 않은 알림 ${unseenCount}건` : '알림'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="client-notification-bell-panel"
      >
        <Icon id="i-bell" size={18} />
        {unseenCount > 0 && (
          <span className="client-notification-bell__badge">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="client-notification-bell-panel"
          role="dialog"
          aria-label="알림"
          className="client-notification-bell__panel"
        >
          <div className="client-notification-bell__panel-header">
            <div className="client-notification-bell__panel-title">
              <Icon id="i-bell" size={16} />
              <span>알림</span>
            </div>
            {unseenCount > 0 && onMarkAllRead && (
              <button
                type="button"
                className="client-notification-bell__mark-all"
                onClick={onMarkAllRead}
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="client-notification-bell__list">
            {items.length === 0 && (
              <p className="client-notification-bell__empty">알림이 없습니다.</p>
            )}
            {items.map((item) => (
              <button
                key={item.sysId}
                type="button"
                className={`client-notification-bell__item${item.seen ? '' : ' client-notification-bell__item--unseen'}`}
                onClick={() => handleItemClick(item)}
              >
                <span className={`client-notification-bell__item-icon client-notification-bell__item-icon--${item.kind}`}>
                  <Icon id={KIND_ICON[item.kind]} size={14} />
                </span>
                <span className="client-notification-bell__item-body">
                  <span className="client-notification-bell__item-row">
                    <span className="client-notification-bell__item-title">{item.title}</span>
                    <span className="client-notification-bell__item-time">
                      {formatDateTimeForDisplay(item.timestamp).slice(0, 16)}
                    </span>
                  </span>
                  <span className="client-notification-bell__item-text">{item.body}</span>
                </span>
                {!item.seen && <span className="client-notification-bell__item-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
