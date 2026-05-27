# 메뉴 접근 로그 운영 가이드

## 1. 목적

관리자 메뉴 페이지에 진입할 때마다 백엔드의 메뉴 접근 로그 API를 호출한다.

```text
POST /api/log/log/menu_open_access_log?menuCd={menuCd}
```

이 호출은 단순 통계용 로그만이 아니라, 백엔드 세션에 현재 메뉴 코드(`menuCd`)를 남기는 역할도 한다. 일부 저장 API는 audit 처리에서 세션의 `menuCd`를 사용할 수 있으므로, 관리자 메뉴 화면은 접근 로그가 먼저 남아야 한다.

---

## 2. 현재 구현 구조

메뉴 접근 로그는 개별 페이지가 아니라 관리자 공통 레이아웃에서 처리한다.

```text
AdminLayout
→ useAdminMenuOpenAccessLog
→ getAdminMenuKeyByPath
→ useMenuOpenAccessLog
→ menu_open_access_log API 호출
→ AdminMenuAccessLogContext에 완료 상태 제공
```

관련 파일:

| 파일 | 역할 |
|---|---|
| `src/apps/admin/layout/AdminLayout.tsx` | 관리자 화면 공통 진입점 |
| `src/apps/admin/contexts/AdminMenuAccessLogContext.tsx` | 현재 메뉴 접근 로그 완료 상태 제공 |
| `src/apps/admin/hooks/useAdminMenuOpenAccessLog.ts` | 현재 URL을 읽고 접근 로그 훅 호출 |
| `src/apps/admin/features/sidebar/utils/getAdminMenuKeyByPath.ts` | pathname을 사이드바 메뉴 key로 변환 |
| `src/shared/hooks/useMenuOpenAccessLog.ts` | 실제 접근 로그 API 호출 |

---

## 3. menuCd 결정 규칙

`menuCd`는 사이드바 메뉴 설정의 `key`를 사용한다.

예:

```ts
{ key: 'coupon', label: '쿠폰 관리', path: '/admin/payment/coupon' }
```

위 메뉴에 진입하면 아래 요청이 호출된다.

```text
POST /api/log/log/menu_open_access_log?menuCd=coupon
```

메뉴 설정 위치:

| 구분 | 파일 |
|---|---|
| 시스템/결제/이력 메뉴 | `src/apps/admin/features/sidebar/config/systemSidebarMenu.ts` |
| 게시판 메뉴 | `src/apps/admin/features/sidebar/config/boardSidebarMenu.ts` |

---

## 4. 신규 메뉴 추가 시 체크리스트

신규 관리자 메뉴를 추가할 때는 아래를 확인한다.

1. 사이드바 설정에 `key`, `label`, `path`를 추가한다.
2. 실제 라우트 path가 사이드바의 `path`와 일치하는지 확인한다.
3. 메뉴 진입 후 Network 탭에서 아래 요청이 1회 호출되는지 확인한다.

```text
POST /api/log/log/menu_open_access_log?menuCd={sidebar key}
```

4. 저장 API가 audit를 사용하는 화면이라면, 저장 요청 전에 접근 로그 요청이 먼저 성공했는지 확인한다.

저장 버튼은 관리자 메뉴 접근 로그 완료 상태를 함께 확인한다.

```tsx
const menuAccessLog = useAdminMenuAccessLogStatus();

<Button disabled={!menuAccessLog.isReady || saveMutation.isPending}>
  저장
</Button>
```

저장 실행 함수에서도 한 번 더 막는다.

```ts
if (!menuAccessLog.isReady) {
  throw new Error('메뉴 접근 로그 완료 후 저장할 수 있습니다.');
}
```

---

## 5. 중복 호출 방지 규칙

`useMenuOpenAccessLog`는 같은 `menuCd`에 대해 리렌더링만으로 다시 호출하지 않는다.

다만 다른 메뉴로 이동해 `menuCd`가 바뀌면 새 메뉴에 대해 다시 호출한다.

```text
coupon → coupon       호출 안 함
coupon → adminUser    호출함
```

개발 모드에서는 React 렌더링이나 query 재실행 때문에 Network 요청이 더 많이 보일 수 있다. 하지만 이 훅은 같은 `menuCd`에 대한 단순 중복 호출을 방지하도록 작성되어 있다.

---

## 6. 주의사항

- 개별 페이지 훅에서 `useMenuOpenAccessLog('...')`를 직접 호출하지 않는다.
- 관리자 메뉴 접근 로그는 `AdminLayout`에서 중앙 처리한다.
- 사이드바 설정에 없는 path는 `menuCd`를 찾을 수 없으므로 로그가 남지 않는다.
- 메뉴 key를 바꾸면 백엔드 audit/session에서 사용하는 `menuCd`도 바뀌므로 임의 변경하지 않는다.
- 상세 화면처럼 `/admin/system/plant/new` 형태의 하위 경로는 가장 가까운 상위 메뉴 path와 매칭된다.
- 첨부파일처럼 백엔드 세션의 현재 메뉴 정보가 필요한 저장 API는 `useAdminMenuAccessLogStatus().isReady`가 `true`일 때만 실행한다.

---

## 7. 테스트

관련 테스트:

| 테스트 | 검증 내용 |
|---|---|
| `useMenuOpenAccessLog.test.tsx` | 같은 메뉴 중복 호출 방지, 메뉴 변경 시 재호출 |
| `getAdminMenuKeyByPath.test.ts` | URL path에서 올바른 menu key 추출 |

실행:

```powershell
npm test -- useMenuOpenAccessLog getAdminMenuKeyByPath
```
