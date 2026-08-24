---
title: Consumer 메뉴 API 작업은 백엔드와 프론트 통합 브랜치를 분리한다
date: 2026-08-24
category: workflow-issues
module: consumer-menu
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "백엔드 기능 브랜치에 프론트 변경이 함께 포함되어 있을 때"
  - "백엔드 API 병합 뒤 코드젠을 기준으로 프론트 통합을 진행할 때"
  - "혼합 커밋을 잃지 않으면서 소유권 경계별로 이력을 교정할 때"
related_components:
  - "git-branching"
  - "consumer-menu-api"
  - "frontend-codegen"
tags:
  - "branch-separation"
  - "backend-only-commit"
  - "frontend-only-commit"
  - "codegen-order"
  - "staging-scope"
---

# Consumer 메뉴 API 작업은 백엔드와 프론트 통합 브랜치를 분리한다

## Context

`feature/consumer-main-detailMenuAPI`의 한 커밋에 백엔드 API와 프론트 옵션 계약 변경이 함께 들어 있었다. 이를 그대로 `dev`에 병합하면 백엔드 커밋의 책임 범위가 흐려지고, 후속 API integration 브랜치에서 같은 프론트 변경이 중복되거나 충돌할 수 있었다.

## Guidance

커밋 경계는 기능 이름이 아니라 소유권과 적용 순서로 나눈다.

1. 혼합 변경은 backup branch와 stash로 먼저 보존한다.
2. 백엔드 브랜치를 혼합 커밋의 부모에서 재구성하고 `qrorder/**`만 복원한다.
3. `git diff --cached --name-only`로 staged path를 확인한 후 백엔드 커밋을 만든다.
4. 백엔드 브랜치를 `dev`에 병합한다.
5. 프론트 integration 브랜치는 병합이 반영된 `dev`에서 새로 만든다.
6. integration 브랜치에는 `frontend/**`만 스테이징하고 코드젠 산출물은 생성 후 별도로 검토한다.

## Why This Matters

백엔드가 이미 공통 조상에 들어간 뒤 프론트 브랜치를 만들면 후속 diff에는 프론트 연동만 남는다. 리뷰, revert, cherry-pick의 책임도 분리된다. 반대로 병합 전 베이스나 혼합 브랜치에서 integration을 시작하면 이미 적용된 백엔드 패치가 다시 나타나 충돌과 중복 적용 가능성이 커진다.

원본 ref를 먼저 보존하는 것도 중요하다. 브랜치 포인터를 교정하더라도 파일 단위로 변경을 다시 분류할 수 있고, 잘못된 재구성에서 즉시 복구할 수 있다.

## When to Apply

- frontend/backend 소유 파일이 한 커밋에 섞였을 때
- API 구현과 소비자 연동의 병합 시점이 다를 때
- 코드젠이 병합된 OpenAPI 계약을 입력으로 사용해야 할 때
- 후속 PR에 이미 병합된 파일이 다시 나타날 때

## Examples

```text
mixed commit ── backup branch/stash로 보존

parent
  └─ backend-only commit
       └─ dev merge
            └─ api-integration
                 └─ frontend-only staged changes
```

## Related

- [Consumer 메뉴 옵션 계약 롤아웃](consumer-menu-option-contract-rollout-2026-08-24.md)
