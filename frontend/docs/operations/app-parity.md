# Admin/Client 패리티

> Admin과 Client 앱의 동일 도메인 기능은 권한 범위를 제외하고 가능한 한 같은 구조로 유지한다.

## 기본 원칙

Admin과 Client(추후 Consumer 포함) 앱은 권한(역할) 범위만 다를 뿐, 동일 도메인 기능의 로직·흐름·화면 구조는 동일하게 유지한다.

폴더 구조 미러링은 [ADR-008](../decisions.md#adr-008--신규-앱은-admin-폴더-규칙을-미러링한다)에서 다룬다. 이 문서는 기능 단위 로직 패리티를 다룬다.

## 동일하게 맞춰야 하는 항목

- ViewModel 구조: `data / status / actions / uiProps`
- 모달/CRUD 전이 흐름: 등록·수정·삭제·비밀번호 초기화 등 흐름 순서와 분기
- 목록 로딩/에러/빈 목록 처리
- 안내 모달의 구조(제목/본문/helperText 유무)
- 테스트 커버리지 레이어: api mapper / modal flow hook / page hook / table 컴포넌트 단위 테스트

## 차이가 있어도 되는 항목

- 권한·메뉴 노출 범위
- 접근 가능한 API 엔드포인트·요청 파라미터
- 화면에 노출되는 문구·라벨

위 분류 밖의 로직 차이가 생기면 의도된 차이인지 먼저 확인한다.

## 적용 절차

Admin feature를 기준으로 Client의 동일 feature를 구현·리팩토링할 때는 Admin 구현을 1:1로 대조한다.

예시:

- `AdminUser`와 `ClientUser`
- ViewModel 타입
- 모달 플로우
- 테이블 loading/error 처리
- 테스트 4종(`*Api.test`, `use*ModalFlow.test`, `use*Page.test`, `*Table.test`)
