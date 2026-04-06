/**
 * @fileoverview 사업장 조회 feature 화면 모델 타입
 *
 * @description
 * - generated DTO를 페이지에서 직접 쓰지 않고, 화면에 필요한 모델로 한 번 변환해서 사용한다.(PlantSearchRow는 서버 DTO와 1:1 대응 타입이 아니라,
 * 사업장 조회 화면에서 바로 렌더링할 수 있게 정리한 feature 모델이다.)
 * - 이후 컬럼이 바뀌거나 서버 응답 형태가 달라져도 이 타입을 중심으로 화면 영향을 줄일 수 있다.
 */

export type PlantSearchRow = {
  id: string;
  plantCode: string;
  plantName: string;
  storeName: string;
  email: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  useYn: 'Y' | 'N';
};
