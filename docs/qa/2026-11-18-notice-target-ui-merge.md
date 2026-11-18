# 공지 대상 선택 / 병합 반영 확인

- 사용자 관찰: Admin 공지 수신 대상에 전체/선택만 표시된다.
- 원본 dev `1118f910`의 NoticeManagePage에는 all/select가 있었고 미병합 작업 `7ea07cdb`에는 all/manager/staff가 있었다.
- dev만의 별도 커밋이 없어 `git merge --ff-only feat/notice-audience-notifications`로 11개 커밋을 충돌 없이 반영했다.
- 사용자 편집 중인 프로젝트 마감 백로그는 미커밋 상태로 보존했다. 원격 push는 하지 않았다.
- 새 작업 위치: `.worktrees/notice-target-ui-qa` / 브랜치 `fix/notice-target-ui-qa`.
- 기존 워크트리는 실행 중인 서버와 개인 설정을 보호하기 위해 삭제하지 않았다. 새 실행 위치로 전환한 뒤 정리할 수 있다.

## 확인 근거

- [선택 UI](../../frontend/src/apps/admin/pages/notice-manage/NoticeManagePage.tsx): 전체/관리자/스태프.
- [저장 매퍼](../../frontend/src/apps/admin/features/notice-manage/api/noticeManageApi.ts): target을 FormData에 직렬화한다.
- 병합된 원본 frontend에서 UI/API 관련 2개 파일/14개 테스트 통과.
- 새 소스 변경 없이 기존 구현을 병합한 작업이므로 검증된 선택값을 중복 수정하지 않았다.

## 다음 확인

1. 실행 중인 프론트를 종료하고 병합된 원본 또는 새 워크트리의 frontend에서 dev:real을 실행한다.
2. 새 워크트리를 처음 실행하면 npm ci를 먼저 수행한다. 다른 폴더의 개발 서버가 같은 포트에서 실행되지 않도록 확인한다.
3. Admin 공지 등록을 다시 열어 세 선택값을 확인한다.
4. 실제 표시가 여전히 다르면 DevTools Network에서 현재 로드된 프론트 출처와 실행 폴더를 확인한다. 이번 테스트는 브라우저의 현재 실행 출처까지 검증한 결과는 아니다.

이후 저장/역할별 노출은 [공지 적용 QA](./2026-11-18-notice-audience-integration.md)의 기존 시나리오를 따른다. DB 컬럼 재적용은 하지 않는다.
