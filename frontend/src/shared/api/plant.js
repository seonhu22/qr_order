/**
 * @typedef {object} PlantSummary
 * @property {string} plantCd 사업장 코드
 * @property {string} plantNm 사업장 명
 * @property {string} useYn 사용 여부
 */

/**
 * 사업장 목록 미리보기를 조회한다.
 *
 * 현재 단계에서는 TanStack Query 사용 예시를 제공하기 위한 읽기 전용 API 함수이다.
 * 실제 검색 화면이 고도화되면 queryKey에 검색어, 페이지, 정렬 조건 등을 포함해
 * 이 함수를 확장하는 방식으로 재사용할 수 있다.
 *
 * @param {string} [searchKeyword=''] 서버에 전달할 검색어
 * @returns {Promise<PlantSummary[]>} 사업장 요약 목록
 */

/**
 * * 이 fetch 함수를 따로 작성하는 이유는 무엇일까?
 * 1. API 경로가 파일 안에 흩어져 바꾸기 어렵다.
 * 2. API 호출 로직이 중복된다.
 * 3. 에러 처리 방식이 매번 바뀐다.
 *
 * 이러한 이유로 공통 API 호출을 담당하는 파일을 만들어서 관리하는 것이 좋다. 그렇기 때문에 shared 파일 안에 작성된 것이다.
 *
 * * API 함수는 어떻게 요청할지만 담고 있도록 분리하는 것이 목표
 */
export async function fetchPlantSummaries(searchKeyword = '') {
  const searchParams = new URLSearchParams();

  if (searchKeyword) {
    searchParams.set('searchKeyword', searchKeyword);
  }

  const queryString = searchParams.toString();
  const requestUrl = queryString
    ? `/api/system/settings/plant/search?${queryString}`
    : '/api/system/settings/plant/search';

  const response = await fetch(requestUrl, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('사업장 목록을 불러오지 못했습니다.');
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}
