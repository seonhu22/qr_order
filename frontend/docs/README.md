# 프론트엔드 문서 지도

> 프론트엔드 문서를 찾기 위한 최상위 입구다. 여기서는 큰 주제의 부모 문서만 안내하고, 세부 문서는 각 부모 문서에서 다시 분기한다.

## 읽는 순서

1. 먼저 이 문서에서 작업 주제의 부모 문서를 찾는다.
2. 부모 문서의 `상세 문서` 또는 `관련 문서` 섹션에서 필요한 세부 문서로 이동한다.
3. 컴포넌트·API·정책처럼 범위가 겹치면 부모 문서를 먼저 보고, 상세 문서의 규칙을 우선 적용한다.

## 부모 문서

| 문서 | 내용 |
|---|---|
| [아키텍처](./architecture.md) | 앱 동작 구조, 폴더 구조, 라우팅 기준 |
| [운영 원칙](./operations.md) | 상태 관리, API 호출, 리팩토링, 페이지 패턴, 레이아웃 정책의 부모 문서 |
| [공용 컴포넌트](./components.md) | shared component 작성 규칙과 상세 컴포넌트 문서의 부모 문서 |
| [API 코드 생성](./api-codegen.md) | OpenAPI 코드 생성, MSW 핸들러, mock 파일 기준 |
| [인증 구조](./auth.md) | 로그인 흐름, 인증 상태 관리, 비밀번호 정책 |
| [주요 설정 파일](./config.md) | Vite, TypeScript, ESLint, Prettier, 진입점 파일 요약 |
| [의사결정 기록](./decisions.md) | 주요 설계 결정과 ADR |

## 참고

| 문서 | 내용 |
|---|---|
| [디자인 토큰](./design-tokens.md) | 색상, 타이포그래피, 스크롤바 토큰 |
| [라이브러리](./libraries.md) | 주요 라이브러리와 테스트 도구 선택 근거 |
| [관리자 네비게이션](./admin-navigation.md) | 어드민 메뉴·내비게이션 구조 |
| [메뉴 접근 로그](./menu-access-log.md) | menuCd 결정과 접근 로그 호출 기준 |
| [파일 첨부 정책](./file-attachment-policy.md) | 첨부파일 역할 분리와 화면별 정책 |
| [트러블슈팅](./troubleshooting.md) | 자주 발생하는 문제와 해결 방법 |

## 빠른 경로

| 작업 주제 | 먼저 볼 문서 |
|---|---|
| 새 화면 구현·리팩토링 | [운영 원칙](./operations.md) |
| Query/API wrapper 작업 | [운영 원칙](./operations.md), [API 코드 생성](./api-codegen.md) |
| 공용 컴포넌트 작업 | [공용 컴포넌트](./components.md) |
| 인증·권한·401/403 처리 | [인증 구조](./auth.md), [아키텍처](./architecture.md) |
| 라우팅·폴더 위치 판단 | [아키텍처](./architecture.md) |
| 설정 파일 확인 | [주요 설정 파일](./config.md) |
