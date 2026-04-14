import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
import type { PlantSearchRow } from '../types';

type PlantSearchTableProps = {
  rows: PlantSearchRow[];
  isLoading: boolean;
  isError: boolean;
};

/**
 * 사업장 조회 결과 테이블
 *
 * @description
 * - 목록 렌더링과 상태별 메시지(로딩/에러/빈 결과)만 담당한다.
 * - 데이터 조회와 검색 조건 관리는 상위 hook에서 처리한다.
 * - 로딩 상태는 테이블 tbody가 아닌 카드 레벨에서 FeedbackState로 표시한다.
 */
export function PlantSearchTable({ rows, isLoading, isError }: PlantSearchTableProps) {
  const renderBody = () => {
    if (isError) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={10}>
            사업장 목록을 불러오지 못했습니다.
          </td>
        </tr>
      );
    }

    if (!rows.length) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={10}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => {
      const hasClientUrl = row.clientUrl && row.clientUrl !== '-';
      return (
        <tr key={row.id}>
          <td className="common-table__mono common-table__cell--left">{row.plantCode}</td>
          <td className="common-table__cell--left common-table__cell--truncate" title={row.plantName}>{row.plantName}</td>
          <td className="common-table__cell--left common-table__cell--truncate" title={row.storeName}>{row.storeName}</td>
          <td className="plant-search-page__muted common-table__cell--truncate" title={row.ownerName}>{row.ownerName}</td>
          <td className="plant-search-page__muted common-table__cell--left common-table__cell--truncate" title={row.email}>{row.email}</td>
          <td className="plant-search-page__muted common-table__cell--truncate" title={row.managerName}>{row.managerName}</td>
          <td className="plant-search-page__muted">{row.postalCode}</td>
          <td className="plant-search-page__muted common-table__cell--left common-table__cell--truncate" title={row.address}>{row.address}</td>
          <td className="common-table__cell--left common-table__cell--truncate plant-search-page__muted">{row.phoneNumber}</td>
          <td>
            {/* TODO: clientUrl 백엔드 필드 확정 후 실제 URL 연결 */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="plant-search-page__access-button"
              rightIcon={<Icon id="i-plant-access" size={11} />}
              disabled={!hasClientUrl}
              onClick={() => window.open(row.clientUrl, '_blank')}
            >
              접속
            </Button>
          </td>
        </tr>
      );
    });
  };

  return (
    <TableCard title="사업장 목록" ariaLabel="사업장 목록">
      {isLoading ? (
        <FeedbackState variant="loading" title="사업장 목록을 불러오는 중입니다." />
      ) : (
        <div className="common-table-wrap">
          <table className="common-table">
            <thead>
              <tr>
                <th className="common-table__cell--left">사업자 코드</th>
                <th className="common-table__cell--left">사업자 명</th>
                <th className="common-table__cell--left">상호명</th>
                <th>대표자명</th>
                <th className="common-table__cell--left">이메일 주소</th>
                <th>담당자 명</th>
                <th>우편번호</th>
                <th className="common-table__cell--left">주소</th>
                <th className="common-table__cell--left">전화번호</th>
                <th>클라이언트 접속</th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}
