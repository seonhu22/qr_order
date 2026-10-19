# 프론트엔드 TODO

확인된 후속 작업만 기록한다. 계약이나 해결 방식이 확정되지 않은 내용은 구현 결정으로 간주하지 않는다.

## 옵션 항목 행 추가 시 빈 화면

- 상태: 보류
- 발견일: 2026-10-19
- 화면: `/client/menu/info/option`
- 영향: 옵션 그룹 저장 후 옵션 항목의 `행 추가`를 누르면 페이지 전체가 빈 화면으로 바뀐다.

### 재현 절차

1. Client 옵션 관리 화면에 진입한다.
2. 옵션 그룹을 추가하고 저장 API 성공을 확인한다.
3. 새 그룹의 상세 옵션 영역에서 `행 추가`를 누른다.
4. 빈 페이지와 `옵션 가격을(를) 숫자로 입력해주세요.` 오류를 확인한다.

### 확인된 원인

새 행의 `menuOptionPrice`는 아직 빈 문자열이다. 하지만
`useMenuOptionManagementPage.ts`가 렌더링 중 `useMemo`에서
`buildMenuOptionDetailRequest`를 호출하고, 이 함수가 빈 새 행까지 즉시
`mapToMenuOptionDetailPayload`로 변환한다. 변환 과정의 `parseRequiredNumber`가 예외를 던져
`MenuOptionManagementPage` 렌더링 전체가 중단된다.

관련 코드:

- `features/menu-option/hooks/useMenuOptionManagementPage.ts`
- `features/menu-option/api/menuOptionApi.ts`

### 수정 시 지켜야 할 기준

- 빈 신규 행은 화면에서 편집할 수 있어야 하며 렌더링 중 예외가 발생하면 안 된다.
- 숫자 필수 검증은 payload 파생 과정이 아니라 저장 시점의 사용자 검증으로 표시한다.
- 잘못된 가격이면 페이지를 닫지 않고 해당 행에 오류를 표시한다.
- 정상 가격 입력 후 `new` API 요청과 목록 재조회가 성공해야 한다.
- 빈 가격/숫자가 아닌 가격/정상 가격에 대한 테스트를 추가한다.
- 페이지 수준 Error Boundary는 보조 안전망으로만 검토하고 입력 검증 오류를 대신 처리하지 않는다.

### 완료 조건

- `행 추가` 직후 빈 행이 정상 표시된다.
- 잘못된 값은 행 단위 오류로 안내된다.
- 정상 옵션 항목을 저장하고 새로고침해도 값이 유지된다.
- 기존 옵션 그룹 추가/수정/삭제 동작에 회귀가 없다.
