# Client 메뉴 관리 권한

## 확정 정책과 적용 범위

사용자 결정: `staffRole=01` 관리자만 메뉴/옵션 관리를 사용한다. 직원호출 설정/주문/결제 등 다른 Client 업무 권한은 유지한다.

- 제한 경로: `/client/menu/info/management`, `/client/menu/info/option`.
- 판정 필드: `/api/auth/me`의 `staffRole`. 전역 `role=ADMIN`이나 목록용 `userRole`로 대체하지 않는다.
- 역할 누락/잘못된 값은 메뉴 관리를 허용하지 않는다.
- 차단 시 기존 Client 메인으로 이동한다. 신규 권한 오류 화면은 추가하지 않았다.

## 구현을 읽는 순서

1. [판정 함수](../../src/shared/menu/clientMenuAccess.ts): 관리자 여부와 메뉴 경로를 판정한다.
2. [메뉴 필터](../../src/shared/menu/clientNavigation.ts): 서버 카탈로그와 정적 fallback 모두 필터한 뒤 빈 그룹/섹션을 제거한다.
3. [인증 연결](../../src/apps/client/hooks/useClientNavigationMenus.ts): 현재 인증 정보에서 `staffRole`을 가져온다. 역할 변경도 다시 계산한다.
4. [직접 URL 가드](../../src/apps/client/routes/ClientMenuAccessGuard.tsx): 보호 그룹 안에서는 URL 문자열과 무관하게 관리자 권한을 검사한다.
5. [라우트 연결](../../src/apps/client/routes/ClientRoutes.tsx): 두 관리 페이지만 보호 그룹에 배치한다.
6. [브라우저 회귀](../../e2e/client-menu-permissions.spec.ts): 관리자 정상 조회/스태프 차단/URL 변형을 검증한다.

## 왜 두 단계인가

메뉴 숨김은 잘못된 이동을 줄이고, 라우트 가드는 주소 직접 입력을 막는다. 메뉴만 숨겨도 URL은 입력할 수 있으므로 둘 다 적용했다.
다만 두 기능 모두 브라우저에서 실행된다. 직접 API 호출을 막는 서버 인가의 대체가 아니다.

```text
현재 세션 staffRole → 공통 판정
                    → 서버/기본 메뉴 필터
                    → 보호 라우트 가드
서버 API 인가       → 세션 userRole=01 검사/실제 서버 QA 대기
```

## 실행 중 확인한 문제

처음 가드는 현재 URL 텍스트로 보호 대상인지 다시 판단했다. React Router는 대문자 URL도 해당 페이지로 연결하므로 우회가 재현됐다.
수정 후 가드는 보호 라우트 그룹 자체를 기준으로 역할을 검사한다. 메뉴 필터도 대소문자/인코딩을 정규화하고 잘못된 인코딩은 허용하지 않는다.
권한을 별도 state/effect에 복사하지 않아 계정 변경 후 오래된 권한이 남는 경로를 줄였다.

## 검증과 한계

- 테스트는 [자동화 검증 명령](../testing/verification.md)으로 실행한다.
- 브라우저는 API fixture를 사용한다. 실제 세션/DB 검증은 [수동 QA 목록](../todo.md#일괄-수동-qa-대기-목록)에 남긴다.
- 후속 서버 작업으로 메뉴 API 역할 검사를 추가했다. DB 스키마/DTO/생성 타입은 유지했다. 실제 서버 직접 요청 검증은 대기한다. [서버 보고서](../../../docs/qa/2026-11-11-backend-security-boundaries.md).
- 판정/메뉴/가드 테스트의 파일은 소스 옆 `.test.ts`/`.test.tsx`에서 확인한다.

커밋별 학습 순서/실패 재현/검증 결과: [권한 검증 보고서](../../../docs/qa/2026-11-11-client-menu-permissions.md).
