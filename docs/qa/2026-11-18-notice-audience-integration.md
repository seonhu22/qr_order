# 공지 대상별 알림 / 적용과 QA

## 구현과 이유

- 승인: [구현 계획](../plans/2026-11-18-001-notice-audience.md). 수신 대상은 all/manager/staff, 실제 DB 적용은 사용자 담당이다.
- [Admin 저장](../../frontend/src/apps/admin/features/notice-manage/api/noticeManageApi.ts)은 대상 선택을 FormData로 전달한다. 기존 조회를 all로 덮어쓰던 처리를 제거했다.
- [서버 저장](../../qrorder/src/main/java/htms/QROrder/system/service/NoticeService.java)은 잘못된 대상을 부수효과 전에 거부한다. 생성 생략은 all, 수정 생략은 잠근 기존 행의 값을 보존한다.
- [Client 조회](../../qrorder/src/main/java/htms/QROrder/client/service/ClientNoticeService.java)는 세션 역할에서 대상을 도출한다. 프론트 숨김만으로 비수신자에게 공지 본문을 전달하지 않는다.
- 기존 시스템 공지는 전역 공개 범위를 유지한다. 스태프도 공지를 조회하고 문의 답변은 관리자만 조회한다.
- 알림 캐시는 계정/매장/역할별로 구분하며 60초 조회/창 복귀 갱신과 로컬 읽음을 유지한다.
- 스태프 직원호출은 기존 DB 확인 절차를 유지한다. 알림의 모두 읽음은 직원호출 처리 완료가 아니다.

## 사용자가 수행할 순서

1. DB 담당자와 백업/작업 시점을 확인하고 DBeaver가 올바른 DB에 연결됐는지 확인한다.
2. [대상 컬럼 SQL](./scripts/2026-11-18-notice-target-migration.sql)을 **전체 실행**한다. 기본 마지막 문장은 ROLLBACK이므로 변경이 남지 않는다.
3. 결과에서 기존 공지가 all인지, target 컬럼이 NOT NULL/default all인지 확인한다.
4. 정상이라면 마지막 ROLLBACK만 COMMIT으로 바꾸고 **전체 재실행**한다. 실제 적용은 한 번만 한다.
5. 이미 target 컬럼이 있으면 재적용하지 않는다. SQL 말미의 검증 SELECT만 실행해 확인한다. 오류로 트랜잭션이 중단됐으면 먼저 ROLLBACK한다.
6. 컬럼 적용 후 이 브랜치의 최신 백엔드를 실행하고, 다음으로 이 워크트리의 frontend에서 `npm run dev:real`을 실행한다.
7. 아래 수동 QA를 수행한다. 코드 병합은 아직 하지 않았으며 원격 push도 하지 않는다.

워크트리 이동:

```powershell
cd C:\Users\user\Desktop\k-digital\DEV\qr_order\.worktrees\notice-audience-notifications
```

원본 프론트 개발 서버가 3000번을 사용 중이면 기존 서버를 종료한 뒤 이 워크트리에서 실행한다. 실행 중인 다른 서버를 임의로 재사용하지 않는다.

기존 원본의 Git 제외 application-local.properties는 이 워크트리에도 복사해 실행 설정을 준비했다. 값은 출력/커밋하지 않았고 백엔드를 실행하지는 않았다. DB 적용 후 기존 서버를 종료하고 별도 터미널에서 실행한다.

```powershell
# 위 워크트리 루트에서 백엔드 터미널
cd qrorder
.\gradlew.bat bootRun
```

```powershell
# 다른 터미널에서
cd C:\Users\user\Desktop\k-digital\DEV\qr_order\.worktrees\notice-audience-notifications\frontend
npm run dev:real
```

## 수동 QA / 모아서 진행

1. Admin 앱으로 로그인하고 공지 관리에서 `AUTO-QA 전체`, `AUTO-QA 관리자`, `AUTO-QA 스태프`를 각각 해당 대상으로 등록한다. 사용/공개일을 확인한다. 공지는 전역 공개이므로 팀과 테스트 게시 시점을 조정한다.
2. 새로고침 후 대상이 유지되는지 확인한다. DevTools Network의 등록/수정 요청 Form Data에 target이 all/manager/staff인지 확인한다.
3. Client 관리자와 스태프를 일반/시크릿 창에 나눠 로그인한다. 관리자는 전체+관리자 공지, 스태프는 전체+스태프 공지만 보여야 한다.
4. Network의 `GET /api/client/board/notice/search` 응답 자체에도 비수신 공지가 없어야 한다. 화면만 숨겨지는 것은 통과가 아니다.
5. 새 공지 후 전경에서 최대 60초 또는 창을 벗어났다가 복귀해 알림 갱신을 확인한다. 스태프에서 문의 목록 API가 호출되지 않는지 확인한다.
6. 읽음 후 새로고침/다른 탭/계정 전환을 확인한다. 스태프 공지 모두 읽음 후 직원호출 미확인이 임의로 처리되지 않아야 한다.
7. 대상 수정/미사용/예약 공개/삭제 후 조회 범위를 확인한다. 테스트 공지는 확인 후 운영자가 정리한다.

## 배포와 복구 경계

- 순서: DB 적용 → 백엔드 → 프론트. DB 미적용 상태의 새 코드는 target 컬럼 오류가 날 수 있다.
- [복구 SQL](./scripts/2026-11-18-notice-target-rollback.sql)은 참고용이며 자동 실행하지 않는다. 대상 지정 공지가 남아 있으면 컬럼 삭제를 거부한다.
- 구버전 백엔드는 target을 필터링하지 않는다. 대상 지정 공지가 있는 상태에서 구버전으로 돌아가면 컬럼이 남아도 노출 범위가 달라질 수 있으므로 운영자 판단이 선행돼야 한다.
- 공유 DB 적용/실제 서버 수동 QA는 아직 수행하지 않았다. 모의 브라우저와 임시 PostgreSQL 통과를 운영 검증으로 간주하지 않는다.

## 검증 경계

- 백엔드 전체 `.\gradlew.bat test --console=plain`: 61개 파일/319개 테스트/실패 0/오류 0/skip 0. 이 중 실제 임시 PostgreSQL 5개/multipart 2개/격리 OpenAPI 1개/서비스 3개를 확인했다. 임시 DB 프로세스도 종료했다.
- 프론트 `npm run verify`: 스크립트/일반 타입/lint/단위 156개 파일·704개 테스트/E2E 타입/build 통과. 첫 Chromium 전체 실행은 기존 SSE 가상 시간 테스트 1개 실패/25개 통과로 종료 1이었다.
- SSE 테스트는 비동기 인증 요청 이후 재연결 타이머가 생기는 순서를 고정된 시간 진행으로 놓쳤다. 운영 로직과 5회 실패 조건은 유지하고 조건 기반 가상 시간 진행으로 수정했다. 수정 테스트 3회 연속 통과.
- 최초 검사 로그: `frontend/src/test/test-result/verify-2026-11-18-120900-117-14224/summary.md`. 실패 이력을 통과로 덮어쓰지 않는다.
- 수정 후 Chromium 전체 재검증 26개 통과/2.7분, E2E 타입/lint 재검증도 통과했다. 별도 JSON은 같은 로그 폴더의 `browser-recheck.json`이다. 제품 코드는 이 재검증 중 변경하지 않았다.

- DB/Mapper/Service: 임시 PostgreSQL에서 SQL dry-run/적용/기존값/역할 필터/수정 보존과 잠금 경합 검증 완료.
- DTO/전송: 실제 Spring multipart 바인딩과 프론트 HTTP FormData 검사, 격리 서버 OpenAPI export/생성 타입 대조 완료.
- UI/캐시: 역할 전환/스태프 문의 무요청/직원호출 유지/읽음 회귀 검증 완료.
- 실제 공유 DB/배포 후 API와 수동 QA: 사용자 적용 후 확인 대기.

계획 검토 9/10 PASS, 최종 독립 코드 검토 9/10이며 남은 P1/P2 지적은 없다. 검토자는 소스와 백엔드 XML 결과를 확인했으며 테스트를 직접 실행하지 않았다. 최종 검토는 일시적인 사용량 제한 이후 재개해 완료했다. 이는 실제 DB 적용/수동 QA 완료 점수가 아니다.

선택적 UX 후속: 스태프의 모두 읽음은 공지 읽음만 처리하므로 직원호출이 함께 있을 때 문구를 더 명확히 할 여지가 있다. 현재도 직원호출 DB 상태는 바꾸지 않으며 위 QA에서 구분해 확인한다.

## 커밋 읽는 순서

1. `b3217d90`: 컬럼 SQL/복구 조건
2. `d89fda3f`: Admin 저장/DTO/행 잠금과 multipart
3. `2b4e4c4a`: Client 역할 필터/실제 PostgreSQL
4. `1f345011`: 실제 OpenAPI에서 타입 생성
5. `4c0906e9`: Admin 화면과 FormData
6. `ca128da8`: 스태프 공지/역할 캐시/직원호출 유지
7. `2adbe4f0`: 대상별 브라우저 회귀
8. `7c058b59`: 전체 검사에서 발견한 SSE 테스트의 비동기 시간 진행 보완
