# 공용 컴포넌트 작성 규칙

## 목차

- [1. 3-레이어 패턴](#1-3-레이어-패턴)
- [2. 스타일 규칙](#2-스타일-규칙)
- [3. 타입 규칙](#3-타입-규칙)
- [4. 신규 컴포넌트 추가 절차](#4-신규-컴포넌트-추가-절차)
- [5. 모달 작성 시 추가 원칙](#5-모달-작성-시-추가-원칙)
- [6. 개발 전용 가이드 페이지](#6-개발-전용-가이드-페이지)
- [7. 피드백 컴포넌트 (FeedbackState)](#7-피드백-컴포넌트-feedbackstate)

---

## 1. 3-레이어 패턴

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

## 2. 스타일 규칙

- Tailwind CSS를 사용하지 않는다.
- `semantic-tokens.css`의 CSS 변수만 참조한다. px 값 직접 사용 금지.
- 각 컴포넌트 폴더 내부에 전용 CSS 파일을 작성한다 (예: `Input.css`).
- 클래스 네이밍은 BEM 방식을 따른다 (예: `.input-control__slot-left`).

---

## 3. 타입 규칙

- 신규 컴포넌트는 TypeScript(`.tsx`)로 작성한다.
- 공통 타입은 컴포넌트 폴더 내 `types.ts`에 정의한다.
- 폴더 외부에서는 `index.ts` 배럴 파일을 통해서만 import한다.

```ts
// 올바른 import
import { TextInput } from '@/shared/components/input';
import { Button, LinkButton } from '@/shared/components/button';
import { CheckboxInput, CheckboxGroup } from '@/shared/components/checkbox';
import { RadioInput, RadioGroup } from '@/shared/components/radio';
import { ToggleInput } from '@/shared/components/toggle';
import { FormAlert, DismissibleFormAlert } from '@/shared/components/form-alert';
import { FeedbackState } from '@/shared/components/feedback';
import { Icon } from '@/shared/assets/icons/Icon';

// 금지 — 내부 파일 직접 참조
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button/Button';
```

---

## 4. 신규 컴포넌트 추가 절차

1. `shared/components/{컴포넌트명}/` 폴더 생성
2. `types.ts` → CSS 파일 → Base/Wrapper → 완성형 순서로 작성
3. `index.ts` 배럴 파일에 공개 API 등록
4. `shared/dev/{컴포넌트명}Guide.tsx` 가이드 페이지 작성
5. `DevRoutes.tsx` 및 `DevLayout.tsx`에 라우트·메뉴 등록

---

## 5. 모달 작성 시 추가 원칙

1. `wrapper`는 DOM 분리와 overlay 동작만 담당한다.
2. `base`는 시각적 골격만 담당한다.
3. `template`는 실제 DTO와 연결되는 비즈니스 목적 모달만 담당한다.
4. 저장/수정/삭제 흐름은 가능하면 template 계층에서 명확히 분리한다.
5. 폼을 포함한 모달은 `BaseFormModal`처럼 별도 베이스를 두고 검증/전송 규칙을 공통화한다.
6. Audit Trail을 위한 변경 전/후 데이터 비교 로직은 template 계층에서 수행한다.

---

## 6. 개발 전용 가이드 페이지

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

## 7. 피드백 컴포넌트 (FeedbackState)

`src/shared/components/feedback/FeedbackState.tsx`

로딩·에러·빈 결과·권한 없음 등 다양한 상태를 `variant` 하나로 표현하는 공용 피드백 컴포넌트.

### 사용법

```tsx
import { FeedbackState } from '@/shared/components/feedback';

// 로딩
<FeedbackState variant="loading" title="목록을 불러오는 중입니다." />

// 에러 (아이콘: i-error, 빨간색)
<FeedbackState variant="error" description="잠시 후 다시 시도해주세요." />

// 빈 결과 (아이콘: i-feedback-pointer)
<FeedbackState
  variant="empty"
  title="목록을 선택해주세요"
  description="행을 클릭하면 상세가 표시됩니다."
/>

// 권한 없음 (아이콘: i-lock)
<FeedbackState variant="unauthorized" />
```

### variant 기본값

| variant | 기본 아이콘 | 기본 문구 | 아이콘 색상 |
|---|---|---|---|
| `loading` | 스피너 | 불러오는 중입니다. | muted |
| `error` | `i-error` | 불러오는데 실패했습니다. | error red |
| `empty` | `i-feedback-pointer` | 데이터가 없습니다. | muted |
| `unauthorized` | `i-lock` | 접근 권한이 없습니다. | muted |

### Props

| prop | 타입 | 설명 |
|---|---|---|
| `variant` | `'loading' \| 'error' \| 'empty' \| 'unauthorized'` | 필수 |
| `title` | `string` | 기본 문구를 덮어쓸 때 사용 |
| `description` | `string` | 보조 설명 |
| `children` | `ReactNode` | 설명 아래 커스텀 콘텐츠 (버튼 등) |
| `className` | `string` | 추가 클래스 |

### 카드 안에서 전체 영역 채우기

카드가 `display: flex; flex-direction: column`이면 FeedbackState의 `flex: 1`이 자동으로 남은 공간을 채운다.
특정 카드에서 추가 제어가 필요하면 className으로 처리한다.

```css
/* 예시 — CommonCodePage.css */
.common-code-card > .common-code-card__empty {
  flex: 1;
  min-height: 0;
}
```

### 신규 variant 추가 방법

`FeedbackState.tsx`의 `VARIANT_CONFIG`에 항목을 추가한다.

```ts
const VARIANT_CONFIG: Record<FeedbackVariant, VariantConfig> = {
  // 기존 ...
  maintenance: { defaultTitle: '점검 중입니다.', iconId: 'i-setting', iconSize: 22 },
};
```

`FeedbackVariant` 타입도 함께 확장한다.
