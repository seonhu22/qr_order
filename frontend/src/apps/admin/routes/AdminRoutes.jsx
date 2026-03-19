// AdminRoutes.jsx
/**
 * 관리자 페이지 라우트 정의
 * - 관리자 페이지는 인증이 필요한 라우트로 구성되어 있습니다.
 * - AppRoutes.jsx에서 RequireAuth 컴포넌트를 통해 보호됩니다.
 */
export const adminRoutes = [
  {
    // 대시보드 메인 페이지 (인덱스 라우트)
    path: '/dashboard',
    element: <></>,
    children: [
      {
        //
        index: true,
        element: <></>,
      },
      {
        // 예시
        path: 'system/settings/plant',
        element: <></>,
      },
    ],
  },
];
