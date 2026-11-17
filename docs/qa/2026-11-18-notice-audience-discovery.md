# 공지 대상별 알림 / 연결 누락 조사

기준일: 2026-11-18 / 브랜치 `feat/notice-audience-notifications` / 기준 코드 `1118f910`.
사용자 요구: 관리자/스태프/모두 대상의 공지 알림 연동. 수동 QA는 다음 일정에 모아서 진행한다.

후속 승인: 대상 컬럼 추가 SQL 준비는 허용하고 실제 DB 적용은 사용자가 직접 수행한다. 구현 기준은 [승인 범위와 작업 계획](../plans/2026-11-18-001-notice-audience.md)을 따른다. 아래는 승인 전 조사 이력이다.

## 코드에서 확인한 사실

1. [Admin 공지 화면](../../frontend/src/apps/admin/pages/notice-manage/NoticeManagePage.tsx)의 수신 대상 옵션은 현재 전체/선택이다. 관리자/스태프/모두의 세 가지 계약과 다르다.
2. [공지 API 어댑터](../../frontend/src/apps/admin/features/notice-manage/api/noticeManageApi.ts)는 조회 결과의 target을 항상 all로 만든다. 저장 payload/FormData에는 수신 대상이 없다.
3. [NoticeRequest](../../qrorder/src/main/java/htms/QROrder/system/dto/NoticeRequest.java)와 [Admin Mapper](../../qrorder/src/main/resources/mapper/system/NoticeMapper.xml)는 대상을 저장/조회하지 않는다.
4. [Client 공지 Mapper](../../qrorder/src/main/resources/mapper/client/ClientNoticeMapper.xml)는 공개일/사용/삭제 조건만 적용하며 수신 역할 조건은 없다.
5. [ClientNoticeService](../../qrorder/src/main/java/htms/QROrder/client/service/ClientNoticeService.java)는 검색어만 받아 Mapper에 전달한다. 요청자 역할을 받지 않는다.
6. [ClientLayout](../../frontend/src/apps/client/layout/ClientLayout.tsx)은 관리자에게 공지/문의 알림을, 스태프에게 직원호출만 표시한다.
7. [알림 훅](../../frontend/src/apps/client/features/notification-center/hooks/useManagerNotificationCenter.ts)은 전경 60초 조회/창 복귀 갱신을 사용한다. 읽음은 계정/매장별 로컬 저장이다.

현재 실행 DB의 전체 DDL을 직접 조회하지 않았으므로, DB에 대상 컬럼 자체가 없다고 단정하지 않는다. 확인한 것은 코드의 대상 저장/조회 경로 누락이다.

## 작업 경계

- 기존 스키마 변경 금지 조건을 유지한다. 대상 컬럼 존재 여부 또는 추가 권한 확인이 선행되어야 한다.
- 현재 필드만으로 대상별 지속 저장과 서버 필터를 구현했다고 주장하지 않는다.
- 프론트에서만 숨기는 방식이나 새로고침하면 사라지는 로컬 대상 저장을 추가하지 않는다.
- 기존 공지/문의/직원호출 알림과 읽음 상태를 임의로 삭제하거나 정책을 바꾸지 않는다.
- 새로운 저장 필드/기본값/기존 데이터 처리/백엔드 수정 범위는 사용자 확인 후 확정한다. 이 문서는 미승인 계약을 확정하지 않는다.

## 후속 구현 시 확인할 경계

DB 저장 필드/제약 → Admin 저장 Mapper → 요청/응답 DTO → OpenAPI/생성 타입 → Admin draft/조회 매퍼 → multipart 직렬화 → Client 서버 역할 필터 → 알림 조회/읽음/헤더 → 통합 테스트 → dev:real 수동 QA.

- 현재 확인: 위 연결 누락과 기존 동작을 코드로 조사했다.
- 아직 미검증: 실제 DB 대상 필드, 대상별 POST 저장, 역할별 GET 차단, 새 공지 반영, 읽음과 직원호출 회귀.
- 명령: 관련 파일에 한정한 rg/Get-Content 조사와 `git diff --check`.
- 제품 동작은 변경하지 않았으므로 테스트를 새로 실행하지 않았다. 기존 테스트 통과를 이번 기능 완료 근거로 사용하지 않는다.

## 수동 QA 대기 / 계약 확정과 구현 후

- 세 대상별 공지 등록/수정 후 새로고침에서 대상 유지.
- 관리자/스태프 별도 세션에서 대상 공지만 목록/API/알림으로 조회되는지 확인.
- 예약 공개/미사용/삭제 공지 노출 회귀 확인.
- 읽음 복원/계정 전환/조회 오류와 스태프 직원호출 알림 회귀 확인.

관련 요구사항: [후속 작업 목록](../plans/2026-11-17-followup-work-backlog.md), 기존 정책: [관리자 알림](../../frontend/docs/page/manager-notifications.md).
