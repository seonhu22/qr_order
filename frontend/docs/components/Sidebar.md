# Sidebar 컴포넌트 가이드

> 라우터·스토어·auth에 의존하지 않는 순수 props 기반 사이드바 컴포넌트 모음.  
> 어드민·사용자 등 앱별 사이드바를 동일한 UI 기반 위에 구성할 수 있다.

## 목차

- [1. 파일 구조](#1-파일-구조)
- [2. 구성 컴포넌트](#2-구성-컴포넌트)
- [3. CSS 변수 (`--sb-*`)](#3-css-변수---sb-)
- [4. Props](#4-props)
- [5. 사용 패턴 — 어드민 어댑터](#5-사용-패턴--어드민-어댑터)
- [6. 어드민 전용 유지 파일](#6-어드민-전용-유지-파일)

---

## 1. 파일 구조

```text
shared/components/sidebar/
  index.ts          ← 외부 공개 API (배럴 파일)
  types.ts          ← SidebarNavItem, SidebarNavGroup, SidebarNavDepth1 타입
  Sidebar.tsx       ← 컨테이너 (--sb-* CSS 변수 제공 + flex 셸)
  Sidebar.css
  SidebarNav.tsx    ← 3계층 nav (props 기반, 라우터·스토어 비의존)
  SidebarNav.css
  SidebarUser.tsx   ← 사용자 푸터 (props 기반, auth 비의존, 로그아웃 모달 내장)
  SidebarUser.css
```

### import

```ts
import { Sidebar, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import type { SidebarNavDepth1 } from '@/shared/components/sidebar';

// 금지 — 내부 파일 직접 참조
import { SidebarNav } from '@/shared/components/sidebar/SidebarNav';
```

---

## 2. 구성 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `Sidebar` | `--sb-*` CSS 변수 컨텍스트 제공 + flex 셸 컨테이너. `children`으로 내부를 자유롭게 구성 |
| `SidebarNav` | 3계층(Depth1 > Depth2 > Depth3) 트리 내비게이션. 메뉴 데이터·펼침 상태를 props로 수신 |
| `SidebarUser` | 아바타·이름·역할·로그아웃 버튼 푸터. 로그아웃 확인 모달을 내부에서 처리하고 `onLogout` 콜백 호출 |

---

## 3. CSS 변수 (`--sb-*`)

`Sidebar` 컨테이너(`.sidebar`)에 선언되며 자식 컴포넌트가 상속해 사용한다.  
재정의가 필요하면 `.sidebar`를 감싸는 요소에서 오버라이드한다.

| 변수 | 기본값 | 용도 |
|---|---|---|
| `--sb-text-active` | `#ffffff` | 활성/선택 텍스트 |
| `--sb-text-normal` | `#cad5e2` | 기본 텍스트 |
| `--sb-text-muted` | `rgba(144,161,185,0.9)` | 비활성 텍스트 |
| `--sb-text-dim` | `#62748e` | 보조 텍스트 (역할·아이콘) |
| `--sb-overlay` | `rgba(255,255,255,0.1)` | hover·active 배경 |
| `--sb-border` | `rgba(255,255,255,0.1)` | 구분선 |

---

## 4. Props

### SidebarProps

```ts
type SidebarProps = {
  children: ReactNode;
  className?: string;   // 루트 div에 추가할 CSS 클래스
};
```

---

### SidebarNavProps

```ts
type SidebarNavProps = {
  menus: readonly SidebarNavDepth1[];    // 3계층 메뉴 데이터
  expandedDepth1Key: string | null;      // 펼쳐진 1depth 키
  expandedDepth2Key: string | null;      // 펼쳐진 2depth 키
  currentPathname: string;              // 현재 URL 경로 (active 상태 판별)
  onToggleDepth1: (key: string, hasChildren?: boolean) => void;
  onToggleDepth2: (key: string, hasChildren?: boolean) => void;
  onNavigate: (path: string) => void;   // 페이지 이동 콜백
  showDepth1?: boolean;                 // depth1 버튼 표시 여부. 기본 true
};
```

#### `showDepth1={false}` — depth1 생략 모드

헤더 등 다른 영역에서 depth1을 이미 표시하는 경우 사이드바의 중복 표시를 제거한다.

- `false` 지정 시 모든 depth1 items의 groups를 병합해 최상위 항목으로 직접 렌더한다.
- 그룹 헤더 버튼은 depth1 버튼 스타일을 재사용해 시각적 일관성을 유지한다.
- `expandedDepth1Key` / `onToggleDepth1`은 사용되지 않는다.

---

### SidebarNavDepth1 (메뉴 데이터 타입)

```ts
type SidebarNavItem = {
  key: string;
  label: string;
  path: string;
};

type SidebarNavGroup = {
  key: string;
  label: string;
  items: readonly SidebarNavItem[];
};

type SidebarNavDepth1 = {
  key: string;
  label: string;
  groups: readonly SidebarNavGroup[];
};
```

`as const`로 선언한 메뉴 상수와 호환된다.

---

### SidebarUserProps

```ts
type SidebarUserProps = {
  userName: string;        // 표시할 사용자 이름
  userRole: string;        // 표시할 사용자 역할
  onLogout: () => void;    // 로그아웃 확인 후 호출되는 콜백
  isLoggingOut?: boolean;  // 로그아웃 요청 진행 중 여부 (버튼 로딩 상태)
};
```

로그아웃 확인 모달(`WrapperModal`)은 `SidebarUser` 내부에서 관리한다.  
확인 버튼 클릭 시 `onLogout`을 호출하고, 이후 처리(navigate 등)는 호출부가 담당한다.

---

## 5. 사용 패턴 — 어드민 어댑터

`apps/admin/features/sidebar/components/AdminSidebar.tsx`는 공용 컴포넌트에
어드민 전용 데이터·상태(스토어, auth, 라우터)를 주입하는 **어댑터** 역할만 담당한다.

```tsx
export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const expandedDepth1Key = useAdminLayoutStore((s) => s.expandedDepth1Key);
  const expandedDepth2Key = useAdminLayoutStore((s) => s.expandedDepth2Key);
  const setExpandedMenu   = useAdminLayoutStore((s) => s.setExpandedMenu);
  const toggleDepth1      = useAdminLayoutStore((s) => s.toggleDepth1);
  const toggleDepth2      = useAdminLayoutStore((s) => s.toggleDepth2);

  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login'),
      onError:   () => navigate('/admin/login'),
    },
  });

  // URL 변경 시 해당 메뉴 자동 펼침
  useEffect(() => {
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname);
    if (!depth1Key) return;
    setExpandedMenu(depth1Key, depth2Key);
  }, [location.pathname, setExpandedMenu]);

  const userName = user?.userName ?? user?.userId ?? '관리자';
  const userRole = user?.role ?? 'ADMIN';

  return (
    <Sidebar>
      <AdminSidebarHeader />          {/* 어드민 전용 (AdminBrand + 닫기 버튼) */}
      <SidebarNav
        menus={ADMIN_SIDEBAR_MENU}
        showDepth1={false}            {/* 헤더에 1depth가 있으므로 사이드바에서 생략 */}
        expandedDepth1Key={expandedDepth1Key}
        expandedDepth2Key={expandedDepth2Key}
        currentPathname={location.pathname}
        onToggleDepth1={toggleDepth1}
        onToggleDepth2={toggleDepth2}
        onNavigate={navigate}
      />
      <SidebarUser
        userName={userName}
        userRole={userRole}
        onLogout={() => logoutMutate()}
        isLoggingOut={isPending}
      />
    </Sidebar>
  );
}
```

---

## 6. 어드민 전용 유지 파일

공용 컴포넌트로 이동하지 않고 `apps/admin/features/sidebar/`에 남아 있는 파일들.

| 파일 | 역할 |
|---|---|
| `AdminSidebar.tsx` | 공용 컴포넌트 어댑터 — 스토어·auth·라우터 주입 |
| `AdminSidebarHeader.tsx` | AdminBrand + 닫기 버튼 (어드민 전용 브랜딩) |
| `styles/AdminSidebarHeader.css` | 헤더 전용 스타일 (AdminBrand 크기 오버라이드 포함) |
| `config/adminSidebarMenu.ts` | 어드민 메뉴 데이터 (`as const`) |
| `utils/findExpandedMenuKeys.ts` | URL → depth1/depth2 키 매핑 유틸 |
| `stores/adminLayoutStore.ts` | 사이드바 열림·depth1/2 펼침 상태 Zustand 스토어 |
