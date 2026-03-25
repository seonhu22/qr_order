/**
 * @fileoverview 개발 전용 가이드 라우트 정의
 *
 * @description
 * - /dev/* 경로는 모두 여기서 관리
 * - AppRoutes 에서 인증 없이 등록됨
 * - 신규 가이드 페이지 추가 시:
 *   1. 가이드 컴포넌트 생성 (예: ButtonGuide.tsx)
 *   2. 이 파일에 route 등록
 *   3. DevLayout 의 NAV_ITEMS 에 메뉴 추가
 *
 * @module dev/DevRoutes
 */

import { Navigate } from 'react-router-dom';
import DevLayout from './DevLayout';
import InputGuide from './InputGuide';
import ModalGuide from './ModalGuide';
import SelectGuide from './SelectGuide';
import ButtonGuide from './ButtonGuide';
import CheckboxGuide from './CheckboxGuide';
import RadioGuide from './RadioGuide';
// import TableGuide    from './TableGuide';
// import FeedbackGuide from './FeedbackGuide';

export const devRoutes = [
  {
    path: '/dev',
    element: <DevLayout />,
    children: [
      /* /dev 진입 시 첫 가이드로 리다이렉트 */
      { index: true, element: <Navigate to="/dev/modal" replace /> },

      { path: 'input',  element: <InputGuide /> },
      { path: 'modal',  element: <ModalGuide /> },
      { path: 'select', element: <SelectGuide /> },
      { path: 'button',   element: <ButtonGuide /> },
      { path: 'checkbox', element: <CheckboxGuide /> },
      { path: 'radio',    element: <RadioGuide /> },
      // { path: 'table',    element: <TableGuide /> },
      // { path: 'feedback', element: <FeedbackGuide /> },
    ],
  },
];
