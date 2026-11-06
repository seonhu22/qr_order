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

import { Navigate, useRoutes } from 'react-router-dom';
import DevLayout from './DevLayout';
import InputGuide from './InputGuide';
import ModalGuide from './ModalGuide';
import SelectGuide from './SelectGuide';
import FilterGuide from './FilterGuide';
import ButtonGuide from './ButtonGuide';
import BadgeGuide from './BadgeGuide';
import CheckboxGuide from './CheckboxGuide';
import RadioGuide from './RadioGuide';
import ToggleGuide from './ToggleGuide';
import FormAlertGuide from './FormAlertGuide';
import TableGuide    from './TableGuide';
import TreeMenuGuide from './TreeMenuGuide';
import ErrorPageGuide from './ErrorPageGuide';
import FileAttachmentGuide from './FileAttachmentGuide';
// import FeedbackGuide from './FeedbackGuide';

const devRoutes = [
  {
    // AppRoutes의 `/dev/*` 아래에서 실행되므로 여기서는 부모 기준 상대 경로를 사용한다.
    path: '/',
    element: <DevLayout />,
    children: [
      /* /dev 진입 시 첫 가이드로 리다이렉트 */
      { index: true, element: <Navigate to="/dev/modal" replace /> },

      { path: 'input',  element: <InputGuide /> },
      { path: 'modal',  element: <ModalGuide /> },
      { path: 'select', element: <SelectGuide /> },
      { path: 'filter', element: <FilterGuide /> },
      { path: 'button',   element: <ButtonGuide /> },
      { path: 'badge',    element: <BadgeGuide /> },
      { path: 'checkbox', element: <CheckboxGuide /> },
      { path: 'radio',    element: <RadioGuide /> },
      { path: 'toggle',     element: <ToggleGuide /> },
      { path: 'form-alert', element: <FormAlertGuide /> },
      { path: 'table',     element: <TableGuide /> },
      { path: 'tree-menu', element: <TreeMenuGuide /> },
      { path: 'error-page', element: <ErrorPageGuide /> },
      { path: 'file-attachment', element: <FileAttachmentGuide /> },
      // { path: 'feedback', element: <FeedbackGuide /> },
    ],
  },
];

/** 운영 번들에서는 제외하고 개발 모드에서만 동적으로 불러오는 가이드 route 루트다. */
export function DevRoutesRoot() {
  return useRoutes(devRoutes);
}
