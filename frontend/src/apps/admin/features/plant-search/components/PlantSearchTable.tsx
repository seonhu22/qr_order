import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
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
 */
export function PlantSearchTable({ rows, isLoading, isError }: PlantSearchTableProps) {
  /**
   * 서버 상태에 따라 테이블 body를 분기 렌더링한다.
   */
  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td className="plant-search-page__empty" colSpan={9}>
            사업장 목록을 불러오는 중입니다.
          </td>
        </tr>
      );
    }

    if (isError) {
      return (
        <tr>
          <td className="plant-search-page__empty" colSpan={9}>
            사업장 목록을 불러오지 못했습니다.
          </td>
        </tr>
      );
    }

    if (!rows.length) {
      return (
        <tr>
          <td className="plant-search-page__empty" colSpan={9}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id}>
        <td className="plant-search-page__mono">{row.plantCode}</td>
        <td>{row.plantName}</td>
        <td>{row.storeName}</td>
        <td className="plant-search-page__muted">{row.email}</td>
        <td className="plant-search-page__muted">{row.postalCode}</td>
        <td className="plant-search-page__muted">{row.address}</td>
        <td className="plant-search-page__muted">{row.phoneNumber}</td>
        <td>{row.useYn}</td>
        <td>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="plant-search-page__access-button"
            rightIcon={<Icon id="i-plant-access" size={11} />}
          >
            접속
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <article className="plant-search-page__table-card" aria-label="사업장 목록">
      <header className="plant-search-page__table-header">
        <h2 className="plant-search-page__table-title">사업장 목록</h2>
      </header>

      <div className="plant-search-page__table-wrap">
        <table className="plant-search-page__table">
          <thead>
            <tr>
              <th>사업장 코드</th>
              <th>사업장 명</th>
              <th>매장명</th>
              <th>이메일주소</th>
              <th>우편번호</th>
              <th>주소</th>
              <th>전화번호</th>
              <th>사용여부</th>
              <th>클라이언트 접속</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
    </article>
  );
}
