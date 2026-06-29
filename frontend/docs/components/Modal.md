# Modal 컴포넌트

> [`components.md`](../components.md)의 자식 문서다. 모달 폴더 구조, 계층 원칙, 작성 규칙을 다룬다.

## 목차

- [1. 폴더 구조](#1-폴더-구조)
- [2. 계층 원칙](#2-계층-원칙)
- [3. 작성 원칙](#3-작성-원칙)

---

## 1. 폴더 구조

```text
modal/
  index.ts              ← WrapperModal + template 계열 컴포넌트·타입 전체 공개
  wrapper/
    WrapperModal.tsx    ← Portal, Overlay, Dimmed, ESC/배경 클릭 닫기
  base/
    modal.css           ← 모달 공통 스타일
    modal.constants.ts  ← 크기·버튼 등 상수
    modalType.ts        ← 모달 공통 타입 정의
  template/
    ConfirmModal.tsx            ← 확인/취소 2버튼 모달
    DeleteConfirmModal.tsx      ← 삭제 확인 모달
    DeleteListConfirmModal.tsx  ← 삭제 항목 목록 포함 저장 확인 모달
    EditConfirmModal.tsx        ← 수정 확인 모달
    SaveConfirmModal.tsx        ← 저장 확인 모달
    NoticeModal.tsx             ← 안내(확인 1버튼) 모달
    NoticeConfirmModal.tsx      ← 안내 + 확인/취소 모달
    SimpleDefaultModal.tsx      ← 빈 슬롯형 범용 모달
    ValidationNoticeModal.tsx   ← 검증 안내 목록 모달
```

---

## 2. 계층 원칙

공용 컴포넌트 일반 원칙([components.md §2](../components.md#2-3-레이어-패턴))보다 더 엄격하게 적용한다.

| 레이어 | 역할 | 예시 | 수정 빈도 |
|---|---|---|---|
| **Wrapper** | Portal, Overlay, Dimmed, ESC/배경 클릭 닫기 같은 인프라 처리 | `WrapperModal` | 거의 없음 |
| **Base** | 타입·상수·스타일 같은 골격 계약 정의 | `modalType.ts`, `modal.constants.ts`, `modal.css` | 타입 추가 시 |
| **template(완성형)** | DTO 연결, 저장/수정/삭제 같은 비즈니스 처리 | `SaveModal`, `UpdateModal`, `DetailModal` | 화면 추가 시마다 |

즉 모달은 단순 시각 컴포넌트가 아니라, 공통 인프라와 공통 골격, 비즈니스 목적을 분리해서 관리해야 한다.

- `wrapper/`와 `base/`는 직접 수정하는 경우가 드물다. 새 모달 필요 시 `template/`에 추가한다.
- 외부에서 import할 때는 반드시 `modal/index.ts`를 통한다.

```ts
// 올바른 import
import { ConfirmModal, WrapperModal } from '@/shared/components/modal';
import type { ModalSize, ConfirmModalProps } from '@/shared/components/modal';

// 금지 — 내부 파일 직접 참조
import { ConfirmModal } from '@/shared/components/modal/template/ConfirmModal';
```

---

## 3. 작성 원칙

1. `wrapper`는 DOM 분리와 overlay 동작만 담당한다.
2. `base`는 시각적 골격만 담당한다.
3. `template`는 실제 DTO와 연결되는 비즈니스 목적 모달만 담당한다.
4. 저장/수정/삭제 흐름은 가능하면 template 계층에서 명확히 분리한다.
5. 폼을 포함한 모달은 현재 `wrapper / base / template` 계층을 기준으로 작성하고, 검증/전송 규칙이 반복되면 그때 form 전용 base를 별도 파일로 분리한다.
6. Audit Trail을 위한 변경 전/후 데이터 비교 로직은 template 계층에서 수행한다.
7. 모달 폼 안의 Input·Select 크기는 `md`로 통일한다.
8. `SelectInput` 드롭다운은 `createPortal`로 `document.body`에 렌더되므로 모달 안에서도 `overflow: hidden`에 잘리지 않는다.
9. `SelectInput` 드롭다운은 `ArrowDown/Up`, `Home/End`, `Enter/Space`, `Escape` 키보드 네비게이션을 지원한다. 트리거 버튼의 기본 포커스 아웃라인(파란 테두리)은 `.select-control__trigger:focus { outline: none }`으로 제거되어 있다.
10. `SelectInput` 드롭다운 위치는 트리거 클릭(`handleToggle`) 시점에 동기적으로 미리 계산된다. 첫 클릭에 드롭다운이 올바른 위치에 즉시 표시되며, 테이블 행 클릭 선택과 SelectInput 클릭이 겹치는 상황에서도 한 번의 클릭으로 정상 동작한다.
11. 입력값이 원본과 달라진 상태(dirty)에서 ESC·overlay 클릭·닫기 버튼을 누르면 경고 모달("페이지를 나가시겠습니까?")을 먼저 표시한다. `WrapperModal`은 항상 `onClose`를 호출하고, dirty 판단과 경고 모달 표시는 호출부(`closeEditorModal`)가 담당한다.
12. 모달이 열릴 때 닫기 버튼을 제외한 첫 번째 입력 필드에 자동으로 포커스가 이동하며, Tab/Shift+Tab은 모달 내부에서만 순환한다.
13. 저장·삭제 확인 모달은 편집 모달 위에 쌓이는 방식(stack)으로 동작한다. 확인 클릭 시 작업이 완료된 후 두 모달이 함께 닫힌다. 취소 클릭 시 확인 모달만 닫히고 편집 모달은 유지된다.
14. 저장·삭제 버튼의 로딩 상태는 외부 prop(`isSaving`, `isDeleting`) 대신 훅 내부 state(예: `isConfirming`, `isConfirmingDelete`)로 관리한다. 부모 mutation의 `isPending`과 훅 state 간 타이밍 차이로 버튼이 일시적으로 활성화되는 현상을 방지하기 위해서다. 저장 훅(`useCommonCodeDetailTableFlow` 등)에도 동일하게 적용한다.
15. `ConfirmModal`·`DeleteConfirmModal`은 `description`(본문, secondary 색상)과 `helperText`(보조 안내, tertiary 색상)를 분리해서 전달할 수 있다. `SimpleDefaultModal`과 동일한 패턴이다.
16. 삭제 확인 모달의 `description`은 단건·다건을 구분한다. 1건이면 "선택한 항목을 삭제하면 복구할 수 없습니다.", 2건 이상이면 "선택한 N건의 항목을 삭제하면 복구할 수 없습니다."로 표시한다. 삭제가 아닌 다른 선택 기반 일괄 액션(예: `QrCode`의 일괄 출력 확인 모달)에도 같은 분기 원칙을 적용한다 — 1건이면 `description` 없이 제목만, 2건 이상이면 "총 N건이 출력됩니다." 같은 건수 안내를 추가한다.
17. 모달 `description`에 `\n`을 삽입하면 줄바꿈이 그대로 표시된다. `modal.css`의 `.base-modal__description`에 `white-space: pre-line`이 적용되어 있기 때문이다. 단순 안내 문구를 합칠 때만 `messages.join('\n')` 형태로 사용한다.
18. 저장 전 삭제 항목이 있을 때는 `DeleteListConfirmModal`을 사용한다. `items: { code: string; name: string }[]`를 전달하면 목록을 렌더하고 총 건수를 리스트 상단 우측에 표시한다. 확인 클릭 시 `SaveConfirmModal`을 거치지 않고 바로 저장 로직을 실행한다.
19. `SimpleDefaultModal`의 `description`은 문자열 또는 `ReactNode`를 받을 수 있다. 문장 일부를 강조해야 할 때만 `ReactNode`를 사용하고, 강조 색상은 semantic token을 참조한 feature class로 지정한다.
20. 행추가/행삭제가 있는 인라인 편집 테이블의 저장 검증 안내는 개수에 따라 모달을 나눈다. 검증 안내가 1개면 `SimpleDefaultModal`, 2개 이상이면 `ValidationNoticeModal`을 사용한다. 이 규칙은 셀 내부에 필드별 안내 문구를 둘 공간이 부족한 행추가 테이블 전용이며, 일반 등록/수정 폼 모달은 기존처럼 필드 옆 `errorText`를 사용한다.
21. `SaveConfirmModal`/`EditConfirmModal`은 항상 `title`에 질문을, `description`에 부연 설명을 넣는다. `ConfirmModal`(조회/초기화)·`DeleteConfirmModal`과 같은 구조다. `title` 기본값("저장 확인"/"수정 확인")에 의존하지 않는다.
    - `SaveConfirmModal`: `title="저장하시겠습니까?"` / `description="입력하신 내용을 저장합니다."`
    - `EditConfirmModal`: `title="수정하시겠습니까?"` / `description="변경된 내용이 저장됩니다."`
    - 화면별 엔티티명을 넣어 문구를 다르게 만들지 않는다(예: "OOO 상세를 저장하시겠습니까?" 금지) — title과 의미가 중복되고 화면마다 문구가 달라진다.
    - 저장 완료 안내(`savedNotice`)도 기본값 "저장되었습니다."를 그대로 쓴다. 화면별로 다른 문구("저장 완료되었습니다." 등)로 덮어쓰지 않는다.
22. 모달이 여러 겹 쌓여 있을 때(편집 모달 위에 메뉴 추가, 그 위에 옵션 추가가 또 열리는 식) ESC는 항상 가장 위(가장 나중에 열린) 모달 1개만 닫는다. `WrapperModal`이 열려 있는 인스턴스를 mount 순서대로 모듈 스코프 스택에 쌓아두고, keydown 시점에 스택 맨 위인 인스턴스만 `onClose`를 호출한다(`WrapperModal.tsx`). 그 결과 ESC를 반복해서 누르면 13번 규칙처럼 위 모달부터 한 단계씩 닫히고, dirty 경고가 있는 단계는 11번 규칙대로 경고부터 뜬다. overlay 클릭은 DOM 쌓임 순서상 항상 맨 위 오버레이만 클릭 가능해 별도 처리가 필요 없다.

```tsx
<SimpleDefaultModal
  open={open}
  description={(
    <>
      <strong className="admin-user-reset-modal__account-id">admin01</strong>
      {' 비밀번호를 초기화 하시겠습니까?'}
    </>
  )}
  onClose={onClose}
/>
```
