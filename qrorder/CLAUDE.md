# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기본 지침

1. **언어 사용**: 내가 어떤 언어로 질문해도 상관없이, 항상 한글로 답변해줘.
2. **OOP 원칙 준수**: 객체 지향 프로그래밍 원칙을 매우 신경써서 작성해줘. 특히 다음 사항을 준수:
   - 단일 책임 원칙 (SRP): 각 클래스는 하나의 책임만 가져야 함
   - 개방-폐쇄 원칙 (OCP): 확장에는 열려있고 수정에는 닫혀있어야 함
   - 의존성 주입 (DI): 생성자 주입을 우선적으로 사용
   - 레이어 분리: Controller - Service - Repository 계층을 명확히 분리
3. **프론트엔드 스크립트 위치**: HTML 프론트 코드를 작성할 때 스크립트 구문의 위치를 상황에 맞게 배치:
   - 외부 라이브러리 (CDN): `<head>` 태그 내부
   - DOM 조작 스크립트: `</body>` 태그 직전
   - 인라인 스크립트: Thymeleaf 변수 사용 시 `th:inline="javascript"` 속성 사용
4. **프론트엔드 수정**: 프론트엔드 코드(HTML, JavaScript, CSS)는 요청 시 직접 수정해줘.
5. **백엔드 대기**: 백엔드 코드(Java, XML 등)는 사용자가 명시적으로 요청할 때까지 설명도 수정도 하지 마.
6. **신규 디자인 요소 규칙**: 프론트엔드 작업 시 `CLAUDE.md`에 정의되지 않은 새로운 디자인 요소(컴포넌트, 패턴, 스타일 규칙 등)를 추가해야 하는 경우:
   - 먼저 사용자에게 해당 디자인 요소를 추가할 것인지 확인을 요청한다.
   - 사용자가 승인하면 `CLAUDE.md`의 UI 디자인 시스템 섹션을 먼저 업데이트한 후 실제 코드 작업을 진행한다.
   - 기존 `CLAUDE.md`에 이미 정의된 패턴의 단순 적용(반복)은 확인 없이 바로 진행한다.

## 프로젝트 개요

**Initial** - Spring Boot 기반의 Human Task Management System

### 기술 스택
- **Backend**: Spring Boot 4.0.0, Java 17, MyBatis 4.0.0
- **Frontend**: Thymeleaf, Vanilla JavaScript, Bootstrap
- **Database**: PostgreSQL (SSH 터널링을 통한 원격 접속)
- **Build Tool**: Gradle 8.x
- **Additional**: Lombok, JSch (SSH 터널링)

## 빌드 및 실행

```bash
./gradlew bootRun          # 실행
./gradlew build            # 빌드
./gradlew clean build      # 클린 빌드
./gradlew test             # 전체 테스트
```

## 아키텍처 구조

### 레이어드 아키텍처

```
Controller → Service → Repository/Mapper → Database (PostgreSQL)
```

### 패키지 구조

```
htms.Initial/
├── auth/        # 인증/인가 (controller, service, repository, domain, Interceptor, exception)
├── system/      # 시스템 설정 (controller, service, repository, domain, dto)
├── dashboard/   # 대시보드
├── home/        # 홈
├── common/      # 공통 (dto, exception, service)
└── config/      # 설정 (WebConfig, MyBatisConfig, DataSourceConfig, SshTunnelConfig)
```

### MyBatis 매핑

- Interface: `htms.Initial.*.repository.*Mapper.java`
- XML: `src/main/resources/mapper/*/*.xml`
- 카멜케이스 ↔ 스네이크케이스 자동 변환 (`map-underscore-to-camel-case=true`)

### 프론트엔드 구조

**AJAX 기반 SPA 패턴:**
- `dashboard/main.html`이 메인 레이아웃 역할
- 좌측 메뉴 클릭 시 AJAX로 컨텐츠만 교체 (`?ajax=true` 파라미터)
- 페이지 전용 CSS는 `<head>`에 동적으로 추가되며, **CSS 로드 완료 후 HTML 삽입** (FOUC 방지)

**주요 패턴:**
- **마스터-디테일**: 마스터 그리드 선택 → 디테일 그리드 로드. 일괄 저장 방식.
- **인라인 편집 그리드**: 별도 모달 없이 그리드에서 직접 편집. 조회/초기화 시 미저장 데이터 ConfirmModal 표시.

**파일 구조:**
```
templates/
├── home.html / home_init.html
├── dashboard/main.html
├── popup/  (alert, confirm, error, loading, change_password, init_password)
├── system/settings/
│   ├── adminrole/, adminusers/, common/, menu/, menugroup/, passwordrole/, plant/
└── masterdata/
    ├── mastercode/mascommon/
    └── usermanagement/ (dept, menuauth, rank, role, users)

static/css/   bootstrap.min.css, button.css, main.css, popup.css, tree.css, [page].css ...
static/js/    bootstrap.bundle.min.js, popup.js, main.js, header.js, [page].js ...
```

### 인증/인가

- 세션 기반 인증 (`session.loginUser`)
- `LoginCheckInterceptor`로 세션 검증
- 최대 5회 실패 시 계정 잠금

### 공통 응답 구조

```json
{ "success": true, "message": "성공 메시지" }
{ "success": false, "message": "에러 메시지" }
```

구현 클래스: `htms.Initial.common.dto.CommonResponse`

## 코딩 규칙

### 백엔드

- **Domain**: `@Getter`, `@Builder`, `@AllArgsConstructor` (Lombok), Setter 지양
- **Service**: `@Service`, `@Transactional`
- **Controller**: REST → `@RestController`, 뷰 반환 → `@Controller`
- **예외**: `GlobalExceptionHandler`로 일괄 처리. `DuplicateException` → 409, 일반 → 500
- **sys_id 생성**: auto-increment `BIGINT` 사용 금지. 반드시 `String` 타입 + ULID 방식으로 생성.
  ```java
  // build.gradle 의존성
  implementation 'com.github.f4b6a3:ulid-creator:5.2.3'

  // Service INSERT 시 사용
  import com.github.f4b6a3.ulid.UlidCreator;
  entity.setSysId(UlidCreator.getMonotonicUlid().toString());
  ```
  - DB 컬럼: `varchar(36)`, Java 필드: `String sysId`
  - `getMonotonicUlid()` 사용 (순차성 보장 → B-tree 인덱스 성능 최적화)
- **Audit Trail (AT) 호출 패턴**: 두 가지 패턴으로 나뉜다.

  **패턴 1 — 단건 모달** (모달에서 1건씩 처리, 예: plant): refKey를 외부에서 직접 전달.
  ```java
  // 신규
  String ULID = UlidCreator.getMonotonicUlid().toString();
  entity.setSysId(ULID);
  auditService.insertNewAuditTrailData(entity, ULID, menuCd, "table_nm", userId, sysPlantCd);

  // 수정: DB에서 단건 조회 후 비교
  Entity oldData = mapper.getOldData(entity.getSysId());
  auditService.insertUpdateAuditTrailData(oldData, entity, entity.getSysId(), menuCd, "table_nm", userId, sysPlantCd);

  // 삭제
  auditService.insertDeleteAuditTrailData(entities, menuCd, "table_nm", userId, sysPlantCd);
  ```

  **패턴 2 — 다건 인라인 그리드** (그리드에서 여러 행 일괄 저장, 예: common detail): refKey는 domain 내부 sysId에서 자동 추출.
  ```java
  // 신규
  items.forEach(item -> item.setSysId(UlidCreator.getMonotonicUlid().toString()));
  auditService.insertNewAuditTrailData(items, menuCd, "table_nm", userId, sysPlantCd);

  // 수정: DB에서 List 조회 후 sysId 기준 매칭
  List<String> ids = items.stream().map(Entity::getSysId).collect(Collectors.toList());
  List<Entity> oldData = mapper.getOldEntityByIds(ids);
  auditService.insertUpdateAuditTrailData(oldData, items, menuCd, "table_nm", userId, sysPlantCd);

  // 삭제
  auditService.insertDeleteAuditTrailData(items, menuCd, "table_nm", userId, sysPlantCd);
  ```

  **주의**: 도메인에 JOIN으로 가져온 필드(실제 DB 컬럼 아닌 것)가 있으면, AT 내부에서 `columnCommentMap`에 코멘트가 없어 자동으로 `continue` 처리되므로 별도 제거 불필요.

- **삭제 처리 계층별 타입 규칙**: 각 계층마다 역할이 다르므로 타입을 다르게 유지한다.

  | 계층 | 타입 | 이유 |
  |------|------|------|
  | Controller | `List<DomainClass>` | audit 로그에 전체 데이터 필요 |
  | Service | `List<DomainClass>` 수신 → `List<String>` ids 추출 | audit 호출 후 mapper에 ID만 전달 |
  | Mapper Interface | `List<String> ids` | SQL은 ID만 필요 |
  | Mapper XML | `List<String>` foreach | `collection="ids"`, `#{id}` |

  ```java
  // Service 삭제 메서드 패턴
  public void delXxx(List<Xxx> items, String userId, String sysPlantCd, String menuCd) {
      List<String> ids = items.stream().map(Xxx::getSysId).collect(Collectors.toList());
      auditService.insertDeleteAuditTrailData(items, menuCd, "table_nm", userId, sysPlantCd);
      xxxMapper.delXxx(ids, userId);
  }
  ```

### 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스명 | PascalCase | `CommonMasterService` |
| 메서드/변수 | camelCase | `findAll`, `userId` |
| 상수 | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| DB | snake_case | `sys_id`, `plant_cd` |
| URL | kebab-case | `/system/settings/common` |

### 프론트엔드

**절대 금지**: `alert()`, `confirm()`, `prompt()` → 반드시 `window.AlertModal.show()`, `window.ConfirmModal.show()`, `window.ErrorModal.show()` 사용

**fetch 패턴:**
```javascript
fetch(url, options)
.then(function(response) {
    if (response.status === 401 || response.redirected) {
        window.AlertModal.show('세션이 만료되었습니다. 다시 로그인해주세요.', function() {
            window.location.href = '/';
        });
        return null;
    }
    return response.json().then(function(data) {
        return { ok: response.ok, status: response.status, data: data };
    });
})
.then(function(result) {
    if (result === null) return;
    if (result.ok) {
        window.AlertModal.show(result.data.message || '성공', function() {});
    } else {
        window.ErrorModal.show(result.data.message || '오류가 발생했습니다.', function() {});
    }
})
.catch(function(error) {
    if (error instanceof TypeError) {
        window.AlertModal.show('서버에 연결할 수 없습니다. 페이지를 새로고침해주세요.', function() {
            window.location.reload();
        });
    } else {
        window.ErrorModal.show('오류가 발생했습니다.', function() {});
    }
});
```

**다중 삭제 (List<String>):** ID를 문자열 배열로 직접 전송. 객체로 감싸면 역직렬화 오류.

```javascript
// sys_id가 ULID(String)이므로 Number() 변환 없이 문자열 그대로 사용
var ids = checkedBoxes.map(function(cb) { return cb.getAttribute('data-id'); });
body: JSON.stringify(ids)          // ["01ARZ3NDEKTSV4RRFFQ69G5FAV", ...] ← 올바른 예
body: JSON.stringify({ ids: ids }) // ← 오류
```

**GET 파라미터:** 항상 쿼리스트링으로 전달, 빈 값도 파라미터명 포함, `encodeURIComponent()` 인코딩.

```javascript
var url = '/api/search?searchKeyword=' + encodeURIComponent(keyword || '');
```

## JavaScript 코드 구조 규칙

아래 순서로 섹션을 배치한다. 각 섹션은 `/* ========== 섹션명 ========== */`으로 구분.

1. **상수 및 설정** - const 설정값, URL, 전역 변수
2. **DOM 요소** - querySelector, getElementById 등
3. **유틸 함수** - 재사용 헬퍼, 포맷팅, 유효성 검사
4. **API 통신** - fetch 요청/응답 처리
5. **UI/DOM 조작** - 화면 렌더링, 모달 제어
6. **이벤트 핸들러** - click, submit, change 처리
7. **초기화** - DOMContentLoaded, 이벤트 리스너 등록

## 프론트엔드 모듈화 규칙

### 파일 구성

| 파일 유형 | 책임 | 포함 내용 |
|----------|------|----------|
| **메인 HTML** | 구조 | HTML 마크업, 외부 CSS/JS 참조 |
| **Fragment HTML** | 컴포넌트 구조 | HTML 마크업만 (CSS/JS 제거) |
| **CSS 파일** | 스타일 | 메인 + 모든 모달 스타일 통합 |
| **JS 파일** | 로직 | 메인 + 모든 모달 로직 통합 |

**Fragment 주의:** `th:insert`되는 파일은 순수 마크업만. `<html>/<head>/<body>` 포함 금지.

### HTML 공통 설정

```html
<head>
    <meta charset="utf-8">
    <title>RMS</title>
    <link rel="icon" type="image/svg+xml" th:href="@{/images/favicon.svg}">
    <link th:href="@{/css/bootstrap.min.css}" href="/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link th:href="@{/css/button.css}" href="/css/button.css" rel="stylesheet">
    <link th:href="@{/css/[page].css}" href="/css/[page].css" rel="stylesheet">
</head>
<!-- body 직전 -->
    <script th:src="@{/js/bootstrap.bundle.min.js}"></script>
    <script th:src="@{/js/[page].js}"></script>
    <div th:insert="~{popup/confirm}"></div>
    <div th:insert="~{popup/alert}"></div>
    <div th:insert="~{popup/error}"></div>
    <div th:insert="~{popup/loading}"></div>
    <div th:insert="~{[page]/[page]_new}"></div>
    <div th:insert="~{[page]/[page]_update}"></div>
</body>
```

### JavaScript 모듈 패턴

```javascript
// 메인 페이지 (IIFE)
(function() { /* ... */ })();

// 모달 (중복 초기화 방지)
(function() {
    if (window.NewModal) return;
    window.NewModal = {
        show: function() { /* ... */ },
        close: function() { /* ... */ },
        save: function() { /* ... */ }
    };
})();
```

### CSS 선택자 범위 제한

```css
/* 모달 스타일은 ID로 범위 제한 */
#myModal.modal-overlay { ... }
#myModal .modal-container { ... }
```

### 모달 위에서 알림창 띄우기

**원칙: 모달 내부에서 AlertModal/ErrorModal/ConfirmModal 호출 전에 현재 모달을 먼저 닫는다.**

| 상황 | 처리 |
|------|------|
| 필수값 미입력 | 모달 닫기 → 알림창 |
| 서버 저장 성공 | 모달 닫기 → 성공 알림창 → 목록 갱신 |
| 서버 응답 오류 | 모달 닫기 → 에러창 |
| 세션 만료 | 모달 닫기 → 알림창 → `/` 이동 |
| 서버 연결 불가 | 모달 닫기 → 알림창 → 새로고침 |

### 페이지/모달 타이틀 동적 주입

- 사이드바 클릭 → `window.currentMenuNm` 저장
- 페이지 h3: `<h3 class="page-title"></h3>` (main.js가 자동 주입)
- 모달 h5: `<h5 class="modal-title" id="[page]NewModalTitle"></h5>`
- JS `show()` 내에서: `titleEl.textContent = (window.currentMenuNm || '') + ' 신규 등록'`

| 모달 종류 | 형식 |
|----------|------|
| 신규 모달 | `메뉴명 + ' 신규 등록'` |
| 수정 모달 | `메뉴명 + ' 수정'` |

### 미저장 변경 데이터 보호

인라인 편집 그리드에서 조회/초기화 버튼 클릭 시 미저장 데이터가 있으면 ConfirmModal로 확인.

```javascript
function hasPendingChanges() {
    var data = collectGridData();
    return data.newXxxList.length > 0 || data.updateXxxList.length > 0;
}
function handleSearch() {
    if (hasPendingChanges()) {
        window.ConfirmModal.show('수정된 데이터가 존재합니다. 초기화 후 작업하시겠습니까?', function() { fetchSearch(); });
        return;
    }
    fetchSearch();
}
```

참고: `static/js/password_role.js`

### 메뉴 버튼 권한 제어

새 메뉴 페이지 생성 시 반드시 적용. 버튼은 기본 `display:none`으로 시작하고, 권한 API 응답에 따라 Y인 버튼만 표시.

**버튼 id 규칙 (고정값):**

| 버튼 | id |
|------|-----|
| 초기화 | `btnReset` |
| 신규 | `btnNew` |
| 삭제 | `btnDel` |
| 저장 | `btnSave` |
| 인쇄 | `btnPrint` |
| 조회 | `btnSearch` |

**HTML 버튼 배치 (기본 숨김):**
```html
<div class="search-buttons">
    <button type="button" id="btnReset" class="btn btn-secondary btn-custom" style="display:none;" onclick="xxxResetSearch()"><i class="bi bi-arrow-counterclockwise me-1"></i>초기화</button>
    <button type="button" id="btnNew" class="btn btn-success btn-custom" style="display:none;" onclick="xxxCreateNew()"><i class="bi bi-plus-lg me-1"></i>신규</button>
    <button type="button" id="btnDel" class="btn btn-danger btn-custom" style="display:none;" onclick="xxxDeleteSelected()"><i class="bi bi-trash3 me-1"></i>삭제</button>
    <button type="button" id="btnSave" class="btn btn-warning btn-custom" style="display:none;" onclick="window.AlertModal.show('개발 중입니다.')"><i class="bi bi-floppy me-1"></i>저장</button>
    <button type="button" id="btnPrint" class="btn btn-info btn-custom" style="display:none;" onclick="window.AlertModal.show('개발 중입니다.')"><i class="bi bi-printer me-1"></i>인쇄</button>
    <button type="button" id="btnSearch" class="btn btn-primary btn-custom" style="display:none;" onclick="xxxSearch()"><i class="bi bi-search me-1"></i>조회</button>
</div>
```

**JS 권한 적용 함수 (초기화 섹션에 추가):**
```javascript
/* ========== 초기화 ========== */
function applyButtonAuth() {
    var menuCd = window.currentMenuCd;
    if (!menuCd) return;

    fetch('/common/auth/search?menuCd=' + encodeURIComponent(menuCd))
    .then(function(response) {
        if (response.status === 401 || response.redirected) return null;
        return response.json();
    })
    .then(function(auth) {
        if (!auth) return;
        var map = {
            btnReset:  auth.resetYn,
            btnNew:    auth.newYn,
            btnDel:    auth.delYn,
            btnSave:   auth.saveYn,
            btnPrint:  auth.printYn,
            btnSearch: auth.searchYn
        };
        Object.keys(map).forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) btn.style.display = map[id] === 'Y' ? '' : 'none';
        });
    })
    .catch(function() {});
}

applyButtonAuth();
```

**동작 원리:**
- 사이드바 소메뉴 클릭 시 `main.js`가 `window.currentMenuCd`에 해당 메뉴의 menuCd 저장
- 페이지 JS 초기화 시 `applyButtonAuth()`가 `/common/auth/search?menuCd=...` 호출
- `CommonAuth` DTO(resetYn, newYn, delYn, saveYn, printYn, searchYn) 기준으로 Y면 표시, N이면 유지(숨김)
- 기준: `sys_menu_admin_role` 테이블의 소메뉴(3depth) menuCd로 조회

### 메뉴 접근 로그

**컨트롤러:** `LogController` — `@RequestMapping("/log/log")`

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/log/log/menu_open_access_log` | POST | 메뉴 진입 시 호출. `@RequestParam String menuCd` |
| `/log/log/menu_close_access_log` | POST | 메뉴 이탈 시 호출. 파라미터 없음 (세션의 menuUuid 사용) |

**메뉴 오픈 로그** — 각 페이지 JS의 `applyButtonAuth()` 내에서 호출. 오류 시 알림 없이 무시.

```javascript
function logMenuAccess(menuCd) {
    fetch('/log/log/menu_open_access_log?menuCd=' + encodeURIComponent(menuCd), {
        method: 'POST'
    }).catch(function() {});
}

function applyButtonAuth() {
    var menuCd = window.currentMenuCd;
    if (!menuCd) return;

    logMenuAccess(menuCd);

    fetch('/common/auth/search?menuCd=' + encodeURIComponent(menuCd))
    // ...
}
```

**메뉴 클로즈 로그** — `main.js`의 사이드바 클릭 시, 새 메뉴 로드 직전에 호출.

```javascript
// main.js — renderSidebar() 내 link click 이벤트
if (window.currentMenuCd) {
    fetch('/log/log/menu_close_access_log', {
        method: 'POST'
    }).catch(function() {});
}
```

- 권한 조회 fetch와 독립적으로 동작 (응답 대기 없음)
- 서버 강제 종료 시 미처리 로그는 `StartupLogCleanup`이 서버 재기동 시 일괄 처리 (`htms.Initial.log.listener`)

## 로그 확인

```properties
logging.level.htms.Initial.auth.repository=DEBUG
logging.level.htms.Initial.system.repository=DEBUG
```

로그 파일: `logs/sql.log`

---

# UI 디자인 시스템

기준 파일: `static/css/plant.css`, `templates/system/settings/plant/plant.html`

## 디자인 토큰

| 용도 | 색상 |
|------|------|
| 그리드 헤더 배경 | `#f0f2f5` |
| 그리드 헤더 테두리 | `#dde0e4` |
| 그리드 행 구분선 | `#f1f5f9` |
| 행 hover | `#f5f7fa` |
| 행 선택 | `#e0ebff` |
| 검색영역/인풋 배경 | `#f8fafc` |
| 인풋 테두리 | `#e2e8f0` |
| 포커스 색상 | `#0d6efd` |
| 포커스 glow | `rgba(13,110,253,0.1)` |
| 제목 텍스트 | `#1e293b` |
| 본문 텍스트 | `#374151` |
| 보조 텍스트 | `#94a3b8` |
| 읽기전용 배경 | `#f1f5f9` |
| 카드 그림자 | `0 1px 4px rgba(0,0,0,0.06)` |
| 모달 그림자 | `0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)` |
| 카드 반경 | `10px` |
| 모달 반경 | `14px` |
| 인풋/버튼 반경 | `8px` |

## 검색 영역 CSS

```css
.search-section {
    background-color: #ffffff; padding: 18px 24px; border-radius: 10px;
    margin-bottom: 18px; flex-shrink: 0;
    border: 1px solid #e8ecf0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.search-row { display: flex; justify-content: space-between; align-items: center; }
.search-left { display: flex; align-items: center; gap: 12px; }
.search-left label { font-weight: 600; font-size: 14px; color: #374151; min-width: 50px; white-space: nowrap; }
.search-left input {
    width: 280px; height: 38px; padding: 6px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-size: 14px; color: #374151; background-color: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.search-left input:focus { outline: none; border-color: #0d6efd; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
.search-left input::placeholder { color: #b0bec5; }
.search-left input[type="date"] { width: 150px; padding: 6px 10px; }
.search-buttons { display: flex; gap: 8px; }
```

> **날짜 입력:** `input[type="date"]`는 너비를 150px로 좁게 사용. 나머지 스타일은 `.search-left input`과 동일 상속.

## 그리드 CSS

```css
.grid-section {
    flex: 1; display: flex; flex-direction: column; min-height: 0;
    border-radius: 10px; overflow: hidden;
    border: 1px solid #e8ecf0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
#gridBody { flex: 1; display: flex; flex-direction: column; }

.grid-header {
    display: flex; background-color: #f0f2f5;
    border-bottom: 2px solid #dde0e4;
    font-weight: 600; font-size: 13px; color: #374151; letter-spacing: 0.02em;
}
.grid-header > div {
    padding: 12px 14px; border-right: 1px solid #dde0e4; flex: 1; text-align: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.grid-header > div:last-child { border-right: none; }

.grid-row {
    display: flex; border-bottom: 1px solid #f1f5f9;
    background-color: #ffffff; transition: background-color 0.12s;
}
.grid-row:hover { background-color: #f5f7fa; cursor: pointer; }
.grid-row.selected { background-color: #e0ebff; }
.grid-row > div {
    padding: 10px 14px; border-right: 1px solid #f1f5f9;
    flex: 1; text-align: center; font-size: 14px; color: #374151;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.grid-row > div:last-child { border-right: none; }
.grid-row input[type="checkbox"], .grid-header input[type="checkbox"] { cursor: pointer; accent-color: #0d6efd; }

.no-data {
    padding: 60px 40px; text-align: center; color: #a0aec0;
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    background-color: #fafcff; font-size: 14px;
}
```

> **규칙**: 모든 그리드 셀에 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;` 필수. `min-width: 0` 없으면 flex 아이템이 컨텐츠 크기로 늘어나 정렬이 깨짐.

## 모달 CSS

```css
#xxxModal.modal-overlay {
    display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(15,23,42,0.45); z-index: 1000;
    justify-content: center; align-items: center; backdrop-filter: blur(2px);
}
#xxxModal.modal-overlay.show { display: flex; }
#xxxModal .modal-container {
    background-color: white; border-radius: 14px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
    width: 500px; max-width: 92%;
}
#xxxModal .modal-header {
    padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: center;
}
#xxxModal .modal-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
#xxxModal .modal-close-btn {
    background: none; border: none; font-size: 16px; color: #94a3b8;
    cursor: pointer; padding: 4px 6px; line-height: 1; border-radius: 6px;
    display: flex; align-items: center; transition: color 0.15s, background-color 0.15s;
}
#xxxModal .modal-close-btn:hover { color: #1e293b; background-color: #f1f5f9; }
#xxxModal .modal-body { padding: 24px; max-height: 65vh; overflow-y: auto; }
#xxxModal .form-group { margin-bottom: 18px; }
#xxxModal .form-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
#xxxModal .form-label.required::after { content: " *"; color: #ef4444; }
#xxxModal .form-input {
    width: 100%; height: 40px; padding: 8px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-size: 14px; color: #374151; background-color: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
#xxxModal .form-input:focus { outline: none; border-color: #0d6efd; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
#xxxModal .form-input[readonly] { background-color: #f1f5f9; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
#xxxModal .form-input::placeholder { color: #b0bec5; }
#xxxModal .form-select {
    width: 100%; height: 40px; padding: 8px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-size: 14px; color: #374151; background-color: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s;
}
#xxxModal .form-select:focus { outline: none; border-color: #0d6efd; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
#xxxModal .checkbox-wrapper { display: flex; align-items: center; gap: 8px; }
#xxxModal .checkbox-wrapper input[type="checkbox"] { width: 17px; height: 17px; cursor: pointer; accent-color: #0d6efd; }
#xxxModal .checkbox-wrapper label { margin: 0; cursor: pointer; font-size: 14px; color: #374151; user-select: none; }
#xxxModal .modal-footer {
    padding: 14px 24px; border-top: 1px solid #f1f5f9;
    background-color: #f8fafc; border-radius: 0 0 14px 14px;
    display: flex; justify-content: flex-end; gap: 8px;
}
#xxxModal .modal-footer .btn-save {
    background-color: #0d6efd; color: white; border: none;
    border-radius: 8px; padding: 0 18px; height: 38px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: background-color 0.15s, box-shadow 0.15s;
    display: inline-flex; align-items: center; gap: 6px;
}
#xxxModal .modal-footer .btn-save:hover { background-color: #0b5ed7; box-shadow: 0 2px 8px rgba(13,110,253,0.35); }
#xxxModal .modal-footer .btn-cancel {
    background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 0 18px; height: 38px; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: background-color 0.15s;
    display: inline-flex; align-items: center; gap: 6px;
}
#xxxModal .modal-footer .btn-cancel:hover { background-color: #e2e8f0; }
```

## 모달 Fragment HTML 패턴

```html
<div id="[page]NewModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <h5 class="modal-title" id="[page]NewModalTitle"></h5>
            <button type="button" class="modal-close-btn" onclick="[Page]NewModal.close()">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="[page]NewForm"><!-- 필드들 --></form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-custom btn-save" onclick="[Page]NewModal.save()">
                <i class="bi bi-floppy me-1"></i>저장
            </button>
            <button type="button" class="btn-custom btn-cancel" onclick="[Page]NewModal.close()">
                <i class="bi bi-x me-1"></i>닫기
            </button>
        </div>
    </div>
</div>
```

## 버튼 아이콘 규칙 (Bootstrap Icons)

| 버튼 | 클래스 | 아이콘 |
|------|--------|--------|
| 조회 | `btn btn-primary btn-custom` | `bi-search` |
| 신규 | `btn btn-success btn-custom` | `bi-plus-lg` |
| 삭제 | `btn btn-danger btn-custom` | `bi-trash3` |
| 초기화 | `btn btn-secondary btn-custom` | `bi-arrow-counterclockwise` |
| 저장 (모달) | `btn-custom btn-save` | `bi-floppy` |
| 닫기 (모달) | `btn-custom btn-cancel` | `bi-x` |
| X (모달 헤더) | `modal-close-btn` | `bi-x-lg` |
| 행추가 | `btn btn-success btn-custom` | `bi-plus-lg` |
| 행삭제 | `btn btn-danger btn-custom` | `bi-dash-lg` |
| 비밀번호 초기화 | `btn-custom btn-reset-pwd` | `bi-key` |
| 위로 이동 | `btn btn-outline-secondary btn-sm-custom` | `bi-caret-up-fill` |
| 아래로 이동 | `btn btn-outline-secondary btn-sm-custom` | `bi-caret-down-fill` |

### button.css 공통 클래스

```css
.btn-custom { min-width: 80px; height: 38px; }
.btn-sm-custom { min-width: 40px; width: 40px; }
.modal-footer .btn-custom { border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-save { background-color: #0d6efd; color: white; }
.btn-save:hover { background-color: #0b5ed7; }
.btn-cancel { background-color: #6c757d; color: white; }
.btn-cancel:hover { background-color: #5a6268; }
.btn-reset-pwd { background-color: #f8f9fa; color: #2c3e50; }
.btn-reset-pwd:hover { background-color: #e9ecef; }
.modal-close-btn { background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
.modal-close-btn:hover { color: #1e293b; background-color: #f1f5f9; }
```

## 섹션 타이틀 헤더 패턴

기준: `static/css/dept.css`, `static/css/access_log.css`

섹션(좌/우 분할 등)에 제목 배경이 있는 카드형 레이아웃. `.left-section` / `.right-section`이 카드 역할을 하고, 상단에 배경이 있는 `.section-title`이 배치되는 구조.

```css
/* 섹션 카드 래퍼 */
.left-section, .right-section {
    display: flex; flex-direction: column;
    border: 1px solid #e8ecf0; border-radius: 10px; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* 섹션 타이틀 헤더 */
.section-title {
    display: flex; justify-content: space-between; align-items: center;
    height: 60px; flex-shrink: 0;
    background-color: #f8fafc; padding: 0 16px;
    border-bottom: 1px solid #e8ecf0;
}
.section-title-text { font-size: 15px; font-weight: 700; color: #374151; }
.section-title-buttons { display: flex; gap: 8px; }

/* 그리드 본문: 부모 섹션이 border를 가지므로 자체 border 불필요 */
.tree-grid-body, .grid-body {
    flex: 1; overflow-y: auto; background-color: white;
}
```

**HTML 구조:**
```html
<div class="left-section">
    <div class="section-title">
        <span class="section-title-text">부서 목록</span>
        <div class="section-title-buttons">
            <!-- 행추가, 행삭제 등 섹션 전용 버튼 -->
        </div>
    </div>
    <div class="grid-header ...">...</div>
    <div class="grid-body" id="...">...</div>
</div>
```

> **규칙**: 섹션 카드(`overflow: hidden`)가 `border-radius`를 적용하므로 내부 그리드 본문에 별도 `border` 추가 금지. 그리드 헤더의 `border-bottom`만 유지.

## 마스터-디테일 레이아웃 CSS

기준: `static/css/common.css`, `static/css/mas_common.css`

마스터-디테일은 `.grid-card`로 각 그리드를 독립 카드로 감싸고, 내부에 `.section-title` + `.grid-container-master/detail` 순서로 배치한다.

```css
/* 상하 배치 마스터-디테일 카드 래퍼 */
.grid-card {
    flex: 1; display: flex; flex-direction: column;
    border: 1px solid #e8ecf0; border-radius: 10px; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.grid-container-master, .grid-container-detail { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
/* 부모 .grid-card가 border를 가지므로 wrapper 자체 border 불필요 */
.grid-body-wrapper { flex: 1; overflow-y: auto; }
#gridMasterBody, #gridDetailBody { min-height: 100%; display: flex; flex-direction: column; }

/* 디테일 그리드 본문 셀: 세로 중앙 정렬 */
#gridDetailBody .grid-row > div { padding: 10px 14px; display: flex; align-items: center; justify-content: center; }
/* editable-cell은 좌측 정렬 + width:100% 확보 (flex item이 shrink되지 않도록) */
#gridDetailBody .grid-row > div.editable-cell { justify-content: flex-start; padding: 4px 8px; width: 100%; }

.selected-master-info {
    background-color: #eef4ff; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px;
    font-size: 14px; flex-shrink: 0; border: 1px solid #d0e2ff; color: #374151;
}
.selected-master-info strong { color: #0d6efd; }
```

**HTML 구조:**
```html
<!-- 마스터 카드 -->
<div class="grid-card">
    <div class="section-title">
        <span class="section-title-text">공통코드 마스터</span>
    </div>
    <div class="grid-container-master">
        <div class="grid-header">...</div>
        <div class="grid-body-wrapper"><div id="gridMasterBody">...</div></div>
    </div>
</div>
<!-- 디테일 카드 (margin-top으로 두 카드 사이 간격) -->
<div class="grid-card" style="margin-top: 18px;">
    <div class="section-title">
        <span class="section-title-text">공통코드 상세</span>
        <div class="section-title-buttons">
            <button class="btn btn-outline-secondary btn-sm-custom" ...><i class="bi bi-caret-up-fill"></i></button>
            <button class="btn btn-outline-secondary btn-sm-custom" ...><i class="bi bi-caret-down-fill"></i></button>
            <button class="btn btn-success btn-custom" ...>행추가</button>
            <button class="btn btn-danger btn-custom" ...>행삭제</button>
            <button class="btn btn-primary btn-custom" ...>저장</button>
        </div>
    </div>
    <div class="grid-container-detail">
        <div class="grid-header">...</div>
        <div class="grid-body-wrapper"><div id="gridDetailBody">...</div></div>
    </div>
</div>
```

> **규칙**: `.grid-card`가 `overflow: hidden`을 가지므로 `.grid-body-wrapper`에 별도 border 추가 금지. 디테일 그리드 셀에 `display: flex; align-items: center`를 적용해야 순번 등 텍스트 셀이 editable-cell과 세로 정렬이 맞음.

## 그리드 셀 툴팁

`popup.js` 로드 시 자동 생성. `.grid-row > div`, `.grid-header > div`에 hover 시 잘린 텍스트 툴팁 자동 표시. 별도 작업 불필요.

## 트리 그리드 규칙

#### 핵심 원칙

1. 플랫 `<div>` 나열 방식 (`<ul>/<li>/<details>/<summary>` 사용 금지)
2. CSS Grid로 헤더/본문 컬럼 정렬 (동일한 `grid-template-columns` 공유)
3. 레벨별 들여쓰기는 `padding-left`로 처리
4. 접기/펼치기는 JS 상태 관리 + 토글 아이콘(▼/▶)으로 구현
5. `tree.css`: `ul/li/details/summary` 기반 순수 트리 시각화용 (데이터 그리드에는 사용 금지)

참고 파일:
- CSS/JS 기준: `static/css/role.css`, `static/js/role.js`
- 단일 컬럼 트리: `static/css/menu_group.css`, `static/js/menu_group.js`