# 공용 컴포넌트 작성 규칙

> `shared/components` 작성 규칙(3-레이어 패턴, 스타일·타입 규칙), FeedbackState 사용법, 모달 작성 원칙을 다룬다.

## 목차

- [1. 폴더 구조](#1-폴더-구조)
- [2. 3-레이어 패턴](#2-3-레이어-패턴)
- [3. 스타일 규칙](#3-스타일-규칙)
- [4. 타입 규칙](#4-타입-규칙)
- [5. 신규 컴포넌트 추가 절차](#5-신규-컴포넌트-추가-절차)
- [6. 모달 작성 시 추가 원칙](#6-모달-작성-시-추가-원칙)
- [7. 개발 전용 가이드 페이지](#7-개발-전용-가이드-페이지)
- [8. 피드백 컴포넌트 (FeedbackState)](#8-피드백-컴포넌트-feedbackstate)

---

## 1. 폴더 구조

### public/

```text
public/
  mockServiceWorker.js        ← MSW Service Worker (직접 수정 금지 — npx msw init으로 생성)
  static/
    fonts/
      Pretendard-Thin.woff2
      Pretendard-ExtraLight.woff2
      Pretendard-Light.woff2
      Pretendard-Regular.woff2
      Pretendard-Medium.woff2
      Pretendard-SemiBold.woff2
      Pretendard-Bold.woff2
      Pretendard-ExtraBold.woff2
      Pretendard-Black.woff2  ← Pretendard 웹폰트 9종, fonts.css에서 @font-face로 선언
```

- `mockServiceWorker.js`는 MSW가 브라우저에서 네트워크 요청을 가로채기 위해 반드시 필요하다.
- 폰트 파일은 `shared/styles/fonts.css`에서 `@font-face`로 선언하고, `global.css`가 이를 import한다.

---

### shared/

```text
shared/
  api/
    auth.js               ← 인증 API wrapper
    queryKeys.ts          ← TanStack Query key 상수 모음
  assets/
    icons/
      sprite.svg          ← 모든 아이콘을 하나로 합친 SVG 스프라이트 (직접 수정 금지)
      Icon.tsx            ← <Icon id="..." size={N} /> 컴포넌트
  auth/
    AuthContext.tsx        ← 인증 컨텍스트 타입 정의
    AuthProvider.jsx      ← auth/me Query 캐시 기반 인증 상태 계산
    authResponse.ts       ← 인증 응답 타입
    hooks/
      useAuthLoginMutation.ts
      useAuthLogoutMutation.ts
      useCurrentUser.ts
  components/             ← 공용 UI 컴포넌트 (아래 상세 구조 참고)
  constants/              ← 전역 상수 (확장 예정)
  dev/                    ← 개발 전용 컴포넌트 가이드 (/dev/* 라우트)
    DevLayout.tsx
    DevRoutes.tsx
    {컴포넌트명}Guide.tsx
    devStyles/
  hooks/
    useDirtyConfirmExecutor.ts  ← dirty 상태 확인 후 액션 실행
    useFilterKeywordState.ts    ← 필터 키워드 draft/applied 상태 관리
  lib/
    httpClient.ts         ← fetch 래퍼 (공통 헤더, 에러 처리)
    queryClient.js        ← QueryClient 설정
  routes/
    AppRoutes.jsx         ← 앱 전체 라우트 진입점
  stores/                 ← Zustand 전역 UI 상태 (확장 예정)
  styles/
    global.css            ← 진입점 (reset + fonts + tokens 통합 import)
    reset.css             ← 브라우저 기본 스타일 초기화
    fonts.css             ← Pretendard @font-face 선언
    primitive-tokens.css  ← 원시값 (색상 팔레트, 간격 등)
    semantic-tokens.css   ← 용도 기반 토큰 (컴포넌트에서 이 파일만 참조)
    dashboard.css
    login.css
  types/
    common.ts             ← 전역 공용 타입
  utils/                  ← 공용 유틸 (확장 예정)
```

---

### shared/assets/icons/

아이콘은 SVG 스프라이트 방식으로 관리한다.

- `sprite.svg`: 모든 아이콘 심볼을 하나의 파일로 합쳐 관리한다. 직접 수정하지 않는다.
- `Icon.tsx`: `<Icon id="아이콘ID" size={20} />` 형태로 사용한다.

```tsx
import { Icon } from '@/shared/assets/icons/Icon';

<Icon id="i-error" size={22} />
<Icon id="i-lock" size={22} />
```

---

### shared/components/

```text
shared/components/
  input/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts
    Input.css
    InputBase.tsx         ← Base 계층 (테두리·배경·슬롯)
    InputWrapper.tsx      ← Wrapper 계층 (레이블·도움말·레이아웃)
    TextInput.tsx         ← 완성형
    SelectInput.tsx       ← 완성형
  button/
    index.ts
    types.ts
    Button.css
    Button.tsx
  checkbox/
    index.ts
    types.ts
    Checkbox.css
    CheckboxInput.tsx
  radio/
    index.ts
    types.ts
    Radio.css
    RadioInput.tsx
  toggle/
    index.ts
    types.ts
    Toggle.css
    ToggleInput.tsx
  form-alert/
    index.ts
    types.ts
    FormAlert.css
    FormAlert.tsx
  modal/
    index.ts              ← WrapperModal + template 계열 컴포넌트·타입 전체 공개
    wrapper/
      WrapperModal.tsx    ← Portal, Overlay, Dimmed, ESC/배경 클릭 닫기
    base/
      modal.css           ← 모달 공통 스타일
      modal.constants.ts  ← 크기·버튼 등 상수
      modalType.ts        ← 모달 공통 타입 정의
    template/
      ConfirmModal.tsx        ← 확인/취소 2버튼 모달
      DeleteConfirmModal.tsx  ← 삭제 확인 모달
      EditConfirmModal.tsx    ← 수정 확인 모달
      SaveConfirmModal.tsx    ← 저장 확인 모달
      NoticeModal.tsx         ← 안내(확인 1버튼) 모달
      NoticeConfirmModal.tsx  ← 안내 + 확인/취소 모달
      SimpleDefaultModal.tsx  ← 빈 슬롯형 범용 모달
  table/
    index.ts
  feedback/
    index.ts
    FeedbackState.tsx
    FeedbackState.css
```

#### modal/ 계층 원칙

| 폴더 | 역할 | 수정 빈도 |
|---|---|---|
| `wrapper/` | DOM 분리(Portal), 오버레이, ESC·배경 클릭 닫기 — 인프라만 담당 | 거의 없음 |
| `base/` | 타입·상수·스타일 정의 — 골격 계약 | 타입 추가 시 |
| `template/` | 비즈니스 목적 모달 — DTO 연결, 저장/수정/삭제 흐름 | 화면 추가 시마다 |

- `wrapper/`와 `base/`는 직접 수정하는 경우가 드물다. 새 모달 필요 시 `template/`에 추가한다.
- 외부에서 import할 때는 반드시 `modal/index.ts`를 통한다.

```ts
// 올바른 import
import { ConfirmModal, WrapperModal } from '@/shared/components/modal';
import type { ModalSize, ConfirmModalProps } from '@/shared/components/modal';

// 금지 — 내부 파일 직접 참조
import { ConfirmModal } from '@/shared/components/modal/template/ConfirmModal';
```

---

## 2. 3-레이어 패턴

공용 컴포넌트는 역할에 따라 3개 레이어로 분리한다.

### 일반 컴포넌트

| 레이어 | 역할 | 예시 |
|---|---|---|
| **Base** | 순수 컨트롤 박스 (테두리·배경·슬롯) | `InputBase` |
| **Wrapper** | 레이블·도움말·레이아웃 | `InputWrapper` |
| **완성형** | Base + Wrapper + 기능 조합 | `TextInput` |

Base와 Wrapper는 다른 컴포넌트에서 재사용할 수 있도록 독립적으로 설계한다.
예를 들어 `Select`, `Checkbox` 등 신규 컴포넌트 작성 시 `InputWrapper`를 그대로 재사용한다.

### 모달 컴포넌트

모달은 이 원칙을 더 엄격하게 적용한다.

| 레이어 | 역할 | 예시 |
|---|---|---|
| **Wrapper** | Portal, Overlay, Dimmed, ESC/배경 클릭 닫기 같은 인프라 처리 | `ModalWrapper` |
| **Base** | Header, Body, Footer 구조와 버튼 배치 규칙 정의 | `BaseModal`, `BaseFormModal` |
| **완성형** | DTO 연결, 저장/수정/상세 같은 비즈니스 처리 | `SaveModal`, `UpdateModal`, `DetailModal` |

즉 모달은 단순 시각 컴포넌트가 아니라, 공통 인프라와 공통 골격, 비즈니스 목적을 분리해서 관리해야 한다.

---

## 3. 스타일 규칙

- Tailwind CSS를 사용하지 않는다.
- `semantic-tokens.css`의 CSS 변수만 참조한다. px 값 직접 사용 금지.
- 각 컴포넌트 폴더 내부에 전용 CSS 파일을 작성한다 (예: `Input.css`).
- 클래스 네이밍은 BEM 방식을 따른다 (예: `.input-control__slot-left`).

---

## 4. 타입 규칙

- 신규 컴포넌트는 TypeScript(`.tsx`)로 작성한다.
- 공통 타입은 컴포넌트 폴더 내 `types.ts`에 정의한다.
- 폴더 외부에서는 `index.ts` 배럴 파일을 통해서만 import한다.

### index.ts (배럴 파일) 역할

각 컴포넌트 폴더의 `index.ts`는 외부에 노출할 컴포넌트·타입만 선별해서 재내보내기(re-export)하는 공개 API 진입점이다.

- 내부 구현 파일(`InputBase.tsx`, `modalType.ts` 등)은 이 파일을 통해서만 외부로 노출된다.
- 외부에서는 폴더 경로까지만 지정하고 파일명은 쓰지 않는다.
- 컴포넌트와 타입은 분리해서 내보낸다 (`export` / `export type`).

```ts
// input/index.ts 예시
export { InputBase }    from './InputBase';
export { InputWrapper } from './InputWrapper';
export { TextInput }    from './TextInput';
export { SelectInput }  from './SelectInput';

export type { TextInputProps, SelectInputProps, SelectOption } from './types';
```

```ts
// 올바른 import
import { TextInput } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { RadioInput } from '@/shared/components/radio';
import { ToggleInput } from '@/shared/components/toggle';
import { FormAlert } from '@/shared/components/form-alert';
import { FeedbackState } from '@/shared/components/feedback';
import { ConfirmModal, WrapperModal } from '@/shared/components/modal';
import { Icon } from '@/shared/assets/icons/Icon';

// 금지 — 내부 파일 직접 참조
import { TextInput } from '@/shared/components/input/TextInput';
import { ConfirmModal } from '@/shared/components/modal/template/ConfirmModal';
```

---

## 5. 신규 컴포넌트 추가 절차

1. `shared/components/{컴포넌트명}/` 폴더 생성
2. `types.ts` → CSS 파일 → Base/Wrapper → 완성형 순서로 작성
3. `index.ts` 배럴 파일에 공개 API 등록
4. `shared/dev/{컴포넌트명}Guide.tsx` 가이드 페이지 작성
5. `DevRoutes.tsx` 및 `DevLayout.tsx`에 라우트·메뉴 등록

---

## 6. 모달 작성 시 추가 원칙

1. `wrapper`는 DOM 분리와 overlay 동작만 담당한다.
2. `base`는 시각적 골격만 담당한다.
3. `template`는 실제 DTO와 연결되는 비즈니스 목적 모달만 담당한다.
4. 저장/수정/삭제 흐름은 가능하면 template 계층에서 명확히 분리한다.
5. 폼을 포함한 모달은 `BaseFormModal`처럼 별도 베이스를 두고 검증/전송 규칙을 공통화한다.
6. Audit Trail을 위한 변경 전/후 데이터 비교 로직은 template 계층에서 수행한다.
7. 모달 폼 안의 Input·Select 크기는 `md`로 통일한다.
8. `SelectInput` 드롭다운은 `createPortal`로 `document.body`에 렌더되므로 모달 안에서도 `overflow: hidden`에 잘리지 않는다.

---

## 7. 개발 전용 가이드 페이지

공용 컴포넌트의 시각적 동작을 확인하기 위한 개발 전용 페이지.

### 접근 방법

개발 서버 실행 후 아래 주소로 접속한다.

```text
http://localhost:3000/dev/input
```

- 로그인 인증이 필요 없다.
- 로컬 개발 환경 전용이며 프로덕션 배포와 무관하다.

### 현재 등록된 가이드

| 경로 | 내용 |
|---|---|
| `/dev/input` | TextInput 크기·상태·레이블 위치·기능 전체 예시 |
| `/dev/select` | SelectInput 크기·상태·검색·그룹핑·기능 전체 예시 |
| `/dev/modal` | Modal 크기·상태·레이아웃 전체 예시 |
| `/dev/button` | Button / LinkButton 10가지 변형·3가지 크기·7가지 상태 예시 |
| `/dev/checkbox` | CheckboxInput 크기·상태·indeterminate·그룹 예시 |
| `/dev/radio` | RadioInput / RadioGroup 크기·상태·그룹(col/row) 예시 |
| `/dev/toggle` | ToggleInput 크기·상태(ON/OFF/disabled/loading) 예시 |
| `/dev/form-alert` | FormAlert 4가지 유형·콘텐츠 조합·닫기 예시 |

### 신규 가이드 추가 방법

1. `shared/dev/{컴포넌트명}Guide.tsx` 파일 생성
2. `shared/dev/DevRoutes.tsx`에 라우트 추가

```ts
import ButtonGuide from './ButtonGuide';
{ path: 'button', element: <ButtonGuide /> },
```

3. `shared/dev/DevLayout.tsx`의 `NAV_ITEMS` 배열에 메뉴 등록

```ts
const NAV_ITEMS = [
  { path: '/dev/input', label: 'TextInput' },
  { path: '/dev/button', label: 'Button' },
];
```

---

## 8. 피드백 컴포넌트 (FeedbackState)

`src/shared/components/feedback/FeedbackState.tsx`

로딩·에러·빈 결과·권한 없음 등 다양한 상태를 `variant` 하나로 표현하는 공용 피드백 컴포넌트.

| variant | 기본 문구 |
|---|---|
| `loading` | 불러오는 중입니다. |
| `error` | 불러오는데 실패했습니다. |
| `empty` | 데이터가 없습니다. |
| `unauthorized` | 접근 권한이 없습니다. |

Props·사용 예시·variant 확장 방법은 `index.ts` JSDoc 및 `/dev/feedback` 참고
