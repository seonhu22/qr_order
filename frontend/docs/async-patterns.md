# 비동기 데이터 연동 패턴

> Mutation 결과 안내 모달, generated API 직접 호출, 단일 엔티티 폼 화면의 구현 패턴을 다룬다.

## 목차

- [1. Mutation 결과 안내 모달 패턴](#1-mutation-결과-안내-모달-패턴)
- [2. Generated API 직접 호출 패턴 (imperative call)](#2-generated-api-직접-호출-패턴-imperative-call)
- [3. 단일 엔티티 폼 화면 패턴](#3-단일-엔티티-폼-화면-패턴)

---

## 1. Mutation 결과 안내 모달 패턴

> 추가일: 2026-06-16

저장·수정·삭제 mutation의 결과(성공/실패)는 `noticeState`와 `SimpleDefaultModal`로 표시한다.

### 기본 규칙

- confirm 모달("저장하시겠습니까?")의 **primaryAction에 `loading`** 을 걸고, API 완료 후에 모달을 닫는다.
- `setIsConfirmOpen(false)`를 API 호출 **전**에 두면 loading이 화면에 보이지 않으므로 **반드시 완료 후**에 닫는다.
- 성공·실패 문구는 `noticeState`(단순 `{ title, description } | null`) 하나로 통일한다.

### 구현 패턴

```ts
// feature hook / page
type NoticeState = { title: string; description: string } | null;

const [noticeState, setNoticeState] = useState<NoticeState>(null);
const [isConfirmOpen, setIsConfirmOpen] = useState(false);
const [isConfirming, setIsConfirming] = useState(false); // mutation hook의 isPending을 쓸 수 없을 때만 사용

const confirmSave = async () => {
  setIsConfirming(true);
  try {
    await saveMutation.mutateAsync({ data: payload });
    setIsConfirmOpen(false);           // ← API 완료 후 닫기
    setNoticeState({ title: '알림', description: '저장되었습니다.' });
  } catch (error) {
    setIsConfirmOpen(false);           // ← 실패 후도 닫기
    setNoticeState({
      title: '오류',
      description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
    });
  } finally {
    setIsConfirming(false);
  }
};
```

`useSaveMutation().isPending`을 그대로 쓸 수 있으면 `isConfirming` 로컬 state는 생략해도 된다.

### JSX 조립

```tsx
<EditConfirmModal
  open={isConfirmOpen}
  description="수정된 내용을 저장하시겠습니까?"
  primaryAction={{ loading: saveMutation.isPending, onClick: confirmSave }}
  secondaryAction={{ disabled: saveMutation.isPending, onClick: () => setIsConfirmOpen(false) }}
  onClose={() => setIsConfirmOpen(false)}
/>

{/* 성공/실패 결과 안내 — 하나의 모달로 통일 */}
<SimpleDefaultModal
  open={!!noticeState}
  title={noticeState?.title ?? '알림'}
  description={noticeState?.description}
  onClose={() => setNoticeState(null)}
/>
```

### 적용 예시

- `useCouponManageModalFlow` — `confirmSave` / `confirmDelete` 패턴 (어드민 쿠폰 관리)
- `useClientUserModalFlow` — `confirmSave` 패턴 (클라이언트 유저 관리)
- `StoreInfoPage.handleSaveConfirm` — 단일 폼 저장 (클라이언트 매장 기본 정보)

---

## 2. Generated API 직접 호출 패턴 (imperative call)

> 추가일: 2026-06-16

`useQuery` / `useMutation` 훅이 아닌 generated API 함수를 **직접 async 호출**해야 하는 경우가 있다.

### 적합한 상황

| 상황 | 이유 |
|---|---|
| 폼 submit 트리거 시 단발 GET 요청 (예: 비밀번호 확인 `pwdChk`) | `useQuery`는 reactive — 폼 submit 흐름에 맞지 않음 |
| 로그인 성공 직후 `/me` 재조회 (`getCurrentUser`) | mutation `onSuccess` 안에서 즉시 결과가 필요 |
| 조건이 확정된 후 단 한 번만 실행되는 요청 | `enabled` 제어보다 직접 호출이 단순 |

### 패턴

```ts
import { pwdChk } from '@/generated/store-manage-controller/store-manage-controller';
// 또는
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';

const handleSubmit = async (event: { preventDefault: () => void }) => {
  event.preventDefault();
  setIsSubmitting(true);
  try {
    const result = await pwdChk({ pwd: password });   // ← 직접 호출
    if (result === true) {
      // 성공 처리
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.');
    }
  } catch {
    setPasswordError('인증 중 오류가 발생했습니다.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 주의사항

- 직접 호출은 **TanStack Query 캐시를 거치지 않는다.** 조회 결과를 캐시에 남겨야 한다면 `useQuery` + `refetch`를 사용한다.
- 직접 호출한 결과를 `useState`에 저장해 UI에 반영한다(서버 상태 캐시 밖의 영역으로 취급).
- wrapper 훅(`useAuthLoginMutation` 등)이 이미 있으면 그 훅을 사용하고 중복 작성하지 않는다.

### 적용 예시

- `LoginPage` — `getCurrentUser()` (로그인 후 me 재조회)
- `StoreInfoPage` — `pwdChk({ pwd })` (접근 인증 폼 submit)

---

## 3. 단일 엔티티 폼 화면 패턴

> 추가일: 2026-06-16

리스트 없이 **단일 엔티티를 조회·수정하는 폼 화면**의 표준이다 (예: 매장 기본 정보, 내 프로필 편집).

### 상태 구성

```ts
const [formValues, setFormValues] = useState<FormModel>(initialValues);
const [isEditMode, setIsEditMode] = useState(false);
const [originalValues, setOriginalValues] = useState<FormModel | null>(null);
const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
const [noticeState, setNoticeState] = useState<NoticeState>(null);

const isDirty =
  isEditMode &&
  originalValues !== null &&
  JSON.stringify(formValues) !== JSON.stringify(originalValues);

usePreventLeave(isDirty);
```

### 편집 모드 전환 — 미저장 변경 경고

```ts
const handleToggleEditMode = (next: boolean) => {
  if (!next && isDirty) {
    setIsDirtyWarningOpen(true);  // 변경사항 있을 때 경고 모달 먼저
    return;
  }
  if (next) setOriginalValues({ ...formValues });
  else setOriginalValues(null);
  setIsEditMode(next);
};

const handleDiscardChanges = () => {
  setIsDirtyWarningOpen(false);
  setFormValues(originalValues!);  // 원래 값으로 복원
  setOriginalValues(null);
  setIsEditMode(false);
};
```

### 저장 흐름

```text
저장 버튼 클릭
  → 필수값/형식 검증 (폼 카드 컴포넌트 내부)
  → 검증 통과 → EditConfirmModal 오픈
  → 확인 클릭 → API 호출 (모달 loading 상태 유지)
  → 성공: 모달 닫기 → isEditMode false → noticeState('저장되었습니다.')
  → 실패: 모달 닫기 → noticeState('오류', error.message)
```

→ confirm 모달의 loading 규칙은 [§1 Mutation 결과 안내 모달 패턴](#1-mutation-결과-안내-모달-패턴)과 동일하다.

### DTO ↔ 화면 모델 변환

서버 응답 타입(`generated/types/`)과 화면 폼 타입이 다를 때 변환 함수를 파일 상단에 둔다.

```ts
// page 또는 feature/api/ 계층
function toFormModel(res: EntityResponse): FormModel { ... }
function toRequestPayload(values: FormModel): EntityRequest { ... }
```

- DTO 변환이 단순하면 page 상단 private 함수로 둬도 된다.
- 여러 곳에서 재사용되면 `features/<feature>/api/` 계층으로 분리한다 ([API 응답·호출 정책](./operations/api-response-policy.md) 참고).

### 접근 인증 게이트

비밀번호 확인 후 폼을 보여줘야 하는 화면은 다음 구조를 따른다.

```tsx
if (!isAuthenticated) {
  return <AuthCard onSubmit={handleAuthSubmit} />;
}
return <FormCard ... />;
```

- 인증 중 브레드크럼을 숨겨야 하면 `useClientLayoutStore.setHideBreadcrumb(true)` (→ [Zustand 정책](./client-zustand-policy.md))
- 비밀번호 확인 API는 직접 imperative 호출 (→ [§2 Generated API 직접 호출 패턴](#2-generated-api-직접-호출-패턴-imperative-call))

### 적용 예시

- `StoreInfoPage` — 비밀번호 인증 게이트 + 단일 폼 조회·수정 (클라이언트 매장 기본 정보)

---

## 관련 문서

- [운영 원칙](./operations.md): 페이지 구조 표준, CRUD 화면 리팩토링 규칙
- [API 코드 생성 가이드](./api-codegen.md): MSW 핸들러 오버라이드, mock 파일 양식
- [Zustand 정책](./client-zustand-policy.md): 전역 UI 상태 관리
