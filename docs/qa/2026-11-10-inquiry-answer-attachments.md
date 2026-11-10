# 문의 답변 첨부파일 연결

## 근거와 변경 이유

- Admin 화면은 파일 선택 상태를 보관했으나 답변 저장 요청에 전달하지 않았다.
- 기존 `QnaService`는 `FileRequest.newItems`를 저장하며 파일 연결 ID를 문의 `sysId`로 지정한다.
- 원문 첨부의 `fileUlid`와 답변 첨부의 `sysId`가 다르므로 별도로 조회한다.
- 신규 파일을 답변 저장 multipart에 함께 넣어 기존 서버 트랜잭션을 사용한다. 별도 파일 저장 API를 연이어 호출하는 방식은 답변/파일의 부분 성공을 만들 수 있어 사용하지 않았다.
- 기존 공용 FormData 생성 함수와 파일 조회/다운로드 API를 재사용한다.

## 동작

- Admin: 기존 답변 파일 다운로드/신규 파일 추가/답변과 함께 저장.
- Client: 원문 파일과 답변 파일을 구분하여 조회/다운로드.
- 저장 성공 후 문의 목록과 답변 파일 캐시를 갱신한다.
- 실패하면 답변/선택 파일을 유지하고, 닫기나 다른 문의로 전환하면 선택 상태를 초기화한다.
- 기존 파일 수/용량을 제외한 남은 한도에서 추가하며 저장 중 편집과 닫기를 막는다.
- 기존 답변 파일 삭제는 제공하지 않는다. 선택한 신규 파일은 저장 전에 제거할 수 있다.

## 계약 경로

| 경계 | 검증 상태 |
|---|---|
| DB 제약 | 변경 없음. 기존 attach_file 사용. 실제 저장 성공은 수동 QA 대기 |
| Mapper/Service | 기존 답변/파일 저장 경로 확인. 문의 ID 강제 연결 테스트 |
| DTO/ModelAttribute | 실제 ServletRequestDataBinder로 flat 답변/indexed 파일 바인딩 검증 |
| OpenAPI/생성 타입 | 서버 계약 변경 없음. generated 직접 수정 없음 |
| 프론트 draft | FileChangeState를 기존 답변 흐름에 전달 |
| 조회 매퍼 | 원문 fileUlid/답변 sysId 분리 조회 테스트 |
| 요청/serializer | fetch 직전 실제 FormData에서 파일/경로/UUID/순서/답변 필드 검증 |
| 통합 테스트 | 화면/Query/API mapper/fetch 경계 및 실패 유지 검증. GET은 MSW 사용 |
| dev:real | 사용자 요청에 따라 일괄 수동 QA 대기 |

## 검증 한계와 후속

- 자동 검증: 사업장 회귀를 포함한 프론트 8개 파일/32개 테스트, backend 문의 계약 2개 파일/3개 테스트, typecheck/lint/build 및 문서 링크 검사 통과.

- jsdom File과 Node fetch multipart 인코더가 호환되지 않아 화면 테스트는 POST fetch 경계의 FormData를 직접 확인한다. 실제 브라우저 multipart bytes 검증을 대체하지 않는다.
- 원문 파일명/확장자는 기존 공용 다운로드 컴포넌트 표시 규칙을 사용한다.
- 실제 DB/파일시스템 저장/다운로드, 실패 시 파일시스템 정리까지 검증한 것은 아니다.
- 기존 FileService 삭제 경로는 sysId만으로 파일 경로를 복구하는지 확인이 필요하다. 삭제 요청은 프론트에서 사전 거부한다.
- 공통 FileMapper 조회에 매장 범위 조건이 없는 기존 보안 한계는 별도 보완 대상이다.

## 일괄 수동 QA

1. 원문 파일이 있는 문의를 열고 원문 다운로드가 유지되는지 확인한다.
2. Admin에서 답변과 신규 파일을 저장하고 POST multipart와 DB `attach_file.link_sys_id = 문의 sysId`를 확인한다.
3. 새로고침/재열기 후 Admin과 Client 양쪽에서 답변 파일 조회/다운로드를 확인한다.
4. 저장 실패 후 답변/선택 파일 유지, 재시도 성공, 닫기 후 선택 초기화를 확인한다.
5. 기존 답변 파일이 있을 때 추가 개수/용량 제한을 확인한다.

QA 대기: [TODO](../../frontend/docs/todo.md#일괄-수동-qa-대기-목록).

근거: [QnaService](../../qrorder/src/main/java/htms/QROrder/system/service/QnaService.java), [API](../../frontend/src/apps/admin/features/inquiry-manage/api/inquiryManageApi.ts), [화면 테스트](../../frontend/src/apps/admin/pages/inquiry-manage/InquiryManagePage.test.tsx), [바인딩 테스트](../../qrorder/src/test/java/htms/QROrder/system/QnaAnswerAttachmentContractTest.java).
