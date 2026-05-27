import { useNavigate } from 'react-router-dom';
import { ErrorPageTemplate } from '@/shared/components/error';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';

export function AdminForbiddenPage() {
  const navigate = useNavigate();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login', { replace: true }),
      onError: () => navigate('/admin/login', { replace: true }),
    },
  });

  return (
    <ErrorPageTemplate
      statusCode="403"
      title="접근 권한이 없습니다."
      description="현재 계정으로는 관리자 메뉴에 접근할 수 없습니다. 다른 계정으로 로그인해 주세요."
      imageVariant="forbidden"
      layout="fullscreen"
      primaryAction={{
        label: isPending ? '로그아웃 중...' : '로그아웃',
        onClick: () => logoutMutate(),
      }}
    />
  );
}
