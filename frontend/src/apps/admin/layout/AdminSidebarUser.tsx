import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSidebarUser.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { useLogout } from '@/generated/logout-controller/logout-controller';
import { useAuth } from '@/shared/auth/AuthContext';

/**
 * 관리자 사이드바 — 하단 사용자 정보 영역
 *
 * 아바타 · 이름/역할 · 로그아웃 버튼
 */
export function AdminSidebarUser() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const { mutate: logoutMutate, isPending } = useLogout({
    mutation: {
      onSuccess: () => {
        signOut();
        navigate('/login');
      },
      onError: () => {
        signOut();
        navigate('/login');
      },
    },
  });

  return (
    <>
      <footer className="admin-sidebar-user">
        <div className="admin-sidebar-user__avatar">
          <Icon id="i-user" size={16} />
        </div>
        <div className="admin-sidebar-user__info">
          <span className="admin-sidebar-user__name">관리자</span>
          <span className="admin-sidebar-user__role">admin</span>
        </div>
        <button
          type="button"
          className="admin-sidebar-user__logout"
          aria-label="로그아웃"
          onClick={() => setModalOpen(true)}
        >
          <Icon id="i-logout" size={16} />
        </button>
      </footer>

      <WrapperModal
        open={modalOpen}
        title="알림"
        primaryAction={{
          label: '확인',
          loading: isPending,
          onClick: () => logoutMutate(),
        }}
        secondaryAction={{
          label: '닫기',
          onClick: () => setModalOpen(false),
        }}
        onClose={() => setModalOpen(false)}
      >
        <p>로그아웃 하시겠습니까?</p>
      </WrapperModal>
    </>
  );
}