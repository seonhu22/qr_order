# Client 관리자 알림

## 현재 동작

- 사용자 결정(2026-11-10): 서버 읽음 저장 API가 준비되기 전까지 브라우저별 로컬 읽음 상태를 사용한다.
- `staffRole=01`인 로그인 사용자만 공지/문의 API를 조회한다.
- 공지는 `GET /api/client/board/notice/search`, 답변 완료 문의는 `GET /api/client/board/qna/search`를 사용한다.
- 고유 ID와 기준 시각이 있는 공지, `answerYn=Y`이고 답변 시각이 있는 문의를 최신순으로 표시한다.
- 진입 시 조회하고 전경에서 60초마다, 창 복귀 시 다시 조회한다. Query key는 계정/매장별로 구분한다.
- 조회 실패를 “알림 없음”과 구분해 안내하며 기존 캐시가 있으면 함께 유지한다.
- 스태프의 직원호출 알림은 기존 API와 동작을 유지한다.

## 로컬 읽음 계약

- localStorage key: `qr-order:manager-notification-read:` + JSON `[userId, sysPlantCd]`.
- 읽음 식별자: JSON `[kind, sysId, timestamp]`. 공지/문의에 같은 ID가 있어도 구분한다.
- 저장값은 읽음 식별자만 포함하며 최근 1,000개로 제한한다. 제목과 본문은 저장하지 않는다.
- 같은 브라우저의 탭은 storage 이벤트로 읽음을 갱신한다.
- 다른 브라우저/시크릿 환경/기기에는 공유되지 않는다. 브라우저 데이터를 지우면 읽음 기록도 사라진다.
- 저장소가 차단되거나 JSON이 손상되어도 화면을 중단하지 않는다. 저장 실패 시 현재 화면의 읽음만 유지한다.
- 문의 답변 시각이 바뀌면 새 알림으로 취급한다. 공지는 현재 API에 수정 시각이 없어 동일 ID/공개일의 본문 수정은 새 알림으로 식별할 수 없다.
- 1,000개를 넘겨 오래된 읽음 ID가 제거되면 해당 알림이 다시 미확인으로 보일 수 있다.

## 구현 근거

- mock 목록을 실제 Board API로 교체했다. 직원호출 읽음 API는 다른 도메인이라 재사용하지 않았다.
- 계정/매장을 저장 키와 Query key에 포함하여 공유 브라우저의 사용자 전환에서 알림 상태가 섞이지 않도록 했다.
- 공통코드/DB/백엔드 DTO/OpenAPI/생성 타입은 변경하지 않았다.
- 향후 서버 읽음 API가 추가되면 저장 어댑터와 mutation을 교체하고 동일 정책을 다시 검증한다.

## 검증과 남은 QA

- 관련 4개 파일/16개 테스트: API 매핑/저장소 예외/계정·매장 격리/재열기 복원/탭 동기화/권한별 노출/조회 오류 검증 통과.
- 실제 서버의 공지 대상 범위와 문의 접근 권한은 기존 API 계약을 따른다. 이 작업에서 서버 권한을 강화한 것은 아니다.
- dev:real 수동 QA: 실제 공지/답변 확인 → 개별/전체 읽음 → 새로고침 복원 → 다른 계정/매장 격리 → 다른 탭 갱신을 확인한다.
- 수동 QA 대기 목록: [TODO](../todo.md#일괄-수동-qa-대기-목록).

소스: [실제 API](../../src/apps/client/features/notification-center/api/managerNotificationApi.ts), [읽음 저장](../../src/apps/client/features/notification-center/utils/notificationReadStorage.ts), [조회 훅](../../src/apps/client/features/notification-center/hooks/useManagerNotificationCenter.ts).
