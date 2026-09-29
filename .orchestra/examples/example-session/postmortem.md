# Postmortem — staff-call-master 마이그레이션

- session_id: `20260929-1920-staff-call-master`
- started_at: 2026-09-29T19:20:00Z
- ended_at: 2026-09-29T19:36:00Z
- requirement_summary: staff_call 마스터 테이블 도입 + 백엔드/프론트 정합화
- routing: full
- plan_rounds: 2 (v1 REWRITE → v2 PASS)
- final_verdict: PASS

## Agents Used

| agent | model | invocations | claude_tokens | external_tokens |
|---|---|---|---|---|
| explore | claude-haiku-4-5 | 1 | ~4500 | - |
| planner | claude-sonnet-4-6 | 2 | ~6200 | - |
| plan-reviewer | codex-gpt-5 | 2 | ~2800 | ~48000 (구독형, 결제 없음) |
| cavecrew-builder | claude-sonnet-4-6 | 6 | ~12000 | - |
| tester | claude-haiku-4-5 | 2 | ~1200 | - |
| cavecrew-reviewer | claude-sonnet-4-6 | 1 | ~5400 | - |
| maestro | claude-opus-4-7 | - | ~9500 | - |

## Outcome

- PRs: [#130](https://github.com/seonhu22/qr_order/pull/130), [#131](https://github.com/seonhu22/qr_order/pull/131), [#132](https://github.com/seonhu22/qr_order/pull/132)
- tests_passed: true
- notes: 프론트 UI 렌더링 변경 없음 (디자인 미제공). 타입/테스트만 선반영

## Lessons

- Codex Plan Reviewer 2라운드로 종료 → 최대 3라운드 상한 충분
- Builder 파견 시 커밋 메시지 템플릿을 브리핑에 포함해야 사용자 학습 요구 반영됨
- 프론트 worktree 에서 node_modules junction 필요 (npm install 권한 차단). 절차서에 추가할 것
- Tier B 폴백 시 F2 같은 스코프 관련 지적을 강하게 잡음 → 학습 목적 세션에선 오히려 유용
