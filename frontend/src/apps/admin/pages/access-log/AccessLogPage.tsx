/**
 * @fileoverview 접속정보조회 페이지 컨테이너
 *
 * @description
 * - 좌우 분할 레이아웃: 마스터(접속 로그 목록) 좌측, 디테일(메뉴 접근 목록) 우측
 * - 마스터 행 클릭 시 해당 sysId로 디테일 조회
 * - 날짜 범위 유효성 검사: 종료 > 시작, 최대 7일
 */

import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/access-log/AccessLogPage.css';
import { AccessLogDetailTable } from '@/apps/admin/features/access-log/components/AccessLogDetailTable';
import { AccessLogFilters } from '@/apps/admin/features/access-log/components/AccessLogFilters';
import { AccessLogMasterTable } from '@/apps/admin/features/access-log/components/AccessLogMasterTable';
import { useAccessLogPageState } from '@/apps/admin/features/access-log/hooks/useAccessLogPageState';

export function AccessLogPage() {
  const { data, status, actions, uiProps } = useAccessLogPageState();

  return (
    <AdminMainLayout
      adminMainTitle="접속 정보 조회"
      depth1="시스템"
      depth2="이력 관리"
      className="admin-main-layout-page--fixed"
      filterSlot={
        <AccessLogFilters
          draftKeyword={uiProps.draftKeyword}
          draftStartDate={uiProps.draftStartDate}
          draftEndDate={uiProps.draftEndDate}
          dateRangeError={uiProps.dateRangeError}
          onKeywordChange={actions.handleKeywordChange}
          onStartDateChange={actions.handleStartDateChange}
          onEndDateChange={actions.handleEndDateChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />
      }
    >
      <div className="access-log-page__layout">
        <AccessLogMasterTable
          rows={data.masterRows}
          isLoading={status.isLoadingMasters}
          isError={status.isErrorMasters}
          selectedId={uiProps.selectedId}
          onSelectRow={actions.handleSelectRow}
        />
        <AccessLogDetailTable
          rows={data.detailRows}
          isLoading={status.isLoadingDetails}
          isError={status.isErrorDetails}
          selectedRow={data.selectedRow}
        />
      </div>
    </AdminMainLayout>
  );
}