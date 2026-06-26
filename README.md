# QR Order

> 작성일: 2026-05-27

QR Order는 매장에서 QR 코드를 통해 주문을 받고, 관리자가 주문 운영과 게시판 정보를 관리할 수 있도록 만든 주문 관리 서비스입니다.

고객은 매장에 비치된 QR 코드를 통해 주문 화면에 접근하고, 관리자는 Admin 화면에서 서비스 운영에 필요한 데이터를 관리합니다.

## 서비스 소개

QR Order는 다음 흐름을 목표로 합니다.

1. 고객이 QR 코드로 주문 화면에 접근
2. 메뉴 확인 후 주문 진행
3. 매장 또는 관리자가 주문 상태와 운영 정보를 관리
4. 공지사항, 문의사항, 첨부파일 등 운영 데이터를 Admin에서 관리

## 구현 현황

| 영역           | 상태                       |
| -------------- | -------------------------- |
| Admin 영역     | 구현 및 QA 진행            |
| 고객/주문 영역 | 서비스 목표 또는 예정 기능 |

## 주요 기능

### Admin 영역

- 관리자 로그인/로그아웃
- 초기 비밀번호 변경
- 관리자 계정 관리
- 메뉴 관리
- 공지사항 관리
- 문의사항 관리
- 첨부파일 업로드/다운로드
- 접속 로그 조회
- 변경 이력 조회

### 고객/주문 영역

아래 기능은 서비스 목표 또는 예정 기능입니다.

- QR 기반 주문 화면 접근
- 메뉴 확인
- 주문 진행
- 주문 상태 확인

## 사용자 유형

| 사용자      | 설명                                                           |
| ----------- | -------------------------------------------------------------- |
| 고객        | QR 코드를 통해 주문 화면에 접근하는 사용자                     |
| 매장/운영자 | 주문과 매장 운영 정보를 관리하는 사용자                        |
| 관리자      | 계정, 메뉴, 게시판, 로그 등 시스템 운영 정보를 관리하는 사용자 |

## 프로젝트 구성

```text
.
├── frontend/   # 사용자 화면과 Admin 화면
├── qrorder/    # 백엔드 API 서버
├── docs/       # 프로젝트 공통 문서
├── scripts/    # 프로젝트 보조 스크립트
├── logs/       # 로컬 실행 로그
└── uploads/    # 로컬 첨부파일 저장 경로
```

## 기술 스택

| 영역     | 기술                                             |
| -------- | ------------------------------------------------ |
| Frontend | React, TypeScript, Vite, TanStack Query, Zustand |
| Backend  | Spring Boot, MyBatis, PostgreSQL                 |
| API      | Swagger/OpenAPI 기반 API 계약                    |

## 실행 전 요구사항

- Node.js: 프론트엔드 설치 및 실행
- Java 17: 백엔드 실행
- PostgreSQL: 백엔드 데이터베이스
- 백엔드 로컬 설정 파일: DB 접속 정보와 파일 저장 경로 설정 필요

## 실행 방법

프론트엔드:

```powershell
cd frontend
npm install
npm run dev
```

백엔드:

```powershell
cd qrorder
.\gradlew.bat bootRun
```

기본 주소:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

실제 백엔드와 연동해 프론트엔드를 실행할 때:

```powershell
cd frontend
npm run dev:real
```

## 참고 문서

- [frontend/README.md](./frontend/README.md): 프론트엔드 실행·개발 가이드
- [frontend/docs/README.md](./frontend/docs/README.md): 프론트엔드 문서 지도
- [qrorder/](./qrorder/): 백엔드 프로젝트
