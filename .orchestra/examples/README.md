# Examples

`example-session/` 는 실제 세션이 어떻게 기록되는지 보여주는 참조용 사본. 실제 세션은 `.orchestra/sessions/<timestamp>-<slug>/` 로 생성됨.

## 포함 파일

| 파일 | 의미 |
|---|---|
| `requirement.md` | 사용자 원 요구 (그대로 저장) |
| `routing.md` | 마에스트로 라우팅 판정 (인라인/하이브리드/풀, Tier A/B) |
| `plan-v1.json` | Planner 초안 (스키마: `../../schemas/plan.schema.json`) |
| `review-v1.json` | Plan Reviewer 판정 (Tier A: Codex) |
| `review-v1-tier-b.json` | Plan Reviewer 판정 (Tier B: Claude-only 폴백) |
| `exec-log.jsonl` | 실행 에이전트 호출 로그 (append-only) |
| `postmortem.md` | 세션 종료 요약 |

## 이식 방법 (다른 컴퓨터)

수동 복사 시 다음 폴더/파일만 옮기면 규칙+예시가 재현됨:

```
.orchestra/
├── README.md
├── schemas/
│   ├── plan.schema.json
│   ├── review.schema.json
│   └── postmortem.schema.json
└── examples/
    ├── README.md
    └── example-session/
        └── (파일 6개)
```

`.orchestra/sessions/` 는 복사 대상 아님 (컴퓨터마다 로컬 축적).

## 실제 세션 재현 조건

- Codex 사용 시: VS Code Codex 확장 또는 CLI 로그인 필요. 로그인 방식 불명 시 마에스트로가 세션 시작 시 사용자에게 질의
- Claude 전용 (Tier B): 아무 준비 불필요. `general-purpose` 서브에이전트를 Planner/Reviewer 로 각각 파견
