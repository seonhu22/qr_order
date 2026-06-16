# API 응답·호출 정책

> 저장성 API 응답 구조, generated API 호출 위치, mapper 명명 규칙을 정리한다.

## 저장성 API 응답

명세 기준으로 저장/수정/삭제 API는 `CommonResponse` 구조를 반환한다.

```json
{ "success": true, "message": "성공 메시지" }
```

```json
{ "success": false, "message": "에러 메시지", "error": "상세 오류" }
```

프론트에서는 이 구조를 공통 처리해야 한다.

## generated API 호출 기준

- `generated/*`는 feature 전용 API wrapper에서만 사용한다.
- page나 component에서 generated API를 직접 호출하지 않는다.
- DTO에서 화면 모델로 변환하는 작업과 저장 payload 조립은 feature `api/*` 계층에서 처리한다.

## mapper 명명 규칙

- DTO → 화면 모델: `mapTo[Entity]Model`
- 화면 모델 → 저장 payload: `mapTo[Entity]Payload`

```ts
mapToCommonMasterModel;
mapToCommonDetailModel;
mapToCommonMasterPayload;
```

`normalize`, `map`, `buildRequest` 같은 도메인 의미가 강한 유틸은 우선 feature 가까이에 둔다. 여러 기능에서 같은 입력/출력 계약으로 반복될 때만 shared 유틸로 올린다.

## 관련 문서

- [API 코드 생성 가이드](../api-codegen.md)
- [비동기 데이터 연동 패턴](../async-patterns.md)
