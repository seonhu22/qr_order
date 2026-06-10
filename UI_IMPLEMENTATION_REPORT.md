# QR_ORDER Client UI Implementation Report

## 작업 원칙

- 원격 `push` 미수행
- Figma MCP `use_figma` 및 유료/제한 가능성이 있는 디자인 추출 도구 미사용
- 기존 공용 컴포넌트 우선 재사용
- 각 1depth를 로컬 브랜치와 로컬 커밋 단위로 진행

## 완료 브랜치 및 커밋

| 1depth | 브랜치 | 커밋 |
| --- | --- | --- |
| 매장 | `feature/clientUiStoreInfo` | `00ca823 feat : 매장 테이블 관리 UI 구현` |
| 메뉴 | `feature/clientUiMenu` | `a7d30ef feat : 메뉴 정보관리 UI 구현` |
| 주문 | `feature/clientUiOrder` | `a8c7774 feat : 주문 이력 조회 UI 구현` |
| 결제 | `feature/clientUiPayment` | `e7899ad feat : 결제 현황 및 정산 조회 UI 구현` |
| 게시판 | `feature/clientUiBoard` | `923a78b feat : 게시판 공지사항 및 문의사항 UI 구현` |

현재 `feature/clientUiBoard` 브랜치는 위 커밋들을 모두 포함하는 선형 히스토리입니다.

## 구현 요약

### 매장

- 테이블 관리 화면 구현
- QR 코드 관리 화면 구현
- QR 코드 관리 내부 테이블 번호 콤보박스 구현
- 공용 `SearchFilterCard`, `TableCard`, `TableBodyRenderer`, `SelectInput`, 테이블 액션 버튼 재사용
- `CheckboxInput`의 `aria-label` 전달 보완

### 메뉴

- 메뉴 관리 화면 구현
- 카테고리 목록 및 메뉴 목록 구성
- 카테고리 신규/수정 모달 구현
- 메뉴 신규/수정 모달 구현
- 옵션 관리 화면 구현
- 옵션 그룹 활성 선택 상태 및 옵션 항목 목록 구현
- 주문옵션/수량 설정 옵션 항목 수정 모달 구현
- 공용 선택 행에 `aria-selected` 보완

### 주문

- 주문 이력 조회 화면 구현
- 주문 마스터 목록과 상세 목록 구성
- 주문 마스터 행 선택 시 상세 목록 갱신
- 주문 번호/테이블 번호 검색 필터 구현

### 결제

- 결제 목록 조회 화면 구현
- 결제 목록 상세 활성화 패널 구현
- 정산 조회 화면 구현
- 총 정산 금액 요약과 정산 목록 구성
- 정산 번호/영업일 검색 필터 구현

### 게시판

- 공지사항 조회 화면 구현
- 공지사항 조회 모달 구현
- 문의사항 관리 화면 구현
- 문의사항 조회 모달 구현
- 답변 완료 문의의 모달 헤더 아래 알림 컴포넌트 표시
- 문의사항 신규 모달 구현

## 재사용한 주요 공용 컴포넌트

- `SearchFilterCard`
- `TableCard`
- `TableBodyRenderer`
- `Button`
- `EditTableButton`
- `CreateTableButton`
- `DeleteTableButton`
- `SelectInput`
- `TextInput`
- `TextareaInput`
- `SimpleDefaultModal`
- `WrapperModal`
- `FormAlert`

## 검증 결과

- 각 1depth 대상 테스트 통과
- `npm run typecheck` 통과
- 변경 파일 범위 `npx eslint ...` 통과
- `npm run build` 통과

## 알려진 사항

- 전체 `npm run lint`는 이번 작업과 무관한 기존 generated/admin 코드 lint 오류로 실패합니다.
- 빌드 시 Vite chunk size warning이 출력되지만 빌드는 성공합니다.
- 현재 작업은 mock 기반 UI 단계이며 API 연동은 후속 작업 범위입니다.
