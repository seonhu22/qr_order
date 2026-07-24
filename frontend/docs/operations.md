# 운영 원칙

> 개발·설계 운영 원칙의 부모 문서다. 이 문서는 핵심 원칙만 요약하고, 상세 기준은 `docs/operations/*` 문서로 분기한다.

## 핵심 원칙

- 서버 상태와 UI 상태는 분리한다.
- 저장/수정/삭제 응답은 공통 응답 구조를 따른다.
- 브라우저 기본 `alert`, `confirm`, `prompt` 사용을 지양한다.
- CSS 클래스는 BEM을 기준으로 통일한다.
- 페이지는 조립만 담당하고, 조회·편집·저장 흐름은 feature hook/API wrapper로 분리한다.

## 상세 문서

| 문서 | 내용 |
|---|---|
| [상태 관리 정책](./operations/state-policy.md) | TanStack Query, Zustand, query key 관리 기준 |
| [API 응답·호출 정책](./operations/api-response-policy.md) | `CommonResponse`, generated API 직접 호출 금지, mapper 명명 규칙 |
| [기능 리팩토링 가이드](./operations/refactoring-guide.md) | page/list state/flow/API wrapper 분리 순서와 shared 승격 기준 |
| [페이지 패턴](./operations/page-patterns.md) | 조회 전용, 편집형 CRUD, 모달 CRUD 화면 표준 |
| [이탈방지 가드](./operations/dirty-guard.md) | `usePreventLeave`, `useGuardedNavigate`, 로그아웃 가드 기준 |
| [레이아웃 정책](./operations/layout-policy.md) | Flex 스크롤 버블링 방지, SPA 뷰포트 고정, gap 기준 |
| [Admin/Client 패리티](./operations/app-parity.md) | 앱별 기능 로직·화면 구조를 맞추는 기준 |
| [화면별 동작 문서](./page/) | 화면 1개의 표기 규칙·모달 흐름·버튼 동작처럼 그 화면에만 해당하는 세부 동작(화면 폴더당 1개 파일, 예: [`order-status-management.md`](./page/order-status-management.md)) |

## 작업별 진입점

| 작업 | 먼저 볼 문서 |
|---|---|
| 서버 상태, Query key, Zustand 기준 확인 | [상태 관리 정책](./operations/state-policy.md) |
| API wrapper, mapper, 저장 응답 처리 | [API 응답·호출 정책](./operations/api-response-policy.md) |
| 기능 리팩토링, shared 승격 판단 | [기능 리팩토링 가이드](./operations/refactoring-guide.md) |
| 신규 조회/CRUD/모달 CRUD 화면 구현 | [페이지 패턴](./operations/page-patterns.md) |
| 미저장 변경 경고, 로그아웃/메뉴 이동 가드 | [이탈방지 가드](./operations/dirty-guard.md) |
| 스크롤, flex 높이, 앱 셸 gap | [레이아웃 정책](./operations/layout-policy.md) |
| Admin/Client 같은 기능 미러링 | [Admin/Client 패리티](./operations/app-parity.md) |
| 칸반 보드처럼 화면 1개 전용 세부 동작 기록 | [화면별 동작 문서](./page/) |

## 신규 화면 구현 체크리스트

- `Filters`가 draft/applied 상태를 분리하는가
- 페이지가 조립만 담당하는가
- generated API를 wrapper를 통해서만 사용하는가
- 필수값 검증이 row error 상태와 함께 표시되는가
- 저장/초기화 공통 흐름이 `useEditablePageFlow`로 분리됐는가
- 삭제/부가 액션처럼 도메인 전용 흐름만 `use<Feature>Flow`에 남아 있는가
- 레이어별 단위 테스트(list state / flow / UI)가 있는가

## 관련 문서

- [비동기 데이터 연동 패턴](./async-patterns.md)
- [TanStack Query 캐시 정책](./query-cache-policy.md)
- [콤보 API 사용 기준](./combo-api-policy.md)
- [의사결정 기록](./decisions.md)
