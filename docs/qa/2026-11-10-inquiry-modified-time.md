# 문의 수정일 연결

## 근거와 구현 이유

- 기존 `brd_qna.modify_datetime`은 Client 문의 수정과 Admin 답변 저장에서 갱신된다.
- Admin 조회 SQL/DTO에 이 값이 없고 화면 매퍼가 `updatedAt: '-'`로 고정되어 수정일이 표시되지 않았다.
- 기존 컬럼 조회와 응답 연결만 추가했다. 새 컬럼이나 저장 정책은 추가하지 않았다.
- 수정일의 의미는 문의 본문 또는 답변의 최종 수정 시각이다. 답변 시각은 기존 별도 필드로 유지한다.
- 날짜 표시는 기존 `formatDateTimeForDisplay`를 재사용한다. 값이 없으면 현재 시각이나 등록일을 대신 쓰지 않고 `-`로 표시한다.
- Client 응답 DTO와 감사용 `getOldData`는 이번 표시 기능의 경로가 아니므로 변경하지 않았다.

## 계약 경로와 검증 상태

| 경계 | 확인 결과 |
|---|---|
| DB | 기존 컬럼 사용. 실제 DB 값 검증은 일괄 QA 대기 |
| Mapper | getQna에 modify_datetime 조회 추가. 기존 매장/삭제 조건 유지 테스트 |
| DTO/JSON | LocalDateTime/ISO 직렬화와 미수정 null 테스트 |
| OpenAPI | DTO schema 변환 테스트, 저장 명세 동기화. 실행 서버 /v3/api-docs 비교는 QA 대기 |
| 생성 타입 | npm run generate 사용. string/null 응답 타입 생성 |
| 응답 매퍼/화면 | 공용 포맷 함수 사용, null/생략 시 - 표시 테스트 |
| 요청/serializer | 읽기 필드만 추가하므로 변경 없음 |
| 저장 성공 경로 | 기존 쓰기 SQL은 변경 없음. 실제 문의 수정/답변 저장 후 조회는 QA 대기 |
| dev:real | 사용자 요청에 따라 일괄 QA 대기 |

## 검증 기록

- 수정 전 backend SQL 조회 계약 1건과 frontend 수정일 표시 1건이 실패함을 확인했다.
- 프론트 관련 2개 파일/9개 테스트 통과.
- 백엔드 QnaReadContractTest 2개, typecheck/lint 및 diff 검사 통과.
- 독립 검토 에이전트가 계약 경로와 Client API 범위 제외를 검토했다.

## 일괄 수동 QA

1. 최신 백엔드/프론트로 실행한다.
2. 서버 /v3/api-docs에서 QnaResponse.modifyDatetime의 date-time/null 계약을 확인한다.
3. 신규 문의의 modify_datetime이 null이면 Admin 수정일이 -인지 확인한다.
4. Client에서 문의를 수정하고 Admin 재조회 시 응답/화면/DB 수정일이 일치하는지 확인한다.
5. Admin에서 답변 저장 후 재조회하여 수정일과 답변이 저장되는지 확인한다.

대기 목록: [일괄 수동 QA TODO](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록).

소스: [DTO](../../qrorder/src/main/java/htms/QROrder/system/dto/QnaResponse.java), [SQL](../../qrorder/src/main/resources/mapper/system/QnaMapper.xml), [응답 매퍼](../../frontend/src/apps/admin/features/inquiry-manage/api/inquiryManageApi.ts).
