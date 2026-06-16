# 페이지 패턴

> 조회 전용, 편집형 CRUD, 모달 CRUD 화면을 만들 때 따르는 표준 구조다.

## 조회 전용 화면

대상: `PlantSearch`, `PlantStatus`, `AccessLog` 같은 read-only 목록

권장 구성:

- `pages/<Feature>Page.tsx`: 조립만 담당
- `features/<feature>/hooks/use<Feature>Page.ts`: `data/status/actions/uiProps`
- `features/<feature>/api/*`: generated wrapper + mapper
- `features/<feature>/components/<Feature>Filters.tsx`
- `features/<feature>/components/<Feature>Table.tsx`

서버 응답에 없는 필드는 API 레이어 mapper에서 파생한다. page나 component에서 계산하지 않는다.

## datetime-local 날짜 범위 필터

`AccessLog`, `ChangeHistory`처럼 기간 조회가 필수인 화면은 아래 패턴을 따른다.

- 필터 입력 타입은 `type="datetime-local"` 사용
- draft 상태와 핸들러는 `useQueryDateRangeDraft(maxRangeDays?)`로 관리
- 조회 버튼 클릭 시에만 `searchParams`에 반영
- API datetime 포맷은 `YYYY-MM-DD HH:MM:SS`
- 화면마다 조회 제한이 다르면 `maxRangeDays` 인자로 전달

```ts
const {
  draftStartDate,
  draftEndDate,
  dateRangeError,
  handleStartDateChange,
  handleEndDateChange,
  resetDraftDateRange,
  validateDraftDateRange,
} = useQueryDateRangeDraft();

const handleSearch = () => {
  if (!validateDraftDateRange()) return;
  setSearchParams(createQueryDateRangeParams(draftStartDate, draftEndDate, draftKeyword));
};
```

## 좌우 분할 마스터-디테일 조회 화면

편집 없이 마스터 클릭 시 우측 디테일이 바뀌는 조회 화면은 아래 패턴을 따른다.

- `AdminMainLayout`의 `children`에 래퍼 `div`를 두고 `flex-direction: row` 적용
- 래퍼에는 `flex: 1; min-height: 0; overflow: hidden` 명시
- 두 `article`은 각각 `flex: 1`로 동일 비율 차지
- 마스터 클릭 시 `selectedRow` 상태로 관리하고 같은 행 재클릭 시 선택 해제
- 디테일 조회 훅은 `enabled: Boolean(sysId)`로 제어

## 편집형 CRUD 화면

대상: `CommonCode`, `AdminUser` 같은 draft/저장/삭제가 있는 목록

권장 구성:

- `use<Feature>ListState`: baseRows, draftRows, selectedRowId, rowErrors, isDirty, 행 추가/삭제, 필드 변경, 필수 검증
- `useEditablePageFlow`: 조회/초기화 dirty guard, 저장 확인/완료 같은 shared flow
- `use<Feature>Flow`: 삭제 확인, 비밀번호 초기화, 도메인 전용 부가 모달
- `use<Feature>Page`: list state + shared flow + feature flow + API wrapper 조합

## 모달 CRUD 화면

행 직접 편집 없이 모달을 통해 등록/수정/삭제하는 목록 화면의 표준이다.

**shared 훅을 쓸 수 있는 경우**

- `코드 / 명칭 / 사용여부` 3필드 구조
- 대상: `CommonCode` 마스터, `RuleManagement` 마스터
- 모달 흐름: `shared/hooks/useCodeMasterModalFlow.ts` 재사용

**feature 전용 훅이 필요한 경우**

- 숫자·셀렉트 등 고유 필드 구성이 있는 경우
- `features/<feature>/hooks/use<Feature>ModalFlow.ts` 직접 작성
- 폼 입력용 row 타입은 string 필드 중심으로 구성하고 저장 시 변환
- 코드 필드는 등록 시에만 편집 가능, 수정 시 `readonly`

공통 모달 전이 흐름:

```text
등록/수정 클릭 -> EditorModal 오픈
  -> 필수값 검증 실패 -> 필드 오류 표시
  -> 검증 통과 -> SaveConfirmModal / EditConfirmModal
  -> 저장 실행 -> 결과 안내
  -> dirty 상태에서 닫기 -> DirtyWarningModal

삭제 클릭 -> 선택 항목 없음 -> 안내 모달
  -> 선택 있음 -> DeleteConfirmModal
  -> 삭제 실행 -> 결과 안내
```
