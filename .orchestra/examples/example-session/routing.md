# Routing 판정

## 규모 추정

- 예상 변경 파일: 8개 (SQL 1 + backend 6 + frontend 2)
- 도메인: sql, backend, frontend (3개)
- 계약 변경: 있음 (SSE 이벤트, 알림 응답 필드)

## 판정

**tier**: A
**routing**: full
**reason**: 파일 수 6 이상 + 다도메인 + SQL 스키마 변경. F 규칙 3행 매칭.

## 사용자 신호

- "꼼꼼히 검수해서" 유사 문구 존재 → 풀 에이전트 강화
- "커밋 나눠서" → 실행팀에 세분화 커밋 지시 필요
