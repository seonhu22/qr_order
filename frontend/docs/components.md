# 공용 컴포넌트 작성 규칙

> `shared/components` 문서의 부모 문서다. 공통 작성 규칙은 이 문서에 두고, 컴포넌트별 상세 사용법은 `docs/components/*` 문서로 분기한다.

## 목차

- [1. 폴더 구조](#1-폴더-구조)
- [2. 3-레이어 패턴](#2-3-레이어-패턴)
- [3. 스타일 규칙](#3-스타일-규칙)
- [4. 타입 규칙](#4-타입-규칙)
- [5. 신규 컴포넌트 추가 절차](#5-신규-컴포넌트-추가-절차)
- [6. 모달 컴포넌트 (Modal)](#6-모달-컴포넌트-modal)
- [7. 개발 전용 가이드 페이지](#7-개발-전용-가이드-페이지)
- [8. 테이블 카드 컴포넌트 (TableCard)](#8-테이블-카드-컴포넌트-tablecard)
- [9. 트리 메뉴 컴포넌트 (TreeMenu)](#9-트리-메뉴-컴포넌트-treemenu)
- [10. 피드백 컴포넌트 (FeedbackState)](#10-피드백-컴포넌트-feedbackstate)
- [11. 상태 처리와 에러 페이지 (StatusHandling)](#11-상태-처리와-에러-페이지-statushandling)
- [12. 사이드바 컴포넌트 (Sidebar)](#12-사이드바-컴포넌트-sidebar)
- [13. 브레드크럼 컴포넌트 (PageNavigation)](#13-브레드크럼-컴포넌트-pagenavigation)
- [14. 첨부파일 컴포넌트 (FileAttachment)](#14-첨부파일-컴포넌트-fileattachment)

---

## 상세 문서

| 문서 | 내용 |
|---|---|
| [Modal](./components/Modal.md) | 모달 폴더 구조, 계층 원칙, 작성 규칙 21가지 |
| [TableCard](./components/TableCard.md) | 테이블 카드 사용 패턴과 CSS 레퍼런스 |
| [TreeMenu](./components/TreeMenu.md) | 트리 메뉴 사용 패턴과 CSS 레퍼런스 |
| [StatusHandling](./components/StatusHandling.md) | 401/403/404/500 상태 처리와 에러 페이지 |
| [Sidebar](./components/Sidebar.md) | 사이드바 공용 컴포넌트와 앱별 어댑터 기준 |
| [FileAttachment](./components/FileAttachment.md) | 첨부파일 입력·다운로드 UI 기준 |

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
      sprite.svg          ← 모든 아이콘을 하나로 합친 SVG 스프라이트 (신규 추가는 §"shared/assets/icons/" 절 참고)
      Icon.tsx            ← <Icon id="..." size={N} /> 컴포넌트
  auth/
    AuthContext.tsx        ← 인증 컨텍스트 타입 정의
    AuthProvider.tsx      ← auth/me Query 캐시 기반 인증 상태 계산
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
  pages/
    error/                ← 403/404/500 공통 페이지 조립
  routes/
    AppRoutes.tsx         ← 앱 전체 라우트 진입점
  stores/                 ← 공용 Zustand UI 상태가 생길 때만 사용
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

- `sprite.svg`: 모든 아이콘 심볼을 하나의 파일로 합쳐 관리한다. 기존 심볼을 임의로 고치거나 깨뜨리지 않는다.
- `Icon.tsx`: `<Icon id="아이콘ID" size={20} />` 형태로 사용한다.

**신규 아이콘 추가 방법** (자동 생성 도구 없음 — Figma MCP로 가져온 SVG를 직접 추가한다)

1. Figma MCP(`get_design_context`)로 아이콘이 포함된 노드를 읽으면 응답에 `https://www.figma.com/api/mcp/asset/...` 형태의 URL이 함께 나온다. 이 URL을 `curl`로 받으면 실제 SVG(path) 내용을 그대로 얻을 수 있다(7일 내 유효).
2. `sprite.svg`의 `</defs>` 바로 앞에 새 `<symbol id="i-새이름" viewBox="...">`를 추가한다. viewBox는 기존 심볼들이 다 다르므로(`i-eye-off`는 21x21 등) 원본 SVG의 viewBox를 그대로 써도 된다 — `<use>`가 비율대로 스케일한다.
3. `fill`/`stroke` 값은 모두 `currentColor`로 바꾼다(Figma가 내려준 `var(--fill-0, #HEX)` 같은 기본값은 지운다) — 색은 부모의 CSS `color`로 제어한다(`Icon` 컴포넌트 컨벤션).
4. Figma 레이어에 `rotate`/`scale` 같은 CSS transform이 걸려 있으면(예: `-scale-y-100 rotate-180`), 같은 시각 결과가 나오도록 SVG `<g transform="...">`로 옮겨준다.
5. 아이콘이 여러 벡터(sub-layer)로 나뉘어 있으면 각 벡터의 Figma 내 위치(inset %)를 보고 `<g transform="translate(x,y)">`로 배치한다 — 픽셀 단위로 정확히 맞추기보다 시각적으로 합리적인 위치면 충분하다.

사용 예: `i-card`/`i-return`/`i-sale`/`i-shop`/`i-trend-up`(정산 조회 통계 카드, 2026-06-23 추가) 참고.

`i-stairs`/`i-elevator`/`i-smoking`(테이블 배치 관리 내부시설, 2026-06-29 추가)은 Figma 소스 없이 직접 그린 예외 케이스다 — 위 1번(Figma MCP) 단계 없이 기존 심볼과 같은 24x24 viewBox·`currentColor` 스트로크 컨벤션만 맞춰 추가했다.

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
      ConfirmModal.tsx            ← 확인/취소 2버튼 모달
      DeleteConfirmModal.tsx      ← 삭제 확인 모달
      DeleteListConfirmModal.tsx  ← 삭제 항목 목록 포함 저장 확인 모달
      EditConfirmModal.tsx        ← 수정 확인 모달
      SaveConfirmModal.tsx        ← 저장 확인 모달
      NoticeModal.tsx             ← 안내(확인 1버튼) 모달
      NoticeConfirmModal.tsx      ← 안내 + 확인/취소 모달
      SimpleDefaultModal.tsx      ← 빈 슬롯형 범용 모달
      ValidationNoticeModal.tsx   ← 검증 안내 목록 모달
  table/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts              ← 대표 공개 props/type
    tableModelTypes.ts    ← columns/rows/cells 같은 하위 렌더 계약 타입
    tableBadgeTypes.ts    ← badge 값 타입
    TableCard.css         ← 공통 테이블 카드 스타일 (common-code-card, common-table 등)
    TableCard.tsx         ← 카드 레이아웃 컴포넌트
  treeMenu/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts              ← TreeMenuNode<T>, TreeMenuColumn<T> 타입
    _context.ts           ← 내부 Context (index.ts 미공개)
    TreeToggle.tsx        ← 펼치기/접기 버튼
    TreeItem.tsx          ← 재귀 행 컴포넌트 (연결선 렌더 포함)
    TreeMenu.tsx          ← 루트 컴포넌트
    TreeMenu.css
  sidebar/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts              ← SidebarNavItem, SidebarNavGroup, SidebarNavDepth1 타입
    Sidebar.tsx           ← 컨테이너 (--sb-* CSS 변수 제공 + flex 셸)
    Sidebar.css
    SidebarHeader.tsx     ← 사이드바 헤더 (brand 슬롯 + 닫기 버튼)
    SidebarHeader.css
    SidebarSection.tsx    ← depth1 섹션 타이틀 (어드민·클라이언트 공통)
    SidebarSection.css
    SidebarNav.tsx        ← 3계층 nav (props 기반, 라우터·스토어 비의존)
    SidebarNav.css
    SidebarUser.tsx       ← 사용자 푸터 (props 기반, auth 비의존, 로그아웃 모달 내장)
    SidebarUser.css
  feedback/
    index.ts
    FeedbackState.tsx
    FeedbackState.css
  file-attachment/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts              ← ServerFile, FileChangeState, props 타입
    fileTypeUtils.ts      ← 확장자별 아이콘·색상 매핑
    FileInputGroup.tsx    ← 등록·수정 파일 선택 UI
    FileDownloadList.tsx  ← 상세 다운로드 목록
    FileHint.tsx          ← 파일 제약 안내
    FileAttachment.css
  error/
    index.ts              ← 외부 공개 API (배럴 파일)
    types.ts              ← ErrorPageTemplate props/action 타입
    ErrorPageTemplate.tsx ← 403/404/500 공통 화면 템플릿
    ErrorPageTemplate.css
  navigation/
    index.ts              ← 외부 공개 API (배럴 파일)
    PageNavigation.tsx    ← 어드민·클라이언트 공통 브레드크럼 컴포넌트
    PageNavigation.css
```

modal/ 계층 원칙·작성 규칙은 [docs/components/Modal.md](./components/Modal.md) 참고.

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

모달은 이 원칙을 더 엄격하게 적용한다. 레이어별 역할은 [docs/components/Modal.md §2](./components/Modal.md#2-계층-원칙) 참고.

---

## 3. 스타일 규칙

- Tailwind CSS를 사용하지 않는다.
- `semantic-tokens.css`의 CSS 변수만 참조한다. px 값 직접 사용 금지.
- 각 컴포넌트 폴더 내부에 전용 CSS 파일을 작성한다 (예: `Input.css`).
- 클래스 네이밍은 BEM 방식을 따른다 (예: `.input-control__slot-left`).

### 알려진 이슈 — 작업 예정

> 추가일: 2026-04-22

**textarea와 InputBase 폰트 크기 불일치**

현재 페이지 CSS에서 직접 작성한 `textarea`(`notice-manage-textarea` 등)의 폰트 크기가
`InputBase` 컴포넌트와 시각적으로 다르게 보이는 현상이 있다.

- 원인: `textarea`는 브라우저 기본 폰트 설정을 상속하는 반면, `InputBase`는 토큰 기반 폰트 크기를 명시적으로 적용하기 때문이다.
- 해결 방향: `InputBase`를 `textarea` 모드로 확장하거나, 공용 `TextareaBase` 컴포넌트를 추가해 동일한 토큰을 적용한다.
- 임시 처리: 현재는 페이지 CSS에 `font-size: var(--typography-size-body); font-family: inherit;`를 명시해 최대한 맞추고 있으나 완전히 일치하지 않을 수 있다.

---

## 4. 타입 규칙

- 신규 컴포넌트는 TypeScript(`.tsx`)로 작성한다.
- 컴포넌트 폴더의 **대표 공개 props/type**은 `types.ts`에 정의한다.
- 폴더 외부에서는 `index.ts` 배럴 파일을 통해서만 import한다.

### `types.ts`와 `*Types.ts` 구분

현재 shared 컴포넌트는 모든 타입을 단일 `types.ts`로 몰지 않는다.
타입도 역할에 따라 가까운 위치에 둔다.

| 위치 | 용도 | 예시 |
|---|---|---|
| `types.ts` | 폴더의 대표 공개 props/type | `TableCardProps`, `ButtonProps` |
| `*Types.ts` | 같은 폴더 하위 모듈끼리 공유하는 의미 있는 타입 | `tableModelTypes.ts`, `tableBadgeTypes.ts` |
| `features/<domain>/types.ts` | 도메인/업무 의미가 강한 feature 타입 | `RuleDetailRow`, `MasterCode` |

- `types.ts`는 "외부에 공개할 대표 타입" 중심으로 유지한다.
- `columns`, `rows`, `cells` 같은 하위 렌더 계약 타입은 `*Types.ts`로 분리할 수 있다.
- 배지 값 타입처럼 하위 모듈끼리만 공유하는 타입도 별도 `*Types.ts`로 분리할 수 있다.
- feature/domain 타입은 `shared/components`로 올리지 않고 feature 내부에 둔다.

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
import { TreeMenu } from '@/shared/components/treeMenu';
import { Sidebar, SidebarHeader, SidebarSection, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import { ConfirmModal, WrapperModal } from '@/shared/components/modal';
import { PageNavigation } from '@/shared/components/navigation';
import { Icon } from '@/shared/assets/icons/Icon';

// 금지 — 내부 파일 직접 참조
import { TextInput } from '@/shared/components/input/TextInput';
import { ConfirmModal } from '@/shared/components/modal/template/ConfirmModal';
```

---

## 5. 신규 컴포넌트 추가 절차

1. `shared/components/{컴포넌트명}/` 폴더 생성
2. 기본 원칙은 `types.ts` → CSS 파일 → Base/Wrapper → 완성형 순서로 작성한다.
3. 단, `table`, `treeMenu`처럼 복합 shared 시스템은 아래 분리를 허용한다.
   - `types.ts` + `*Types.ts`
   - `parts` 또는 `cells/badges/actions`
   - `renderer`
   - 최종 wrapper/shared 본체
4. `index.ts` 배럴 파일에 공개 API 등록
5. 필요하면 `shared/dev/{컴포넌트명}Guide.tsx` 가이드 페이지 작성
6. 개발 가이드를 추가한 경우 `DevRoutes.tsx` 및 `DevLayout.tsx`에 라우트·메뉴 등록

---

## 6. 모달 컴포넌트 (Modal)

`src/shared/components/modal/`

`WrapperModal` + `template/` 완성형 모달 모음. 폴더 구조, 계층 원칙, 작성 규칙 21가지는 [docs/components/Modal.md](./components/Modal.md) 참고.

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
| `/dev/filter` | 검색폼(필터카드) 레이아웃 4종(키워드만 / 키워드+날짜range / 콤보+키워드+날짜range / 콤보+키워드+기간 프리셋+날짜range) + 규약 체크리스트 |
| `/dev/modal` | Modal 크기·상태·레이아웃 전체 예시 |
| `/dev/button` | Button / LinkButton 12가지 변형·3가지 크기·7가지 상태 예시 |
| `/dev/checkbox` | CheckboxInput 크기·상태·indeterminate·그룹 예시 |
| `/dev/radio` | RadioInput / RadioGroup 크기·상태·그룹(col/row) 예시 |
| `/dev/toggle` | ToggleInput 크기·상태(ON/OFF/disabled/loading) 예시 |
| `/dev/form-alert` | FormAlert 4가지 유형·콘텐츠 조합·닫기 예시 |
| `/dev/table` | TableCard 읽기 전용·행 클릭 선택·인라인 행 편집·로딩·빈 상태 예시 |
| `/dev/tree-menu` | TreeMenu 기본(텍스트 레이블)·labelRender+columns(InputBase 인라인 편집)·연결선 예시 |

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

## 8. 테이블 카드 컴포넌트 (TableCard)

테이블을 감싸는 카드 레이아웃과 공통 테이블 스타일을 제공하는 컴포넌트.
상세 사용법·Props·CSS 클래스 레퍼런스는 [docs/components/TableCard.md](./components/TableCard.md) 참고.

---

## 9. 트리 메뉴 컴포넌트 (TreeMenu)

트리 구조 데이터를 테이블 형태로 표시하고, 펼치기/접기·행 선택·연결선(│ ├ └)을 내장한 컴포넌트.
상세 사용법·Props·CSS 클래스 레퍼런스는 [docs/components/TreeMenu.md](./components/TreeMenu.md) 참고.

---

## 10. 피드백 컴포넌트 (FeedbackState)

`src/shared/components/feedback/FeedbackState.tsx`

로딩·에러·빈 결과·권한 없음 등 다양한 상태를 `variant` 하나로 표현하는 공용 피드백 컴포넌트.

| variant | 기본 문구 |
|---|---|
| `loading` | 불러오는 중입니다. |
| `error` | 불러오는데 실패했습니다. |
| `empty` | 데이터가 없습니다. |
| `unauthorized` | 접근 권한이 없습니다. |

Props·사용 예시·variant 확장 방법은 `index.ts` JSDoc을 참고한다.
테이블의 loading / error / empty 분기는 `@/docs/components/TableCard.md`의 `TableCardContentState` 기준을 우선 참고한다.

---

## 11. 상태 처리와 에러 페이지 (StatusHandling)

401 인증 리다이렉트와 403/404/500 에러 페이지의 공통 처리 기준이다.
상세 사용법·Props·`layout` 선택 기준은 [docs/components/StatusHandling.md](./components/StatusHandling.md) 참고.

---

## 12. 사이드바 컴포넌트 (Sidebar)

라우터·auth에 의존하지 않는 순수 props 기반 사이드바 컴포넌트 모음(`Sidebar` / `SidebarNav` / `SidebarUser`).
`SidebarUser`는 로그아웃 확인 모달 분기를 위해 이탈방지 공용 스토어(`preventLeaveStore`)를 참조한다.
상세 사용법·Props·어드민 어댑터 패턴은 [docs/components/Sidebar.md](./components/Sidebar.md) 참고.

---

## 13. 브레드크럼 컴포넌트 (PageNavigation)

`src/shared/components/navigation/PageNavigation.tsx`

어드민·클라이언트 대쉬보드 공통 브레드크럼 컴포넌트. 두 앱의 셸 레이아웃이 통일되어 있으므로 브레드크럼 JSX와 CSS도 이 컴포넌트 하나로 관리한다.

| prop | 타입 | 설명 |
|---|---|---|
| `depth1` | `string` | 1단계 메뉴명 |
| `depth2` | `string` | 2단계 메뉴명 |
| `current` | `string` | 현재 페이지명 (굵게 표시) |

**사용 규칙**

- 어드민에서 직접 사용하지 말 것 — `AdminMainNavigation`이 라우트 정보 해석 후 위임한다.
- 클라이언트에서 직접 사용하지 말 것 — `ClientPageNavigation`이 null 체크 후 위임한다.
- 새 앱(Consumer 등)에서 브레드크럼이 필요하면 앱 전용 thin wrapper를 만들어 `PageNavigation`에 위임한다. 직접 CSS를 재작성하지 않는다.

---

## 14. 첨부파일 컴포넌트 (FileAttachment)

등록·수정·상세 화면에서 사용하는 첨부파일 입력, 다운로드 목록, 제약 안내 컴포넌트 모음이다.
컴포넌트 사용법은 [docs/components/FileAttachment.md](./components/FileAttachment.md) 참고.

관련 문서:

- [파일 정책](./file-attachment-policy.md)
- [첨부파일 API 계약](./file-attachment-api.md)
- [첨부파일 QA](./file-attachment-qa.md)
