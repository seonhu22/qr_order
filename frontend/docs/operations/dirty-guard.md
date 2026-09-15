# 이탈방지 가드

> 편집형 페이지의 미저장 변경 경고는 `usePreventLeave`와 `useGuardedNavigate`로 통일한다.

## 적용 대상

편집형 페이지에서 저장하지 않은 변경(`dirty`) 상태로 아래 동작을 시도하면 공용 이탈방지 가드를 거친다.

- 다른 메뉴/홈으로 이동
- 새로고침, 탭·창 닫기
- 로그아웃

## 페이지 상태 등록

페이지 상태 훅에서 `usePreventLeave(isDirty)`를 등록한다.

```ts
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';

usePreventLeave(isDirty);
```

- `isDirty === true`인 동안만 `beforeunload`를 등록한다.
- 저장 완료 후 `isDirty`를 `false`로 되돌리면 자동 해제된다.
- unmount 시에도 자동으로 dirty 상태를 해제한다.
- 페이지 안의 추가/수정 모달이 별도 dirty를 갖는다면 페이지 `isDirty`와 OR로 합친다. 모달이 여러 단계로 쌓이는 화면(예: 주문 수정 → 메뉴 추가 → 옵션 추가)은 단계별 dirty를 전부 OR로 합친다 — worked example: [`page/order-status-management.md`](../page/order-status-management.md#이탈방지-주문-수정--메뉴-추가--옵션-추가).

## 메뉴/홈 이동

메뉴/홈 이동은 `guardedNavigate`로 처리한다.

```ts
const { guardedNavigate } = useGuardedNavigate();

guardedNavigate('/admin/main', undefined, () => {
  setActiveSection(null);
  closeSidebar();
});
```

- `isDirty === false`: 즉시 이동하고 `onNavigate` 콜백 실행
- `isDirty === true`: 이동을 보류하고 `ConfirmModal` 표시
- `onNavigate` 부수효과는 사용자가 이동을 확인한 뒤에만 실행한다.

## 로그아웃 등 커스텀 액션

navigate가 아닌 액션은 `requestLeaveConfirm`으로 처리한다.

```ts
const { requestLeaveConfirm } = useGuardedNavigate();

requestLeaveConfirm({
  type: 'custom',
  title: '로그아웃하시겠습니까?',
  description: '저장하지 않은 내용이 있습니다.\n로그아웃하면 변경사항이 사라집니다.',
  confirmLabel: '로그아웃',
  onConfirm: () => logoutMutate(),
});
```

`isDirty === false`면 즉시 `onConfirm()`을 실행한다.

## 모달 렌더링 위치

`ConfirmModal`은 앱 셸(`AdminLayout`/`ClientLayout`)에서 1곳만 렌더링한다.
`useGuardedNavigate()`가 반환하는 `pendingLeaveAction`, `confirmPendingLeaveAction`, `cancelPendingLeaveAction`을 레이아웃에서 구독한다.

## 알려진 제한사항

- 브라우저 뒤로/앞으로가기 버튼은 가드하지 않는다.
- `beforeunload` 확인창 문구는 브라우저 기본값이며 커스터마이징할 수 없다.
- 한 시점에 하나의 dirty source만 존재한다고 가정한다.

설계 배경은 [ADR-009](../decisions.md#adr-009--이탈방지-가드-useblocker-대신-커스텀-guarded-navigate)를 참고한다.
