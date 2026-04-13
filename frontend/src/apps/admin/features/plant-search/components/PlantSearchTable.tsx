import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
import type { PlantSearchRow } from '../types';

type PlantSearchTableProps = {
  rows: PlantSearchRow[];
  isLoading: boolean;
  isError: boolean;
  onAccessClick?: (row: PlantSearchRow) => void;
};

/**
 * 사업장 조회 결과 테이블
 *
 * @description
 * - 목록 렌더링과 상태별 메시지(로딩/에러/빈 결과)만 담당한다.
 * - 데이터 조회와 검색 조건 관리는 상위 hook에서 처리한다.
 */
export function PlantSearchTable({
  rows,
  isLoading,
  isError,
  onAccessClick,
}: PlantSearchTableProps) {
  /**
   * 서버 상태에 따라 테이블 body를 분기 렌더링한다.
   */
  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={9}>
            <FeedbackState variant="loading" title="사업장 목록을 불러오는 중입니다." />
          </td>
        </tr>
      );
    }

    if (isError) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={9}>
            사업장 목록을 불러오지 못했습니다.
          </td>
        </tr>
      );
    }

    if (!rows.length) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={9}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id}>
        <td className="common-table__mono common-table__cell--left">{row.plantCode}</td>
        <td className="common-table__cell--left">{row.plantName}</td>
        <td className="common-table__cell--left">{row.storeName}</td>
        <td className="plant-search-page__muted common-table__cell--left">{row.email}</td>
        <td className="plant-search-page__muted">{row.postalCode}</td>
        <td className="plant-search-page__muted common-table__cell--left">{row.address}</td>
        <td className="plant-search-page__muted">{row.phoneNumber}</td>
        <td>{row.useYn}</td>
        <td>
          {/* TODO: 실제 접속 플로우 연결
              1. 접속 대상 사업장 식별자(sysId/plantCode) 확정
              2. 권한/접속 가능 여부 검증
              3. 필요 시 확인 모달 또는 안내 모달 표시
              4. 세션/토큰 준비 후 클라이언트 시스템으로 이동
              5. 실패 시 에러 메시지 또는 안내 모달 처리 */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="plant-search-page__access-button"
            rightIcon={<Icon id="i-plant-access" size={11} />}
            onClick={() => onAccessClick?.(row)}
          >
            접속
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <TableCard title="사업장 목록" ariaLabel="사업장 목록">
      <div className="common-table-wrap">
        <table className="common-table">
          <thead>
            <tr>
              <th className="common-table__cell--left">사업장 코드</th>
              <th className="common-table__cell--left">사업장 명</th>
              <th className="common-table__cell--left">매장명</th>
              <th className="common-table__cell--left">이메일주소</th>
              <th>우편번호</th>
              <th className="common-table__cell--left">주소</th>
              <th>전화번호</th>
              <th>사용여부</th>
              <th>클라이언트 접속</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
    </TableCard>
  );
}