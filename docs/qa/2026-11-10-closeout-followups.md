# 마감 작업의 확인 필요 항목

자동 진행 중 기존 계약만으로 확정할 수 없었던 항목이다. 새 정책이나 DB 구조를 가정해 구현하지 않는다.

## 공통코드 연동

- 조회 API `GET /api/combo/common?code=...`는 존재한다.
- 직원호출 선택 방식/취소 사유/미결제 사유/테이블 시설 종류의 실제 마스터 코드와 등록된 상세값은 저장소에서 확인되지 않았다.
- 필요한 정보: Admin 공통코드에 등록된 마스터 코드와 상세 코드 목록 또는 조회 응답.
- 기존 값 유지: `singleYn`의 Y/N, 취소/미결제 사유 문자열은 서버 허용값과 호환되어야 한다.
- 테이블 종류는 현재 이름 역매핑도 사용하므로 코드만 바꾸면 기존 배치 데이터와 호환되지 않을 수 있다.
- 근거: [ComboController](../../qrorder/src/main/java/htms/QROrder/common/controller/ComboController.java), [주문 사유](../../frontend/src/apps/client/features/order-status-management/constants.ts), [테이블 배치](../../frontend/src/apps/client/features/table-layout/api/tableLayoutApi.ts).

## 관리자 알림

- 공지/문의 원본 조회 API는 있지만 알림의 개별/전체 읽음 상태 저장 API는 확인되지 않았다.
- 직원호출 읽음 API를 다른 도메인 알림에 재사용하지 않는다.
- 사용자 후속 결정(2026-11-10): 실제 공지/답변 조회와 계정/매장별 브라우저 로컬 읽음을 먼저 연결했다. 서버 저장과 기기 간 동기화만 후속으로 남긴다.
- 현재 정책: [관리자 알림](../../frontend/docs/page/manager-notifications.md).
- 근거: [현재 실제 조회 훅](../../frontend/src/apps/client/features/notification-center/hooks/useManagerNotificationCenter.ts), [BoardController](../../qrorder/src/main/java/htms/QROrder/client/controller/BoardController.java).

## 사업장 가입/조회 연결

- 대표자 매핑과 허위 URL 생성은 수정했다.
- 가입 이메일은 사용자 계정에 저장되고 사업장 조회는 별도 사업장 이메일 컬럼을 사용한다.
- 일반 가입의 사업장명 수집과 두 이메일의 관계는 별도 확인 대상이다.
- 근거와 전체 필드 연결표: [사업장 조회 계약](./2026-11-10-plant-search-contract.md).

## 자동 E2E와 CI

- 브라우저 E2E는 브라우저가 로그인/주문/결제를 실제로 클릭하고 기대 화면과 응답을 확인하는 자동 테스트다. 현재 Vitest/MSW 화면 테스트와 실행 범위가 다르다.
- 개념 설명 후 모의 API를 사용하는 브라우저 회귀 4개를 구현/검증했다. 실제 서버 저장 검증에는 테스트 계정/독립 QA 데이터/서버 실행·정리 범위를 추가로 정해야 한다.
- 실행과 검증 한계: [브라우저 자동 테스트](../../frontend/docs/testing/browser-e2e.md).
- CI 확대는 사용자 지정 마지막 순서로 저장소 workflow에 연결했다. 원격 실행과 브랜치 보호 check 설정 확인은 후속으로 남긴다.
- 자동화 검증과 한계: [품질 자동화 기록](./2026-11-10-frontend-quality-automation.md).
- 실제 DB를 쓰는 자동 시나리오를 공유 DB에 임의 실행하지 않는다.

## 범위 밖에서 확인한 파일 보안/삭제 한계

- 파일 조회 SQL은 연결 ID로 조회하고 매장 범위 조건이 없다.
- 파일 삭제 경로는 삭제 입력의 파일 메타데이터 복원 여부를 확인해야 한다.
- 이번 신규 답변 업로드 연결에서는 삭제를 지원하지 않고, 두 문제를 해결했다고 보고하지 않는다.
- 근거: [FileMapper](../../qrorder/src/main/resources/mapper/common/FileMapper.xml), [FileService](../../qrorder/src/main/java/htms/QROrder/common/service/FileService.java).
