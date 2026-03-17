import PlantListPreview from '@/apps/admin/features/plant/components/PlantListPreview';

/**
 * 사업장 관리 화면의 기본 페이지 컨테이너이다.
 *
 * 현재 단계에서는 본격적인 CRUD 화면 대신,
 * TanStack Query 기반 조회 예시 컴포넌트를 연결해
 * 서버 상태 관리 흐름의 기준점을 제공한다.
 *
 * @returns {JSX.Element} 사업장 관리 페이지
 */

/**
 * * 왜 자동으로 조회가 시작될까?
 *
 * * 로컬페이지를 열면 어떤 상태가 먼저 보일까?
 *
 *
 * * 페이지는 조립만 하고, 실제 조회 로직은 feature 컴포넌트가 가지는 형태이다.
 */
function PlantPage() {
  return (
    <div className="page-container">
      <h3 className="page-title">사업장 관리</h3>
      <PlantListPreview />
    </div>
  );
}

export default PlantPage;
