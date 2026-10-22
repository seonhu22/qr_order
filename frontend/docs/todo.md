# 프론트엔드 TODO

확인된 후속 작업만 기록한다. 계약이나 해결 방식이 확정되지 않은 내용은 구현 결정으로 간주하지 않는다.

## 옵션 항목 행 추가 시 빈 화면

- 상태: 코드 수정 완료/수동 QA 대기
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

### 수정 기록

- 브랜치: `fix/frontend-menu-option-detail-validation`
- 원인: 렌더링의 dirty 판정이 저장용 payload 빌더를 호출해 빈 가격을 숫자로 변환했다.
- 수정: 원시 행 비교로 dirty 여부를 판단하고 숫자 변환은 저장 시점에만 수행한다.
- 자동 검증: 옵션 관리 2개 파일/15개 테스트, typecheck, lint, build 통과
- 남은 검증: Client 화면에서 `옛날통닭 > 부위 선택 > 다리/몸통` 저장과 카탈로그 반영 확인

## 주문 수정 오프라인에서 저장 버튼이 무응답처럼 표시됨

- 상태: 보류
- 발견일: 2026-10-21
- 화면: `/client/order/status/management`
- 영향: 주문 수정 저장 중 네트워크가 Offline이면 오류 안내 없이 확인 버튼이 흰색 비활성 상태로 멈춘다.

### 관찰 결과

1. 주문 수정 draft를 만든 뒤 Chrome Network를 Offline으로 변경했다.
2. 저장 확인 버튼을 눌렀지만 스피너/오류/Network 요청/콘솔 로그가 나타나지 않았다.
3. Online 복구 뒤 주문 수정 요청이 `200`으로 한 번만 처리됐다.
4. 다음 수정 작업에서는 새로운 `clientRequestId`가 사용됐다.

### 원인 후보

React Query의 기본 mutation 정책이 오프라인 요청을 실패시키지 않고 paused 상태로 보관한 뒤 Online 복구 시 자동 재개한다. 화면은 로컬 `isPending`을 유지하지만 확인 버튼에 `loading` 대신 `disabled`만 전달해 대기 이유와 재개 동작을 알리지 않는다.

### 권장 방향

- 저장 전에 오프라인 여부를 확인하고 요청을 자동 대기열에 넣지 않는다.
- `네트워크 연결을 확인한 후 다시 시도해주세요.`를 표시한다.
- draft와 동일한 `clientRequestId`를 유지하고 처리 중 상태를 해제한다.
- 연결 복구 후 사용자가 직접 다시 저장하게 한다.
- Online 복구만으로 보류된 수정이 자동 저장되지 않게 한다.

### 완료 조건

- Offline 저장 시 즉시 오류 안내가 나타나고 버튼이 다시 활성화된다.
- draft/`clientRequestId`가 유지된다.
- Online 복구만으로 요청이 자동 전송되지 않는다.
- 사용자가 다시 저장하면 동일 `clientRequestId`로 한 번만 반영된다.
- 로딩/오류/성공 상태에 대한 훅 테스트를 추가한다.
