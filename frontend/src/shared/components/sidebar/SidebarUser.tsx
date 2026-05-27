/**
 * @fileoverview 사이드바 하단 사용자 정보 공용 컴포넌트
 *
 * @description
 * 아바타·이름·역할·로그아웃 버튼을 렌더한다.
 * 로그아웃 확인 모달은 내부에서 처리하고, 확인 시 onLogout 콜백을 호출한다.
 * auth·router에 의존하지 않으므로 어드민·사용자 양쪽에서 재사용 가능.
 *
 * @module shared/components/sidebar/SidebarUser
 */

import { useState } from 'react';
import './SidebarUser.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';


type SidebarUserProps = {
  /** 표시할 사용자 이름 */
  userName: string;
  /** 표시할 사용자 역할 */
  userRole: string;
  /** 로그아웃 확인 후 호출되는 콜백 */
  onLogout: () => void;
  /** 로그아웃 요청 진행 중 여부 (버튼 로딩 상태) */
  isLoggingOut?: boolean;
};

/**
 * 사이드바 사용자 푸터 컴포넌트
 *
 * @example
 * <SidebarUser
 *   userName={userName}
 *   userRole={userRole}
 *   onLogout={() => logoutMutate()}
 *   isLoggingOut={isPending}
 * />
 */
export function SidebarUser({
  userName,
  userRole,
  onLogout,
  isLoggingOut = false,
}: SidebarUserProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <footer className="sidebar-user">
        <div className="sidebar-user__avatar">
          <Icon id="i-user" size={16} />
        </div>
        <div className="sidebar-user__info">
          <span className="sidebar-user__name">{userName}</span>
          <span className="sidebar-user__role">{userRole}</span>
        </div>
        <button
          type="button"
          className="sidebar-user__logout"
          aria-label="로그아웃"
          onClick={() => setModalOpen(true)}
        >
          <Icon id="i-logout" size={16} />
        </button>
      </footer>

      <WrapperModal
        open={modalOpen}
        title="로그아웃"
        subtitle="로그아웃 하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: isLoggingOut,
          onClick: onLogout,
        }}
        secondaryAction={{
          onClick: () => setModalOpen(false),
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
