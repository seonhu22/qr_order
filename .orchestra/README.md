# Orchestra Workspace

마에스트로 주도 하이브리드 에이전트 오케스트레이션 세션 기록.

## 폴더 규약

```
.orchestra/
├── README.md                       # 본 문서
├── schemas/
│   ├── plan.schema.json            # Planner 출력 스키마
│   ├── review.schema.json          # Reviewer 출력 스키마
│   └── postmortem.schema.json      # 세션 종료 요약 스키마
└── sessions/
    └── <YYYYMMDD-HHmm>-<slug>/
        ├── requirement.md          # 사용자 원 요구 (원문)
        ├── routing.md              # 마에스트로 라우팅 판정 (인라인/하이브리드/풀)
        ├── explore.md              # 조사팀 산출 (Explore/investigator)
        ├── plan-v1.json            # Planner 산출 (스키마 준수)
        ├── review-v1.json          # Reviewer 산출 (Codex or Sonnet)
        ├── plan-v2.json            # 재작성 (필요 시)
        ├── review-v2.json
        ├── plan-final.json         # 확정 플랜
        ├── exec-log.jsonl          # 실행 에이전트 호출 로그 (append-only)
        ├── build-log/              # 코드 diff, 테스트 출력 원문
        └── postmortem.md           # 세션 종료 요약 (자동 생성)
```

## 마에스트로 운영 규칙

### 라우팅 (F 규칙)

| 규모                               | 처리                              |
| ---------------------------------- | --------------------------------- |
| 변경 파일 예상 ≤ 2 AND 단일 도메인 | 인라인 (에이전트 미호출)          |
| 3~5 파일 OR 계약 변경              | 하이브리드 (플랜 루프만 에이전트) |
| ≥ 6 파일 OR 다도메인 OR SQL 변경   | 풀 에이전트                       |
| 사용자 "간단히" 언급               | 강제 인라인                       |
| 사용자 "꼼꼼히/검수해서" 언급      | 풀 에이전트                       |

### 플랜 루프 종료 조건 (D 규칙)

```
IF 지적 = 0                     → 통과
IF HIGH ≥ 1                     → 재작성
IF MED ≥ 3                      → 재작성
IF MED 1~2 AND LOW 다수         → 마에스트로 판정
IF LOW only                     → 통과 (과잉 방지)
```

무한 루프 방지:

- 최대 3라운드
- 동일 지적 반복 → 강제 종료 + 사용자 호출
- 심각도 하락 없음 → 강제 종료

### 모델 배정

**Tier A: Codex 사용 가능 (우선)**

| 역할              | 모델                       | 근거                               |
| ----------------- | -------------------------- | ---------------------------------- |
| 마에스트로        | Opus (Claude)              | 판정/조정                          |
| Explore           | Haiku (Claude)             | 저지연 스캔                        |
| Planner           | Sonnet (Claude)            | 생성 균형                          |
| **Plan Reviewer** | **Codex (GPT-5)**          | 논리 검사 강함, 세션 컨텍스트 보존 |
| Builder           | Sonnet (Claude)            | 편집 균형                          |
| Code Reviewer     | Sonnet (cavecrew-reviewer) | diff 리뷰                          |
| Tester            | Sonnet/Haiku               | 도구 실행                          |

**Tier B: Claude 전용 (Codex 미사용 / 로그인 안됨)**

| 역할              | 모델                                 | 근거                                                       |
| ----------------- | ------------------------------------ | ---------------------------------------------------------- |
| 마에스트로        | Opus (Claude)                        | 동일                                                       |
| Explore           | Haiku (Claude)                       | 동일                                                       |
| Planner           | Sonnet-A (Claude, `general-purpose`) | 별도 인스턴스로 생성 역할                                  |
| **Plan Reviewer** | **Opus (Claude, `general-purpose`)** | Planner 와 다른 모델로 확증편향 최소화. 인스턴스 분리 필수 |
| Builder           | Sonnet (Claude)                      | 동일                                                       |
| Code Reviewer     | Sonnet (cavecrew-reviewer)           | 동일                                                       |
| Tester            | Sonnet/Haiku                         | 동일                                                       |

**Tier 선택 규칙**:

- 세션 시작 시 마에스트로가 Codex 가용성 확인: `codex --version` 또는 사용자에게 질의
- 실패/미가용 → Tier B 자동 폴백, `routing.md` 에 `tier: B, reason: codex-unavailable` 기록
- Tier B 사용 시 세션 postmortem 에 `plan-review-degraded: true` 표시하여 이후 세션에서 Codex 전환 유도

## 세션 시작 절차 (마에스트로)

1. `sessions/` 미존재 시 `mkdir -p .orchestra/sessions/<YYYYMMDD-HHmm>-<slug>/` (sessions/ 는 gitignored)
2. `requirement.md` 에 사용자 원문 저장
3. 라우팅 판정 → `routing.md`
4. 조사팀 파견 → 결과를 `explore.md` 에 저장 (경로만 마에스트로가 수신)
5. Planner 파견 → `plan-v1.json`
6. Plan Reviewer 파견 → `review-v1.json` (Tier A: Codex / Tier B: Opus general-purpose)
7. 루프 종료 조건 확인 → 통과 시 `plan-final.json` 복사
8. 실행팀 파견 (병렬 가능 시 병렬) → `exec-log.jsonl` append, `build-log/` 저장
9. 세션 종료 → `postmortem.md` 자동 작성

## 세션 재개

이전 세션 폴더의 `postmortem.md` 를 마에스트로가 Read 하여 컨텍스트 복원.

## 자동 로드를 원할 때(본인이 원할 때만 추가)

CLAUDE.md 에 한 줄 추가 (선택):
프로젝트 에이전트 오케스트라 규칙: `.orchestra/README.md` 참조
