# HTMS (Human Task Management System) - 개발자 온보딩 문서

> 이 문서는 신규 입사자가 프로젝트에 바로 착수할 수 있도록 구조, 개발 기준, 테이블 명세서, 기능 명세서, 스토리보드를 통합 정리한 문서입니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [아키텍처 구조](#3-아키텍처-구조)
4. [패키지 및 파일 구조](#4-패키지-및-파일-구조)
5. [데이터베이스 테이블 명세서](#5-데이터베이스-테이블-명세서)
6. [API 명세서 (기능 명세서)](#6-api-명세서-기능-명세서)
7. [프론트엔드 개발 가이드](#7-프론트엔드-개발-가이드)
8. [백엔드 개발 가이드](#8-백엔드-개발-가이드)
9. [화면 흐름 (스토리보드)](#9-화면-흐름-스토리보드)
10. [개발 규칙 요약](#10-개발-규칙-요약)

---

## 1. 프로젝트 개요

**HTMS** - Spring Boot 기반 Human Task Management System

사업장(Plant) 단위로 사용자, 메뉴, 권한, 부서, 직급 등을 관리하는 관리자용 웹 시스템입니다.
도메인 URL 기반으로 다중 사업장(멀티 테넌시)을 지원합니다.

### 기술 스택

| 분류 | 기술 |
|------|------|
| Backend | Spring Boot 4.0.0, Java 17 |
| ORM | MyBatis 4.0.0 |
| Frontend | Thymeleaf, Vanilla JavaScript, Bootstrap 5 |
| Database | PostgreSQL (원격 서버) |
| DB 접속 | SSH 터널링 (JSch) |
| Build | Gradle 8.x |
| 기타 | Lombok, Bootstrap Icons |

---

## 2. 개발 환경 설정

### 2-1. 필수 요구사항

- **Java 17** 이상
- **Gradle 8.x** (프로젝트 내 `./gradlew` 사용)
- **SSH 개인키** - DB 서버 접근용 (팀장에게 발급 요청)
  - Mac: `~/.ssh/id_ed25519`
  - Windows: `C:/Users/{사용자명}/.ssh/id_ed25519`
  - Linux: `~/.ssh/id_ed25519`

### 2-2. application.properties 설정

```properties
# SSH Tunnel (DB 서버 접근)
ssh.enabled=true
ssh.host=sh-server.iptime.org
ssh.port=225
ssh.user=seon
ssh.private-key.windows=C:/Users/22501/.ssh/id_ed25519
ssh.private-key.mac=/Users/seon/.ssh/id_ed25519
ssh.remote.host=localhost
ssh.remote.port=5432
ssh.local.port=15432

# DataSource (SSH 터널을 통해 localhost:15432로 연결)
spring.datasource.url=jdbc:postgresql://localhost:15432/postgres
spring.datasource.username=seon
spring.datasource.password=5131

# MyBatis - 카멜케이스 <-> 스네이크케이스 자동 변환
mybatis.configuration.map-underscore-to-camel-case=true
mybatis.mapper-locations=classpath:mapper/**/*.xml
mybatis.type-aliases-package=htms.Initial.**.domain
```

> **중요:** SSH 개인키 파일은 `.gitignore`에 등록되어 있어 버전관리되지 않습니다. 반드시 팀장에게 개인키 파일을 받아야 합니다.

### 2-3. 빌드 및 실행

```bash
./gradlew bootRun          # 개발 서버 실행
./gradlew build            # 빌드
./gradlew clean build      # 클린 빌드
./gradlew test             # 전체 테스트
java -jar build/libs/Initial-0.0.1-SNAPSHOT.jar  # JAR 실행
```

### 2-4. 로그 확인

```properties
# SQL 로그 활성화 (application.properties)
logging.level.htms.Initial.auth.repository=DEBUG
logging.level.htms.Initial.system.repository=DEBUG
logging.level.htms.Initial.common.repository=DEBUG
logging.level.htms.Initial.masterdata.repository=DEBUG
```

로그 파일 위치: `logs/sql.log` (git ignore 처리됨)

---

## 3. 아키텍처 구조

### 3-1. 레이어드 아키텍처

```
[Client Browser]
       |
       v
[Thymeleaf + Vanilla JS]  ← 프론트엔드 (AJAX 기반 SPA)
       |
       v
[Controller]              ← HTTP 요청/응답, 세션 검증
       |
       v
[Service]                 ← 비즈니스 로직, @Transactional
       |
       v
[Mapper (Repository)]     ← MyBatis XML, SQL 실행
       |
       v
[PostgreSQL]              ← SSH 터널(localhost:15432) 경유
```

### 3-2. 인증/인가 흐름

```
1. 로그인 페이지 접근 (도메인URL로 사업장 판별)
2. ID/PW 입력 → LoginController → LoginService
3. 인증 성공 → session.setAttribute("loginUser", login)
4. 이후 모든 요청 → LoginCheckInterceptor가 세션 검증
5. 세션 없으면 → 401 응답 또는 로그인 페이지 리다이렉트
```

**세션 객체:** `session.getAttribute("loginUser")` → `Login` 도메인 객체
- `sysId`, `userId`, `userName`, `deptCd`, `deptNm`, `sysPlantCd`, `initYn`, `useYn`, `passwordFailCnt`

**로그인 실패 처리:**
- 최대 5회 실패 시 계정 잠금 (`use_yn = 'N'`)
- 실패 횟수는 `sys_user.password_fail_cnt`에 저장

**초기 비밀번호:**
- `init_yn = 'Y'`인 경우 → 로그인 후 비밀번호 변경 강제

### 3-3. SPA 동작 방식

```
1. 최초 접속 → /dashboard → dashboard/main.html 렌더링
2. 좌측 사이드바 메뉴 클릭 → AJAX GET 요청 (?ajax=true)
3. main.js가 응답 HTML을 #mainBody 영역에 동적 삽입
4. 페이지 전용 CSS는 <head>에 동적 추가 (FOUC 방지)
5. window.currentMenuNm에 메뉴명 저장 → 페이지/모달 타이틀 자동 주입
6. window.currentMenuCd에 메뉴 코드 저장 → 각 페이지 applyButtonAuth()에서 버튼 권한 제어에 사용
7. window.currentMenuAuth에 권한 객체 저장 (resetYn/newYn/delYn/saveYn/printYn/searchYn)
```

---

## 4. 패키지 및 파일 구조

### 4-1. Java 패키지 구조

```
src/main/java/htms/Initial/
├── auth/                           # 인증/인가
│   ├── controller/
│   │   ├── LoginController.java    # POST /login, POST /login/initPwd
│   │   └── LogoutController.java   # GET /logout
│   ├── service/
│   │   └── LoginService.java
│   ├── repository/
│   │   └── LoginMapper.java
│   ├── domain/
│   │   └── Login.java              # 세션 사용자 정보
│   ├── dto/
│   │   └── InitPwdRequest.java
│   ├── Interceptor/
│   │   └── LoginCheckInterceptor.java
│   └── exception/
│       └── LoginFailException.java
│
├── system/                         # 시스템 설정 (관리자 전용)
│   ├── controller/
│   │   └── SettingsController.java # 모든 시스템 설정 API
│   ├── service/
│   │   ├── PlantService.java
│   │   ├── AdminUsersService.java
│   │   ├── CommonMasterService.java
│   │   ├── CommonDetailService.java
│   │   ├── MenuService.java
│   │   ├── MenuGroupService.java
│   │   ├── AdminRoleService.java
│   │   └── PasswordRoleService.java
│   ├── repository/
│   │   ├── PlantMapper.java
│   │   ├── AdminUsersMapper.java
│   │   ├── CommonMasterMapper.java
│   │   ├── CommonDetailMapper.java
│   │   ├── MenuMapper.java
│   │   ├── MenuGroupMapper.java
│   │   ├── AdminRoleMapper.java
│   │   └── PasswordRoleMapper.java
│   ├── domain/
│   │   ├── Plant.java
│   │   ├── AdminUsers.java
│   │   ├── CommonMaster.java
│   │   ├── CommonDetail.java
│   │   ├── Menu.java
│   │   ├── MenuGroupDepth1Master.java
│   │   ├── MenuGroupDepth1Detail.java
│   │   ├── MenuGroupDepth23.java
│   │   ├── AdminRole.java
│   │   └── PasswordRole.java
│   └── dto/
│       ├── CommonDetailRequest.java
│       ├── AdminRoleRequest.java
│       ├── MenuGroupDepth1Request.java
│       ├── MenuGroupDepth1OrdNoRequest.java
│       └── MenuGroupDepth23Request.java
│
├── masterdata/                     # 마스터 데이터 (사업장별)
│   ├── controller/
│   │   ├── UserManagementController.java
│   │   └── MasterCodeController.java
│   ├── service/
│   │   ├── DeptService.java
│   │   ├── RankService.java
│   │   ├── UsersService.java
│   │   ├── MenuAuthService.java
│   │   ├── MenuRoleService.java
│   │   ├── MasCommonMasterService.java
│   │   └── MasCommonDetailService.java
│   ├── repository/
│   │   ├── DeptMapper.java
│   │   ├── RankMapper.java
│   │   ├── UsersMapper.java
│   │   ├── MenuAuthMapper.java
│   │   ├── MenuRoleMapper.java
│   │   ├── MasCommonMasterMapper.java
│   │   └── MasCommonDetailMapper.java
│   ├── domain/
│   │   ├── Dept.java
│   │   ├── Rank.java
│   │   ├── Users.java
│   │   ├── MenuAuth.java
│   │   ├── MenuAuthUsers.java
│   │   ├── Role.java
│   │   ├── MasCommonMaster.java
│   │   └── MasCommonDetail.java
│   └── dto/
│       ├── DeptRequest.java
│       ├── RankRequest.java
│       ├── MenuAuthRequest.java
│       ├── RoleRequest.java
│       └── MasCommonDetailRequest.java
│
├── dashboard/
│   └── controller/
│       └── MainController.java     # GET /dashboard
│
├── home/
│   ├── controller/
│   │   └── HomeController.java     # GET /, GET /{domainUrl}
│   ├── service/HomeService.java
│   └── repository/HomeMapper.java
│
├── common/                         # 공통 유틸리티
│   ├── controller/
│   │   ├── CommonComboDataController.java  # 콤보박스 데이터
│   │   ├── CommonDataController.java       # 공통 조회 데이터
│   │   ├── CommonMenuController.java       # 메뉴 트리 데이터
│   │   └── CommonAuthController.java       # GET /common/auth/search (버튼 권한)
│   ├── service/
│   │   ├── CommonComboService.java
│   │   ├── CommonDataService.java
│   │   ├── CommonMenuService.java
│   │   └── CommonAuthService.java
│   ├── repository/
│   │   ├── CommonComboMapper.java
│   │   ├── CommonDataMapper.java
│   │   ├── CommonMenuMapper.java
│   │   └── CommonAuthMapper.java
│   ├── dto/
│   │   ├── CommonResponse.java     # 공통 API 응답
│   │   ├── CommonAuth.java         # 메뉴 버튼 권한 (resetYn/newYn/delYn/saveYn/printYn/searchYn)
│   │   ├── CommonCombo.java
│   │   ├── CommonComboData.java
│   │   ├── CommonDept.java
│   │   ├── CommonDeptUser.java
│   │   ├── CommonPlant.java
│   │   ├── CommonUsers.java
│   │   ├── CommonMenu.java
│   │   └── CommonEmail.java
│   └── exception/
│       ├── GlobalExceptionHandler.java  # 전역 예외 처리
│       ├── DuplicateException.java      # 중복 → 409
│       └── ValidationException.java
│
├── popup/                          # 팝업 기능 (비밀번호 변경 등)
│   ├── controller/
│   │   └── PopupController.java    # GET /popup/change_password, POST /popup/change_password/change
│   ├── service/
│   │   └── PopupPasswordRoleService.java  # 비밀번호 규칙 조회
│   ├── repository/
│   │   └── PopupPasswordRoleMapper.java
│   └── dto/                        # (필요 시)
│
└── config/
    ├── WebConfig.java              # 인터셉터 등록
    ├── MyBatisConfig.java
    ├── DataSourceConfig.java
    ├── SshTunnelConfig.java        # SSH 터널 자동 연결
    └── SecurityConfig.java
```

### 4-2. MyBatis XML Mapper 구조

```
src/main/resources/mapper/
├── auth/
│   └── LoginMapper.xml
├── popup/
│   └── PopupPasswordRoleMapper.xml   # 비밀번호 변경 모달용 규칙 조회
├── system/
│   ├── PlantMapper.xml
│   ├── AdminUsersMapper.xml
│   ├── CommonMasterMapper.xml
│   ├── CommonDetailMapper.xml
│   ├── MenuMapper.xml
│   ├── MenuGroupMapper.xml
│   ├── AdminRoleMapper.xml
│   └── PasswordRoleMapper.xml
├── masterdata/
│   ├── DeptMapper.xml
│   ├── RankMapper.xml
│   ├── UsersMapper.xml
│   ├── MenuAuth.xml
│   ├── MenuRole.xml
│   ├── MasCommonMasterMapper.xml
│   └── MasCommonDetailMapper.xml
├── common/
│   ├── CommonComboMapper.xml
│   ├── CommonDataMapper.xml
│   ├── ComboDataMapper.xml
│   ├── CommonMenuMapper.xml
│   └── CommonAuthMapper.xml          # 메뉴 버튼 권한 조회
└── home/
    └── HomeMapper.xml
```

### 4-3. 프론트엔드 파일 구조

```
src/main/resources/
├── templates/
│   ├── home.html                          # 로그인 페이지
│   ├── home_init.html                     # 초기 비밀번호 설정 페이지
│   ├── layout/
│   │   └── header.html                   # 공통 헤더 Fragment
│   ├── dashboard/
│   │   └── main.html                     # SPA 메인 레이아웃 (사이드바 포함)
│   ├── popup/                             # 공통 팝업 Fragment (CSS/JS 없는 순수 마크업)
│   │   ├── alert.html
│   │   ├── confirm.html
│   │   ├── error.html
│   │   ├── loading.html
│   │   ├── change_password.html
│   │   └── init_password.html
│   ├── system/settings/
│   │   ├── plant/
│   │   │   ├── plant.html                # 사업장 관리 (기준 디자인 파일)
│   │   │   ├── plant_new.html            # 신규 모달 Fragment
│   │   │   └── plant_update.html         # 수정 모달 Fragment
│   │   ├── adminusers/
│   │   │   ├── adminusers.html
│   │   │   ├── adminusers_new.html
│   │   │   ├── adminusers_update.html
│   │   │   └── adminusers_reset_password.html
│   │   ├── common/
│   │   │   ├── common.html               # 공통코드 (마스터-디테일)
│   │   │   ├── common_master_new.html
│   │   │   └── common_master_update.html
│   │   ├── menu/
│   │   │   ├── menu.html
│   │   │   ├── menu_new.html
│   │   │   └── menu_update.html
│   │   ├── menugroup/
│   │   │   ├── menu_group.html           # 3패널 레이아웃
│   │   │   ├── menu_group_new.html
│   │   │   ├── menu_group_update.html
│   │   │   ├── menu_group_detail_new.html
│   │   │   └── menu_group_detail_update.html
│   │   ├── adminrole/
│   │   │   └── adminrole.html            # 관리자 권한 (트리 그리드)
│   │   └── passwordrole/
│   │       └── password_role.html        # 비밀번호 규칙 (인라인 편집 그리드)
│   └── masterdata/
│       ├── mastercode/mascommon/
│       │   ├── mas_common.html
│       │   ├── mas_common_master_new.html
│       │   └── mas_common_master_update.html
│       └── usermanagement/
│           ├── dept/dept.html            # 부서 (트리 그리드)
│           ├── rank/rank.html            # 직급 (인라인 편집)
│           ├── users/
│           │   ├── users.html
│           │   ├── users_new.html
│           │   ├── users_update.html
│           │   └── users_reset_password.html
│           ├── menuauth/menu_auth.html   # 메뉴 권한
│           └── role/role.html            # 역할 관리 (트리 그리드)
│
└── static/
    ├── css/
    │   ├── bootstrap.min.css             # Bootstrap 5 (공통)
    │   ├── button.css                    # 공통 버튼 스타일
    │   ├── main.css                      # 사이드바, 헤더 레이아웃
    │   ├── popup.css                     # 공통 팝업 모달
    │   ├── tree.css                      # 순수 트리 시각화용
    │   ├── home.css
    │   ├── plant.css                     # UI 디자인 기준 파일
    │   ├── adminusers.css
    │   ├── common.css                    # 마스터-디테일 레이아웃 포함
    │   ├── menu.css
    │   ├── menu_group.css
    │   ├── admin_role.css
    │   ├── password_role.css
    │   ├── mas_common.css
    │   ├── dept.css
    │   ├── rank.css
    │   ├── users.css
    │   ├── menu_auth.css
    │   └── role.css
    └── js/
        ├── bootstrap.bundle.min.js       # Bootstrap JS
        ├── popup.js                      # AlertModal, ConfirmModal, ErrorModal, LoadingModal
        ├── main.js                       # SPA 라우팅, 사이드바, AJAX 로딩
        ├── header.js                     # 헤더 드롭다운
        ├── home.js
        ├── plant.js
        ├── adminusers.js
        ├── common.js
        ├── menu.js
        ├── menu_group.js
        ├── admin_role.js
        ├── password_role.js              # 인라인 편집 그리드 기준 파일
        ├── mas_common.js
        ├── dept.js
        ├── rank.js
        ├── users.js
        ├── menu_auth.js
        └── role.js
```

---

## 5. 데이터베이스 테이블 명세서

> 테이블 접두사 규칙: `sys_` = 시스템 공통, `mas_` = 마스터 데이터
> 공통 감사 컬럼: `insert_datetime`, `insert_user_id`, `modify_datetime`, `modify_user_id`
> 논리 삭제: `delete_yn = 'Y'` (물리 삭제 지양)
> **sys_id 정책**: 모든 테이블의 `sys_id`는 `varchar(36)` 타입. auto-increment 사용 금지. Service에서 INSERT 전 `UlidCreator.getMonotonicUlid().toString()`으로 생성. Java 필드 타입은 `String sysId`.

### sys_plant (사업장)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| plant_cd | VARCHAR | 사업장 코드 (고유) |
| plant_nm | VARCHAR | 사업장명 |
| domain_url | VARCHAR | 도메인 URL (로그인 시 사업장 판별용) |
| email_url | VARCHAR | 이메일 도메인 URL |
| email_url_use_yn | CHAR(1) | 이메일 URL 사용 여부 (Y/N) |
| use_yn | CHAR(1) | 사용 여부 (Y/N) |
| delete_yn | CHAR(1) | 삭제 여부 (Y/N) |

> **특이사항:** `plant_cd = 'ADMIN'`은 시스템 관리자 사업장. 비밀번호 규칙 등에서 제외됨.

---

### sys_user (사용자 / 관리자 통합)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| user_id | VARCHAR | 로그인 아이디 (고유) |
| user_name | VARCHAR | 사용자명 |
| dept_cd | VARCHAR | 부서 코드 (`dept_cd = 'ADMIN'`이면 관리자) |
| email_id | VARCHAR | 이메일 아이디 (@앞 부분) |
| rank_cd | VARCHAR | 직급 코드 |
| user_password | VARCHAR | 비밀번호 (현재 평문 저장 - 실운영 시 암호화 필요) |
| password_fail_cnt | INTEGER | 비밀번호 실패 횟수 (5회 초과 시 잠금) |
| init_yn | CHAR(1) | 초기 비밀번호 여부 (Y: 최초 로그인 시 변경 강제) |
| use_yn | CHAR(1) | 사용 여부 (N: 잠금 상태) |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 소속 사업장 코드 (FK → sys_plant.plant_cd) |

> **관리자 구분:** `dept_cd = 'ADMIN'` → 관리자 계정, 그 외 → 일반 사용자

---

### sys_common_master (시스템 공통코드 마스터)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| common_cd | VARCHAR | 공통코드 (고유) |
| common_nm | VARCHAR | 공통코드명 |
| use_yn | CHAR(1) | 사용 여부 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### sys_common_detail (시스템 공통코드 상세)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| link_sys_id | varchar(36) | 마스터 sys_id (FK → sys_common_master.sys_id) |
| detail_cd | VARCHAR | 상세 코드 |
| detail_nm | VARCHAR | 상세 코드명 |
| ord_no | INTEGER | 정렬 순서 |
| use_yn | CHAR(1) | 사용 여부 |
| delete_yn | CHAR(1) | 삭제 여부 |

---

### sys_menu_list (메뉴 목록 - 메뉴 마스터)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| menu_cd | VARCHAR | 메뉴 코드 (고유) |
| menu_nm | VARCHAR | 메뉴명 |
| menu_url | VARCHAR | 메뉴 URL |
| menu_description | VARCHAR | 메뉴 설명 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### sys_depth1_menu_master (메뉴 그룹 1depth 마스터)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| depth1_menu_cd | VARCHAR (PK) | 1depth 메뉴 그룹 코드 |
| depth1_menu_nm | VARCHAR | 1depth 메뉴 그룹명 (사이드바 대분류) |
| ord_no | INTEGER | 정렬 순서 |

---

### sys_depth1_menu_detail (메뉴 그룹 1depth 상세 - 사업장 매핑)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| link_sys_id | VARCHAR | 1depth 메뉴 그룹 코드 (FK) |
| plant_cd | VARCHAR | 사업장 코드 |

---

### sys_depth23_menu (메뉴 그룹 2/3depth)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| menu_cd | VARCHAR | 메뉴 코드 (FK → sys_menu_list.menu_cd) |
| menu_nm | VARCHAR | 메뉴명 |
| parent_menu_cd | VARCHAR | 부모 메뉴 코드 |
| menu_level | INTEGER | 메뉴 레벨 (1: 2depth, 2: 3depth) |
| ord_no | INTEGER | 정렬 순서 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### sys_password_role (비밀번호 규칙)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| link_sys_id | varchar(36) | 사업장 sys_id (FK → sys_plant.sys_id) |
| use_yn | CHAR(1) | 비밀번호 규칙 사용 여부 |
| min_length | INTEGER | 최소 길이 |
| max_length | INTEGER | 최대 길이 |
| min_uppercase | INTEGER | 최소 대문자 수 |
| min_lowercase | INTEGER | 최소 소문자 수 |
| min_number | INTEGER | 최소 숫자 수 |
| min_special | INTEGER | 최소 특수문자 수 |

---

### mas_dept (부서 - 3단계 트리 구조)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| dept_cd | VARCHAR | 부서 코드 |
| dept_nm | VARCHAR | 부서명 |
| parent_id | VARCHAR | 부모 부서 코드 |
| tree_level | INTEGER | 트리 레벨 (1: 최상위, 2: 중간, 3: 최하위) |
| ord_no | INTEGER | 정렬 순서 |
| use_yn | CHAR(1) | 사용 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

> **tree_level 규칙:** 사용자(`sys_user`)는 반드시 `tree_level = 3`인 부서에만 배치됨.

---

### mas_rank (직급)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| rank_cd | VARCHAR | 직급 코드 |
| rank_nm | VARCHAR | 직급명 |
| ord_no | INTEGER | 정렬 순서 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### mas_common_master (마스터 공통코드 마스터)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| common_cd | VARCHAR | 공통코드 |
| common_nm | VARCHAR | 공통코드명 |
| use_yn | CHAR(1) | 사용 여부 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### mas_common_detail (마스터 공통코드 상세)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| link_sys_id | BIGINT | 마스터 sys_id (FK) |
| detail_cd | VARCHAR | 상세 코드 |
| detail_nm | VARCHAR | 상세 코드명 |
| ord_no | INTEGER | 정렬 순서 |
| use_yn | CHAR(1) | 사용 여부 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### mas_menu_auth (메뉴 권한 코드)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| auth_cd | VARCHAR | 권한 코드 |
| auth_nm | VARCHAR | 권한명 |
| delete_yn | CHAR(1) | 삭제 여부 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### mas_menu_auth_list (메뉴 권한 사용자 목록)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| auth_cd | VARCHAR | 권한 코드 (FK → mas_menu_auth.auth_cd) |
| user_id | VARCHAR | 사용자 ID (FK → sys_user.user_id) |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

### mas_menu_user_role (사용자별 메뉴 역할/권한)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| sys_id | varchar(36) (PK) | 시스템 ID (ULID) |
| link_sys_id | varchar(36) | 권한 코드 sys_id (FK → mas_menu_auth.sys_id) |
| menu_cd | VARCHAR | 메뉴 코드 |
| menu_nm | VARCHAR | 메뉴명 |
| parent_menu_cd | VARCHAR | 부모 메뉴 코드 |
| ord_no | INTEGER | 정렬 순서 |
| menu_level | INTEGER | 메뉴 레벨 |
| use_yn | CHAR(1) | 메뉴 접근 권한 |
| reset_yn | CHAR(1) | 초기화 권한 |
| new_yn | CHAR(1) | 신규 등록 권한 |
| del_yn | CHAR(1) | 삭제 권한 |
| save_yn | CHAR(1) | 저장 권한 |
| print_yn | CHAR(1) | 인쇄 권한 |
| search_yn | CHAR(1) | 조회 권한 |
| sys_plant_cd | VARCHAR | 사업장 코드 |

---

## 6. API 명세서 (기능 명세서)

### 6-1. 공통 응답 형식

```json
// 성공
{ "success": true, "message": "저장 완료." }

// 실패
{ "success": false, "message": "오류 메시지" }
```

**HTTP 상태 코드:**
- `200 OK` : 성공
- `409 Conflict` : 중복 데이터 (`DuplicateException`)
- `500 Internal Server Error` : 서버 오류

---

### 6-2. 인증 API

| 메서드 | URL | 설명 | 요청 | 응답 |
|--------|-----|------|------|------|
| POST | `/login` | 로그인 | `userId`, `password` (form) | 세션 생성 후 리다이렉트 |
| POST | `/login/initPwd` | 초기 비밀번호 설정 | `InitPwdRequest` (JSON) | `CommonResponse` |
| GET | `/logout` | 로그아웃 | - | 세션 무효화 후 리다이렉트 |

### 6-2-1. 팝업 API (`/popup`)

| 메서드 | URL | 설명 | 응답 |
|--------|-----|------|------|
| GET | `/popup/change_password` | 현재 사업장의 비밀번호 규칙 조회 | `PasswordRole` JSON |
| POST | `/popup/change_password/change` | 비밀번호 변경 | `CommonResponse` |

---

### 6-3. 시스템 설정 API (`/system/settings`)

#### 사업장 관리 (`/plant`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/plant` | 사업장 관리 페이지 |
| GET | `/system/settings/plant/search?searchCond=` | 사업장 목록 조회 |
| POST | `/system/settings/plant/new` | 사업장 등록 |
| POST | `/system/settings/plant/update` | 사업장 수정 |
| POST | `/system/settings/plant/del` | 사업장 삭제 (Body: `List<String>`) |

#### 관리자 계정 관리 (`/adminusers`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/adminusers` | 관리자 계정 목록 페이지 |
| GET | `/system/settings/adminusers/search?searchKeyword=` | 관리자 목록 조회 |
| POST | `/system/settings/adminusers/new` | 관리자 신규 등록 |
| POST | `/system/settings/adminusers/update` | 관리자 정보 수정 |
| POST | `/system/settings/adminusers/del` | 관리자 삭제 (Body: `List<String>`) |
| POST | `/system/settings/adminusers/reset_password?sysId=&userPassword=` | 비밀번호 초기화 |

#### 시스템 공통코드 관리 (`/common`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/common` | 공통코드 관리 페이지 |
| GET | `/system/settings/common/search?searchCond=` | 마스터 목록 조회 |
| GET | `/system/settings/common/search/{linkSysId}` | 디테일 목록 조회 |
| POST | `/system/settings/common/master/new` | 마스터 신규 등록 |
| POST | `/system/settings/common/master/update` | 마스터 수정 |
| POST | `/system/settings/common/master/del` | 마스터 삭제 |
| POST | `/system/settings/common/detail/save` | 디테일 일괄 저장 |

#### 메뉴 관리 (`/menu`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/menu` | 메뉴 관리 페이지 |
| GET | `/system/settings/menu/search?searchCond=` | 메뉴 목록 조회 |
| POST | `/system/settings/menu/new` | 메뉴 등록 |
| POST | `/system/settings/menu/update` | 메뉴 수정 |
| POST | `/system/settings/menu/del` | 메뉴 삭제 (Body: `List<String>`) |

#### 메뉴 그룹 관리 (`/menugroup`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/menugroup` | 메뉴 그룹 관리 페이지 |
| GET | `/system/settings/menugroup/depth1/search?searchCond=` | 1depth 그룹 목록 조회 |
| GET | `/system/settings/menugroup/depth1/detail/search?linkSysId=` | 1depth 상세(사업장 매핑) 조회 |
| POST | `/system/settings/menugroup/depth1/save` | 1depth 그룹 저장 |
| POST | `/system/settings/menugroup/depth1/del` | 1depth 그룹 삭제 |
| POST | `/system/settings/menugroup/depth1/update` | 1depth 그룹 수정 |
| GET | `/system/settings/menugroup/tree/search?plantCd=` | 2/3depth 메뉴 트리 조회 |
| POST | `/system/settings/menugroup/tree/save` | 2/3depth 메뉴 트리 저장 |

#### 관리자 권한 관리 (`/adminrole`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/adminrole` | 관리자 권한 관리 페이지 |
| GET | `/system/settings/adminrole/search/role_list?sysId=` | 권한 목록 조회 |
| POST | `/system/settings/adminrole/save` | 권한 저장 |

#### 비밀번호 규칙 관리 (`/passwordrole`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/system/settings/passwordrole` | 비밀번호 규칙 관리 페이지 |
| GET | `/system/settings/passwordrole/search?searchKeyword=` | 비밀번호 규칙 목록 조회 |
| POST | `/system/settings/passwordrole/save` | 비밀번호 규칙 일괄 저장 |

---

### 6-4. 마스터 데이터 API

#### 부서 관리 (`/masterdata/usermanagement/dept`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/usermanagement/dept` | 부서 관리 페이지 |
| GET | `/masterdata/usermanagement/dept/search/dept?searchKeyword=` | 부서 트리 조회 |
| GET | `/masterdata/usermanagement/dept/search/users?deptCd=&treeLevel=` | 부서별 사용자 조회 |
| POST | `/masterdata/usermanagement/dept/save` | 부서 일괄 저장 |

#### 직급 관리 (`/masterdata/usermanagement/rank`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/usermanagement/rank` | 직급 관리 페이지 |
| GET | `/masterdata/usermanagement/rank/search?searchKeyword=` | 직급 목록 조회 |
| GET | `/masterdata/usermanagement/rank/search/users?rankCd=` | 직급별 사용자 조회 |
| POST | `/masterdata/usermanagement/rank/save` | 직급 일괄 저장 |

#### 사용자 관리 (`/masterdata/usermanagement/users`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/usermanagement/users` | 사용자 목록 페이지 |
| GET | `/masterdata/usermanagement/users/search?searchKeyword=` | 사용자 목록 조회 |
| POST | `/masterdata/usermanagement/users/new` | 사용자 신규 등록 |
| POST | `/masterdata/usermanagement/users/update` | 사용자 정보 수정 |
| POST | `/masterdata/usermanagement/users/del` | 사용자 삭제 (Body: `List<Users>`) |
| POST | `/masterdata/usermanagement/users/reset_password?sysId=&userPassword=` | 비밀번호 초기화 |

#### 메뉴 권한 관리 (`/masterdata/usermanagement/menuauth`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/usermanagement/menuauth` | 메뉴 권한 관리 페이지 |
| GET | `/masterdata/usermanagement/menuauth/search/auth_code` | 권한 코드 목록 조회 |
| GET | `/masterdata/usermanagement/menuauth/search/auth_list?authCd=` | 권한별 사용자 목록 조회 |
| POST | `/masterdata/usermanagement/menuauth/save` | 메뉴 권한 저장 |

#### 역할 관리 (`/masterdata/usermanagement/role`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/usermanagement/role` | 역할 관리 페이지 |
| GET | `/masterdata/usermanagement/role/search/auth_code` | 권한 코드 목록 조회 |
| GET | `/masterdata/usermanagement/role/search/role_list?sysId=` | 역할 목록 조회 |
| POST | `/masterdata/usermanagement/role/save` | 역할 저장 |

#### 마스터 공통코드 관리 (`/masterdata/mastercode`)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/masterdata/mastercode/mascommon` | 마스터 공통코드 페이지 |
| GET | `/masterdata/mastercode/mascommon/search?searchKeyword=` | 마스터 목록 조회 |
| GET | `/masterdata/mastercode/mascommon/detailSearch?linkSysId=` | 디테일 목록 조회 |
| POST | `/masterdata/mastercode/mascommon/master/new` | 마스터 신규 등록 |
| POST | `/masterdata/mastercode/mascommon/master/update` | 마스터 수정 |
| POST | `/masterdata/mastercode/mascommon/master/del` | 마스터 삭제 |
| POST | `/masterdata/mastercode/mascommon/detail/save` | 디테일 일괄 저장 |

---

### 6-5. 공통 데이터 API

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/common/combodata/dept` | 부서 콤보박스 데이터 |
| GET | `/common/combodata/plant` | 사업장 콤보박스 데이터 |
| GET | `/common/combodata/rank` | 직급 콤보박스 데이터 |
| GET | `/common/commondata/depts` | 부서 목록 |
| GET | `/common/commondata/users` | 사용자 목록 |
| GET | `/common/commondata/deptuser` | 부서+사용자 목록 |
| GET | `/common/commondata/plants` | 사업장 목록 |
| GET | `/common/commondata/email` | 이메일 정보 |
| GET | `/common/menu/1depth` | 1depth 메뉴 그룹 목록 |
| GET | `/common/menu/2depth` | 2depth 메뉴 목록 |
| GET | `/common/menu/3depth` | 3depth 메뉴 목록 |
| GET | `/common/auth/search?menuCd=` | 현재 메뉴의 버튼별 권한 조회 (`CommonAuth` JSON 반환) |

### 6-6. 메뉴 접근 로그 API

| 메서드 | URL | 설명 |
|--------|-----|------|
| POST | `/log/log/menu_open_access_log?menuCd=` | 메뉴 진입 로그 기록 |
| POST | `/log/log/menu_close_access_log` | 메뉴 이탈 로그 기록 (세션의 menuUuid 사용) |

- 각 페이지 JS의 `applyButtonAuth()` 내 `logMenuAccess(menuCd)` 호출로 오픈 로그 기록
- 사이드바에서 새 메뉴 선택 시 `main.js`가 이탈 로그를 자동 기록
- 오류 발생 시 `.catch(function() {})` 처리 (사용자에게 알림 없이 무시)

---

## 7. 프론트엔드 개발 가이드

### 7-1. 기본 규칙

**절대 금지:**
```javascript
alert("메시지");    // X
confirm("메시지");  // X
prompt("메시지");   // X
```

**반드시 모달 팝업 사용:**
```javascript
window.AlertModal.show('메시지', function() { /* 콜백 */ });
window.ConfirmModal.show('메시지', function() { /* 확인 콜백 */ });
window.ErrorModal.show('메시지', function() { /* 콜백 */ });
window.LoadingModal.show();
window.LoadingModal.hide();
```

### 7-2. fetch 표준 패턴

```javascript
fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(function(response) {
    // 세션 만료 처리
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
        window.AlertModal.show(result.data.message || '성공', function() {
            // 후처리 (목록 갱신 등)
        });
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

### 7-3. 다중 삭제 요청

```javascript
// 올바른 방법 - ULID(String) 배열로 직접 전송 (Number() 변환 금지)
var ids = checkedBoxes.map(function(cb) { return cb.getAttribute('data-id'); });
fetch('/api/del', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)  // ["01ARZ3NDEKTSV4RRFFQ69G5FAV", ...]
});

// 잘못된 방법 - 객체로 감싸면 역직렬화 오류
body: JSON.stringify({ ids: ids });  // X
```

### 7-4. GET 파라미터 규칙

```javascript
// 올바른 방법
var url = '/api/search?keyword=' + encodeURIComponent(keyword || '');

// 잘못된 방법 - PathVariable 방식 사용 금지
var url = '/api/search/' + keyword;  // X
```

### 7-5. JS 파일 구조 (섹션 순서)

```javascript
(function() {
    /* ========== 상수 및 설정 ========== */
    var API_URL = '/api/...';

    /* ========== DOM 요소 ========== */
    var searchInput = document.getElementById('searchInput');

    /* ========== 유틸 함수 ========== */
    function formatDate(date) { ... }

    /* ========== API 통신 ========== */
    function fetchSearch() { ... }

    /* ========== UI/DOM 조작 ========== */
    function renderGrid(data) { ... }

    /* ========== 이벤트 핸들러 ========== */
    function handleSearch() { ... }

    /* ========== 초기화 ========== */
    document.addEventListener('DOMContentLoaded', function() {
        fetchSearch();
    });
})();
```

### 7-6. 모달 패턴

```javascript
// 모달 내부에서 알림창 띄우기 전에 반드시 먼저 모달을 닫는다
(function() {
    if (window.MyModal) return;  // 중복 초기화 방지

    window.MyModal = {
        show: function(data) {
            var modal = document.getElementById('myModal');
            modal.classList.add('show');

            // 타이틀 주입
            var titleEl = document.getElementById('myModalTitle');
            if (titleEl) titleEl.textContent = (window.currentMenuNm || '') + ' 수정';
        },
        close: function() {
            document.getElementById('myModal').classList.remove('show');
        },
        save: function() {
            var value = document.getElementById('inputField').value.trim();
            if (!value) {
                window.MyModal.close();  // 먼저 닫기
                window.AlertModal.show('값을 입력하세요.', function() {});
                return;
            }

            fetch('/api/save', { ... })
            .then(...)
            .then(function(result) {
                window.MyModal.close();  // 먼저 닫기
                window.AlertModal.show(result.data.message, function() {
                    // 목록 갱신
                });
            });
        }
    };
})();
```

### 7-7. HTML 페이지 기본 구조

```html
<!DOCTYPE HTML>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="utf-8">
    <title>HTMS</title>
    <link rel="icon" type="image/svg+xml" th:href="@{/images/favicon.svg}">
    <link th:href="@{/css/bootstrap.min.css}" href="/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link th:href="@{/css/button.css}" href="/css/button.css" rel="stylesheet">
    <link th:href="@{/css/[page].css}" href="/css/[page].css" rel="stylesheet">
</head>
<body>
    <h3 class="page-title"></h3>  <!-- main.js가 메뉴명 자동 주입 -->

    <!-- 검색 영역 -->
    <div class="search-section"> ... </div>

    <!-- 그리드 영역 -->
    <div class="grid-section">
        <div class="grid-header"> ... </div>
        <div id="gridBody">
            <div class="no-data">조회된 데이터가 없습니다.</div>
        </div>
    </div>

    <script th:src="@{/js/bootstrap.bundle.min.js}"></script>
    <script th:src="@{/js/[page].js}"></script>
    <div th:insert="~{popup/confirm}"></div>
    <div th:insert="~{popup/alert}"></div>
    <div th:insert="~{popup/error}"></div>
    <div th:insert="~{popup/loading}"></div>
    <div th:insert="~{[page]/[page]_new}"></div>
    <div th:insert="~{[page]/[page]_update}"></div>
</body>
</html>
```

### 7-8. 버튼 규칙

#### 검색영역 표준 버튼 (6개)

모든 페이지의 검색영역에 아래 6개 버튼을 `id` + `style="display:none"` 으로 배치한다.
표시 여부는 `applyButtonAuth()`가 `/common/auth/search` 응답에 따라 제어한다.

| id | 버튼 | 클래스 | 아이콘 |
|----|------|--------|--------|
| `btnReset` | 초기화 | `btn btn-secondary btn-custom` | `bi-arrow-counterclockwise` |
| `btnNew` | 신규 | `btn btn-success btn-custom` | `bi-plus-lg` |
| `btnDel` | 삭제 | `btn btn-danger btn-custom` | `bi-trash3` |
| `btnSave` | 저장 | `btn btn-warning btn-custom` | `bi-floppy` |
| `btnPrint` | 인쇄 | `btn btn-info btn-custom` | `bi-printer` |
| `btnSearch` | 조회 | `btn btn-primary btn-custom` | `bi-search` |

#### 기타 버튼

| 버튼 | 클래스 | 아이콘 |
|------|--------|--------|
| 행추가 | `btn btn-success btn-custom` | `bi-plus-lg` |
| 행삭제 | `btn btn-danger btn-custom` | `bi-dash-lg` |
| 저장 (모달) | `btn-custom btn-save` | `bi-floppy` |
| 닫기 (모달) | `btn-custom btn-cancel` | `bi-x` |
| 비밀번호 초기화 | `btn-custom btn-reset-pwd` | `bi-key` |
| 위로 이동 (순번) | `btn btn-outline-secondary btn-sm-custom` | `bi-caret-up-fill` |
| 아래로 이동 (순번) | `btn btn-outline-secondary btn-sm-custom` | `bi-caret-down-fill` |

### 7-9. 메뉴 버튼 권한 제어 패턴

모든 페이지 JS 파일에 아래 `applyButtonAuth()` 함수를 포함하고 DOMContentLoaded 시점에 호출한다.

```javascript
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
            btnReset: auth.resetYn, btnNew: auth.newYn, btnDel: auth.delYn,
            btnSave: auth.saveYn, btnPrint: auth.printYn, btnSearch: auth.searchYn
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

**핵심 규칙:**
- 버튼은 HTML에서 반드시 `style="display:none"`으로 시작 (깜빡임 방지)
- `window.currentMenuCd`는 main.js가 사이드바 메뉴 클릭 시 자동 저장
- 권한 데이터 출처: `sys_menu_admin_role` 테이블 (관리자 권한 관리 메뉴에서 설정)

---

## 8. 백엔드 개발 가이드

### 8-1. 도메인 작성 규칙

```java
@Getter
@Builder
@AllArgsConstructor
public class Plant {
    private String sysId;  // ULID (varchar(36)) - auto-increment Long 사용 금지
    private String plantCd;
    private String plantNm;
    // Setter 사용 금지 - Builder 또는 생성자 사용
}
```

### 8-2. Service 작성 규칙

```java
@Service
@Transactional
@RequiredArgsConstructor
public class PlantService {
    private final PlantMapper plantMapper;

    public List<Plant> findAll(String searchCond) {
        return plantMapper.findPlantBySearchCond(searchCond);
    }

    public void newPlant(Plant plant, String loginUser) {
        if (plantMapper.checkDuplicate(plant.getPlantCd())) {
            throw new DuplicateException("이미 존재하는 사업장 코드입니다.");
        }
        // sys_id는 ULID로 생성 (auto-increment 사용 금지)
        plant.setSysId(UlidCreator.getMonotonicUlid().toString());
        plantMapper.newPlant(plant, loginUser);
    }
}
```

### 8-3. Controller 작성 규칙

```java
@Slf4j
@Controller              // 뷰 반환 시
@RequiredArgsConstructor
@RequestMapping("/system/settings")
public class SettingsController {

    @GetMapping("/plant")
    public String plant() {
        return "system/settings/plant/plant";  // templates/ 기준 경로
    }

    @GetMapping("/plant/search")
    @ResponseBody          // JSON 반환 시 추가
    public List<Plant> searchPlant(@RequestParam(required = false) String searchCond,
                                    HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        return plantService.findAll(searchCond);
    }

    @PostMapping("/plant/new")
    @ResponseBody
    public ResponseEntity<CommonResponse> newPlant(@RequestBody @Valid Plant plant,
                                                    HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        plantService.newPlant(plant, loginUser.getUserId());
        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .message("등록 완료.")
                .build());
    }
}
```

### 8-4. 예외 처리

```java
// 중복 데이터 예외 (409 반환)
throw new DuplicateException("이미 존재하는 코드입니다.");

// GlobalExceptionHandler가 자동 처리:
// DuplicateException → 409 + { success: false, message: "..." }
// 일반 Exception → 500 + { success: false, message: "오류가 발생했습니다. 관리자에게 문의 바랍니다." }
```

### 8-5. Audit Trail (AT) 호출 패턴

모든 CRUD 메서드에 `AuditService`를 통해 변경 이력을 기록한다. 두 가지 패턴으로 나뉜다.

> **사전 조건:** `menuCd`는 Controller에서 `(String) session.getAttribute("menuCd")`로 추출하여 Service에 전달한다.

**패턴 1 — 단건 모달** (모달에서 1건씩 처리, 예: plant, users): refKey를 외부에서 직접 전달.

```java
// 신규
String ULID = UlidCreator.getMonotonicUlid().toString();
entity.setSysId(ULID);
auditService.insertNewAuditTrailData(entity, ULID, menuCd, "table_nm", userId, sysPlantCd);
mapper.insert(entity, userId, sysPlantCd);

// 수정: DB에서 단건 조회 후 비교
Entity oldData = mapper.getOldData(entity.getSysId());
auditService.insertUpdateAuditTrailData(oldData, entity, entity.getSysId(), menuCd, "table_nm", userId, sysPlantCd);
mapper.update(entity, userId, sysPlantCd);

// 삭제 (Controller에서 List<Entity> 그대로 수신)
auditService.insertDeleteAuditTrailData(entities, menuCd, "table_nm", userId, sysPlantCd);
List<String> ids = entities.stream().map(Entity::getSysId).collect(Collectors.toList());
mapper.delete(ids, userId, sysPlantCd);
```

**패턴 2 — 다건 인라인 그리드** (그리드에서 여러 행 일괄 저장, 예: common_detail, dept): refKey는 domain 내부 sysId에서 자동 추출.

```java
// 신규
items.forEach(item -> item.setSysId(UlidCreator.getMonotonicUlid().toString()));
auditService.insertNewAuditTrailData(items, menuCd, "table_nm", userId, sysPlantCd);
mapper.insert(items, userId, sysPlantCd);

// 수정: ids 추출 → DB 조회 → sysId 기준 매칭 후 비교
List<String> ids = items.stream().map(Entity::getSysId).collect(Collectors.toList());
List<Entity> oldData = mapper.getOldEntityByIds(ids);
auditService.insertUpdateAuditTrailData(oldData, items, menuCd, "table_nm", userId, sysPlantCd);
mapper.update(items, userId, sysPlantCd);

// 삭제: ids로 DB 먼저 조회 후 AT 기록
List<Entity> oldData = mapper.getOldEntityByIds(deleteIds);
auditService.insertDeleteAuditTrailData(oldData, menuCd, "table_nm", userId, sysPlantCd);
mapper.delete(deleteIds, userId, sysPlantCd);
```

> **JOIN 필드 자동 skip:** 도메인에 JOIN으로 가져온 필드(실제 DB 컬럼 아닌 것, 예: `deptNm`, `rankNm`)는 AT 내부에서 `columnCommentMap`에 코멘트가 없어 자동으로 `continue` 처리된다. 별도 제거 불필요.

> **`getOldData` 쿼리 규칙:** JOIN 없이 해당 테이블 순수 컬럼만 SELECT. JOIN 필드가 섞이면 AT 비교 시 오탐 발생.

### 8-6. 삭제 처리 계층별 타입 규칙

각 계층마다 역할이 다르므로 타입을 다르게 유지한다.

| 계층 | 타입 | 이유 |
|------|------|------|
| Controller | `List<DomainClass>` 수신 | AT 로그에 전체 데이터 필요 |
| Service | `List<DomainClass>` → `List<String>` ids 추출 | AT 호출 후 mapper에 ID만 전달 |
| Mapper Interface | `List<String> ids` | SQL은 ID만 필요 |
| Mapper XML | `List<String>` foreach | `collection="ids"`, `#{id}` |

```java
// Service 삭제 메서드 패턴
public void delXxx(List<Xxx> items, String userId, String sysPlantCd, String menuCd) {
    auditService.insertDeleteAuditTrailData(items, menuCd, "table_nm", userId, sysPlantCd);
    List<String> ids = items.stream().map(Xxx::getSysId).collect(Collectors.toList());
    xxxMapper.delXxx(ids, userId, sysPlantCd);
}
```

### 8-7. MyBatis XML 작성 규칙

```xml
<!-- 논리 삭제 패턴 -->
<delete id="delPlant">
    update sys_plant set
        delete_yn = 'Y',
        modify_datetime = now(),
        modify_user_id = #{userId}
    where sys_id in
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</delete>

<!-- 검색 조건 동적 쿼리 -->
<select id="findBySearchCond" resultType="Plant">
    select sys_id, plant_cd, plant_nm
    from sys_plant
    where 1=1
    <if test="searchCond != null and searchCond != ''">
        and (plant_cd like concat('%', #{searchCond}, '%')
            or plant_nm like concat('%', #{searchCond}, '%'))
    </if>
    and delete_yn = 'N'
    order by plant_cd asc
</select>
```

---

## 9. 화면 흐름 (스토리보드)

### 9-1. 로그인 흐름

```
[브라우저 접속] → 도메인 URL 판별
        ├── 알 수 없는 도메인 → 에러 페이지
        └── 알려진 도메인 → 로그인 페이지 (/home.html)
                │
                ├── 로그인 성공 (init_yn = 'N')
                │       └── 대시보드 (/dashboard)
                │
                ├── 로그인 성공 (init_yn = 'Y') → 초기 비밀번호 변경 강제
                │       └── 비밀번호 변경 완료 → 대시보드
                │
                └── 로그인 실패
                        ├── 1~4회: "비밀번호가 일치하지 않습니다. (N회 실패)"
                        └── 5회 이상: "계정이 잠금되었습니다." (use_yn = 'N')
```

### 9-2. 대시보드 / 메뉴 탐색

```
[대시보드] (/dashboard/main.html)
    ├── 좌측 사이드바 (1depth 메뉴 그룹)
    │       └── 클릭 → 2/3depth 서브메뉴 펼치기
    │               └── 3depth 메뉴 클릭 → AJAX로 컨텐츠 영역 교체
    │
    ├── 헤더 우측 사용자 드롭다운
    │       ├── 비밀번호 변경 → 모달 팝업 (사업장 비밀번호 규칙 표시 + 실시간 체크리스트)
    │       └── 로그아웃 → /logout
    │
    └── 컨텐츠 영역 (#mainBody)
            └── AJAX로 각 페이지 HTML 동적 로드
```

### 9-3. 시스템 설정 메뉴 구조

```
시스템 설정
├── 사업장 관리          (/system/settings/plant)
│   - 검색 → 목록 그리드 → 행 클릭 → 수정 모달
│   - 신규 버튼 → 신규 모달 → 저장
│   - 체크박스 선택 → 삭제
│
├── 관리자 계정 관리     (/system/settings/adminusers)
│   - 관리자 목록 (dept_cd = 'ADMIN')
│   - 신규/수정/삭제 + 비밀번호 초기화
│
├── 공통코드 관리        (/system/settings/common)
│   - [마스터-디테일 패턴]
│   - 좌: 마스터 그리드 (조회/신규/수정/삭제)
│   - 우: 디테일 그리드 (마스터 선택 후 로드, 행추가/행삭제/저장)
│
├── 메뉴 관리            (/system/settings/menu)
│   - 메뉴 마스터 목록
│   - 신규/수정/삭제
│
├── 메뉴 그룹 관리       (/system/settings/menugroup)
│   - [3패널 레이아웃]
│   - 좌: 1depth 그룹 목록 (신규/수정/삭제)
│   - 중: 사업장 매핑 정보
│   - 우: 2/3depth 메뉴 트리 (트리 그리드)
│
├── 관리자 권한 관리     (/system/settings/adminrole)
│   - [트리 그리드]
│   - 권한 코드 선택 → 메뉴별 권한 설정
│   - 권한 항목: 접근/초기화/신규/삭제/저장/인쇄/조회
│
└── 비밀번호 규칙 관리   (/system/settings/passwordrole)
    - [인라인 편집 그리드]
    - 사업장별 비밀번호 규칙 설정
    - 최소길이/최대길이/대문자/소문자/숫자/특수문자 수 설정
```

### 9-4. 마스터 데이터 메뉴 구조

```
마스터 데이터
├── 마스터 공통코드      (/masterdata/mastercode/mascommon)
│   - [마스터-디테일 패턴] (사업장별)
│
└── 사용자 관리
    ├── 부서 관리        (/masterdata/usermanagement/dept)
    │   - [트리 그리드] - 3단계 계층 구조
    │   - 행 선택 → 우측에 해당 부서 소속 사용자 표시
    │   - 행추가/행삭제 + 일괄 저장
    │
    ├── 직급 관리        (/masterdata/usermanagement/rank)
    │   - [인라인 편집 그리드]
    │   - 행 선택 → 우측에 해당 직급 소속 사용자 표시
    │
    ├── 사용자 관리      (/masterdata/usermanagement/users)
    │   - 사업장 소속 사용자 목록
    │   - 신규/수정/삭제 + 비밀번호 초기화
    │
    ├── 메뉴 권한 관리   (/masterdata/usermanagement/menuauth)
    │   - 권한 코드 그리드 (신규/수정/삭제)
    │   - 권한 코드 선택 → 해당 권한 소속 사용자 표시
    │   - 사용자 추가/삭제
    │
    └── 역할 관리        (/masterdata/usermanagement/role)
        - [트리 그리드]
        - 권한 코드 선택 → 해당 권한의 메뉴별 역할 설정
```

### 9-5. 주요 UI 패턴

#### 섹션 타이틀 카드 패턴
```
모든 그리드 영역은 카드형 래퍼 안에 배치.
- 단일 그리드: .grid-section { border/radius/shadow } + .section-title (60px 높이 배경 헤더)
- 다중 패널 (좌/우 분할): .left-section / .right-section / .center-section에 동일 카드 스타일
- 마스터-디테일 (상하 배치): .grid-card로 마스터/디테일 각각 독립 카드로 감싸기
내부 그리드 본문(.grid-body, .grid-body-wrapper)은 별도 border 없음 (부모 카드가 담당).
```

#### 마스터-디테일 패턴
```
[마스터 카드 (.grid-card)]
  ├── .section-title (제목 + 버튼 없음)
  └── .grid-container-master → .grid-body-wrapper → #gridMasterBody
         ↓ 행 클릭
[디테일 카드 (.grid-card, margin-top: 18px)]
  ├── .section-title (제목 + 순번이동/행추가/행삭제/저장 버튼)
  └── .grid-container-detail → .grid-body-wrapper → #gridDetailBody
- 디테일 셀: display:flex + align-items:center (세로 중앙 정렬)
- editable-cell: justify-content:flex-start + width:100% (입력 필드 전체 너비)
```

#### 인라인 편집 그리드 패턴
```
- 별도 모달 없이 그리드 셀 직접 편집
- 조회 시 원본 스냅샷(originalDataMap) 저장
- 저장 시: 신규 행 → newList, 변경된 기존 행 → updateList
- 조회/초기화 클릭 시 미저장 데이터 있으면 ConfirmModal 확인
```

#### 트리 그리드 패턴
```
- 플랫 <div> 나열 방식 (ul/li 사용 금지)
- CSS Grid로 헤더/본문 컬럼 정렬
- 레벨별 padding-left로 들여쓰기
- ▼/▶ 토글 아이콘으로 접기/펼치기
```

---

## 10. 개발 규칙 요약

### 10-1. 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스명 | PascalCase | `PlantService`, `CommonResponse` |
| 메서드/변수 | camelCase | `findAll`, `sysPlantCd` |
| 상수 | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| DB 컬럼 | snake_case | `sys_id`, `plant_cd`, `use_yn` |
| URL | kebab-case | `/system/settings/password-role` |
| JS 전역 객체 | PascalCase | `window.PlantNewModal` |

### 10-2. 핵심 규칙 체크리스트

#### 백엔드
- [ ] Domain 클래스에 `@Getter`, `@Builder`, `@AllArgsConstructor` 사용, Setter 금지
- [ ] Service에 `@Transactional` 적용
- [ ] 중복 데이터는 `DuplicateException` throw
- [ ] 논리 삭제 (`delete_yn = 'Y'`) 사용, 물리 삭제 지양
- [ ] 컬럼명 자동 변환: DB `snake_case` ↔ Java `camelCase`
- [ ] `sys_id` 필드 타입은 `String` (Long 금지), INSERT 전 `UlidCreator.getMonotonicUlid().toString()` 호출
- [ ] Audit Trail 적용: 신규/수정/삭제 시 `AuditService` 호출 (8-5 패턴 참고)
- [ ] `menuCd`는 Controller에서 `session.getAttribute("menuCd")`로 추출 후 Service에 전달
- [ ] `getOldData` 쿼리는 JOIN 없이 해당 테이블 순수 컬럼만 SELECT
- [ ] 삭제: Controller는 `List<DomainClass>` 수신, Service에서 AT 후 ids 추출하여 Mapper 호출

#### 프론트엔드
- [ ] `alert()`, `confirm()`, `prompt()` 절대 금지
- [ ] fetch 패턴에 세션 만료 처리 필수 (`401`, `redirected` 체크)
- [ ] 모달 내 알림창 호출 전 반드시 모달 먼저 닫기
- [ ] 다중 삭제: `JSON.stringify(ids)` (배열 직접 전송)
- [ ] GET 파라미터: 쿼리스트링 방식 + `encodeURIComponent()` 인코딩
- [ ] Fragment 파일: `<html>/<head>/<body>` 태그 포함 금지 (순수 마크업만)
- [ ] 모달 JS: `if (window.MyModal) return;` 중복 초기화 방지

### 10-3. 새 페이지 개발 순서

1. **DB 테이블 확인/생성**
2. **Domain 클래스 작성** (`htms.Initial.{module}.domain`)
3. **Mapper Interface 작성** (`htms.Initial.{module}.repository`)
4. **XML Mapper 작성** (`src/main/resources/mapper/{module}`)
5. **Service 클래스 작성** (`htms.Initial.{module}.service`)
6. **Controller 메서드 추가** (`htms.Initial.{module}.controller`)
7. **HTML 페이지 작성** (`templates/{module}/{page}.html`)
8. **Fragment 모달 작성** (`templates/{module}/{page}_new.html`, `{page}_update.html`)
9. **CSS 파일 작성** (`static/css/{page}.css`) - `plant.css` 기준 디자인 적용
10. **JS 파일 작성** (`static/js/{page}.js`) - 7개 섹션 구조 준수
11. **버튼 권한 적용** - HTML에 6개 버튼 `style="display:none"` 배치, JS에 `applyButtonAuth()` 함수 추가 (7-9 참고)
12. **사이드바 메뉴 등록** (메뉴 그룹 관리에서 DB 등록)

### 10-4. 디자인 토큰 (주요 색상)

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
| 제목 텍스트 | `#1e293b` |
| 본문 텍스트 | `#374151` |
| 보조 텍스트 | `#94a3b8` |
| 읽기전용 배경 | `#f1f5f9` |
| 카드 그림자 | `0 1px 4px rgba(0,0,0,0.06)` |
| 모달 그림자 | `0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)` |
| 카드 반경 | `10px` |
| 모달 반경 | `14px` |
| 인풋/버튼 반경 | `8px` |

---

*이 문서는 프로젝트 코드베이스를 기준으로 작성되었습니다. 코드 변경 시 함께 업데이트해주세요.*
