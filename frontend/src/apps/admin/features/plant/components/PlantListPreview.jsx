import { useQuery } from '@tanstack/react-query';
import { fetchPlantSummaries } from '@/shared/api/plant';

/**
 * 관리자 사업장 화면에서 사용할 조회 예시 컴포넌트이다.
 *
 * 이 컴포넌트의 목적은 두 가지이다.
 * 1. TanStack Query를 어떤 방식으로 화면에 연결하는지 팀 기준 예시를 제공한다.
 * 2. 실제 사업장 관리 기능이 완성되기 전에도, 서버 조회/로딩/오류/재조회 흐름을
 *    한 화면에서 확인할 수 있도록 한다.
 *
 * 구현 원칙은 다음과 같다.
 * - queryKey는 기능명과 목적이 드러나도록 구성한다.
 * - queryFn은 shared/api 계층 함수만 호출한다.
 * - 로딩, 오류, 빈 상태, 정상 상태를 모두 분기한다.
 * - 아직 전체 화면 요구사항이 확정되지 않았으므로 읽기 전용 미리보기만 제공한다.
 *
 * @returns {JSX.Element} 사업장 목록 미리보기 패널
 */
function PlantListPreview() {
  // TenStack Query의 핵심 "useQuery" 훅

  const {
    data: plants = [],
    error,
    isError,
    isPending,
    refetch,
  } = useQuery({
    // 이 조회를 식별하는 이름표 같은 역할을 하는 queryKey
    // 나중에 검색어, 페이지 번호, 정렬 조건 등이 추가되더라도 기능명과 목적이 드러나도록 구성하는 것이 좋다. 그래야 나중에 캐시 관리, 디버깅, 개발자 간 소통이 편리해진다.
    // 이 키는 다시 조회할 대상을 구분하는데 쓰이고, 캐시를 구분하고, 조건이 달라지면 다른 query로 인식하기 때문에 신중하게 작성하는 것이 좋다.
    queryKey: ['plants', 'preview'],

    // queryFn은 실제 데이터를 가져오는 함수다.
    // api 계층을 호출하면 된다.
    queryFn: () => fetchPlantSummaries(),
  });

  /**
   * * 주의 사항
   *
   * 1. 조회 컴포넌트는 로딩, 실패, 빈 상태, 정상 상태 모두를 보여주는 것이 사용자 경험에 좋다.
   *
   * 2. 화면에서 서버 상태를 다시 "useState"로 핸들링하거나 복사하지 않는다. useQuery가 제공하는 상태를 이용하자. (isPending, isError, data 등)
   */

  // 로딩상태를 뜻하는 isPending
  if (isPending) {
    return <p>사업장 목록을 불러오는 중입니다.</p>;
  }

  if (isError) {
    return (
      <div>
        <p>{error instanceof Error ? error.message : '사업장 목록 조회 중 오류가 발생했습니다.'}</p>
        <button type="button" onClick={() => refetch()}>
          다시 조회
        </button>
      </div>
    );
  }

  // 빈 상태 처리
  if (plants.length === 0) {
    return <p>표시할 사업장 데이터가 없습니다.</p>;
  }

  return (
    <section>
      <p>조회 예시 데이터 {plants.length}건</p>
      <ul>
        {plants.map((plant) => (
          <li key={plant.plantCd}>
            {plant.plantNm} ({plant.plantCd}) / 사용여부: {plant.useYn}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PlantListPreview;
