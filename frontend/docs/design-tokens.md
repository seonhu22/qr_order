# 디자인 토큰 시스템

## 목차

- [1. 개요](#1-개요)
- [2. 파일 구조](#2-파일-구조)
- [3. 사용 원칙](#3-사용-원칙)
- [4. 토큰 계층 요약](#4-토큰-계층-요약)
- [5. 단위 규칙 (rem)](#5-단위-규칙-rem)
- [6. 컬러 토큰 참고](#6-컬러-토큰-참고)
- [7. 타이포그래피 토큰 참고](#7-타이포그래피-토큰-참고)

---

## 1. 개요

본 프로젝트는 Tailwind CSS를 사용하지 않는다.
대신 CSS 커스텀 프로퍼티(변수) 기반의 2단계 토큰 구조를 채택하였다.

---

## 2. 파일 구조

```text
shared/styles/
  primitive-tokens.css   ← 원시값 정의 (색상 팔레트, 간격, 폰트 등)
  semantic-tokens.css    ← 용도 기반 이름 (컴포넌트에서 이 파일만 참조)
  global.css             ← 앱 진입점 (reset + fonts + tokens 통합 import)
  reset.css              ← 브라우저 기본 스타일 초기화
  fonts.css              ← 폰트 선언
```

---

## 3. 사용 원칙

컴포넌트에서 CSS 변수를 사용할 때는 반드시 `semantic-tokens.css`의 변수만 참조한다.
`primitive-tokens.css`의 변수는 컴포넌트에서 직접 사용하지 않는다.

```css
/* 올바른 사용 */
color: var(--color-text-primary);
padding: var(--spacing-5);       /* 토큰 우선 */
margin-top: 0.125rem;            /* 2px — 토큰 없을 때만 rem 직접 작성 */

/* 금지 — primitive 직접 참조 */
color: var(--slate-90);

/* 금지 — px 사용 */
padding: 10px;
```

---

## 4. 토큰 계층 요약

| 파일 | 역할 | 예시 |
|---|---|---|
| `primitive-tokens.css` | 원시값 정의 | `--slate-90`, `--orange-60`, `--spacing-8` |
| `semantic-tokens.css` | 용도 기반 매핑 | `--color-text-primary`, `--color-brand-default` |

---

## 5. 단위 규칙 (rem)

스타일 값은 `px` 대신 `rem`을 사용한다.

- 기준: 브라우저 기본값 **1rem = 16px**
- 변환식: `px ÷ 16 = rem`
- 간격·폰트·반지름 등 대부분은 `semantic-tokens.css` 변수로 제공되므로 직접 계산 없이 변수 참조
- 변수에 없는 값을 추가할 때만 rem으로 변환하여 작성

---

## 6. 컬러 토큰 참고

> 전체 목록: [`src/shared/styles/semantic-tokens.css`](../src/shared/styles/semantic-tokens.css)
> 원시값 팔레트: [`src/shared/styles/primitive-tokens.css`](../src/shared/styles/primitive-tokens.css)

### 텍스트

| 토큰 | 용도 |
|---|---|
| `--color-text-primary` | 제목·본문 기본 텍스트 |
| `--color-text-secondary` | 부제목·설명 텍스트 |
| `--color-text-tertiary` | 힌트·폼 레이블·캡션 |
| `--color-text-disabled` | 비활성 텍스트 |
| `--color-text-placeholder` | 인풋 placeholder |
| `--color-text-inverse` | 어두운 배경(사이드바 등) 위 텍스트 |

### 배경

| 토큰 | 용도 |
|---|---|
| `--color-bg-app` | 페이지 전체 배경 |
| `--color-bg-surface` | 카드·패널·컨테이너 배경 |
| `--color-bg-muted` | 비활성 인풋·읽기 전용 배경 |
| `--color-bg-hover` | 리스트 아이템 호버 배경 |
| `--color-bg-selected` | 선택된 행·메뉴 아이템 배경 |

### 보더

| 토큰 | 용도 |
|---|---|
| `--color-border-default` | 카드·인풋·구분선 기본 테두리 |
| `--color-border-hover` | 인풋·카드 호버 시 테두리 |
| `--color-border-focus` | 인풋 포커스 시 테두리 |
| `--color-border-error` | 유효성 검사 실패 테두리 |
| `--color-border-success` | 유효성 검사 성공 테두리 |

### 브랜드

| 토큰 | 용도 |
|---|---|
| `--color-brand-default` | 주요 버튼·활성 상태 (`#FF6B2B`) |
| `--color-brand-hover` | 버튼 호버 |
| `--color-brand-active` | 버튼 클릭(pressed) |
| `--color-brand-subtle` | 배지·태그·하이라이트 배경 |

### 상태

| 토큰 | 용도 |
|---|---|
| `--color-status-error-default` | 에러 아이콘·강조 |
| `--color-status-error-bg` | 에러 배경 |
| `--color-status-error-text` | 에러 텍스트 (`#E7000B`) |
| `--color-status-success-*` | 성공 상태 (동일 패턴) |
| `--color-status-warning-*` | 경고 상태 (동일 패턴) |
| `--color-status-info-*` | 안내 상태 (동일 패턴) |

### 사이드바 (다크 배경 전용)

| 토큰 | 용도 |
|---|---|
| `--color-sidebar-bg` | 사이드바 배경 (`#0F172A`) |
| `--color-sidebar-text` | 사이드바 기본 텍스트 |
| `--color-sidebar-text-active` | 활성 메뉴 텍스트 |
| `--color-sidebar-item-active` | 활성 메뉴 아이템 배경 |
| `--color-sidebar-item-hover` | 호버 메뉴 아이템 배경 |
| `--color-sidebar-border` | 사이드바 구분선 |

---

## 7. 타이포그래피 토큰 참고

> 전체 목록: [`src/shared/styles/semantic-tokens.css`](../src/shared/styles/semantic-tokens.css)

### 폰트 크기

| 토큰 | 크기 | 용도 |
|---|---|---|
| `--typography-size-caption` | 12px | 라벨·힌트·캡션 |
| `--typography-size-ui` | 14px | 버튼·인풋 텍스트 |
| `--typography-size-body` | 16px | 본문 기본 |
| `--typography-size-h3` | 18px | 서브 헤딩 |
| `--typography-size-h2` | 20px | 중간 헤딩 |
| `--typography-size-h1` | 24px | 주요 헤딩 |
| `--typography-size-display` | 36px | 대형 헤딩·KPI 숫자 |

### 폰트 굵기

| 토큰 | 값 | 용도 |
|---|---|---|
| `--typography-weight-body` | 400 | 본문 |
| `--typography-weight-ui` | 500 | 버튼·레이블·네비게이션 |
| `--typography-weight-heading` | 600 | 헤딩·강조 |
| `--typography-weight-strong` | 700 | 핵심 강조 |

### 줄 높이

| 토큰 | 값 | 용도 |
|---|---|---|
| `--typography-leading-heading` | 1.25 | 헤딩·짧은 타이틀 |
| `--typography-leading-ui` | 1.375 | 인풋·버튼 레이블 |
| `--typography-leading-body` | 1.5 | 본문 기본 |
