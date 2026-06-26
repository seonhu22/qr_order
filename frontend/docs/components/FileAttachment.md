# FileAttachment

> 추가일: 2026-04-28

첨부파일 등록·수정·상세 조회 UI에 사용하는 공용 컴포넌트 기준을 다룬다.
이 문서는 컴포넌트 사용법만 다루며, 정책·API·QA는 별도 문서에서 관리한다.

## 관련 문서

| 문서 | 내용 |
|---|---|
| [`../file-attachment-policy.md`](../file-attachment-policy.md) | 허용 확장자, 용량, 개수 등 파일 정책 |
| [`../file-attachment-api.md`](../file-attachment-api.md) | 첨부파일 API 계약, `linkSysId`, FormData 기준 |
| [`../file-attachment-qa.md`](../file-attachment-qa.md) | 수동 QA 체크리스트와 장애 확인 순서 |

## 구성

| 위치 | 역할 |
|---|---|
| `shared/components/file-attachment/FileInputGroup.tsx` | 등록·수정 화면의 파일 선택 UI |
| `shared/components/file-attachment/FileDownloadList.tsx` | 상세 화면의 다운로드 전용 목록 |
| `shared/components/file-attachment/FileHint.tsx` | 확장자·용량·개수 제약 안내 |
| `shared/components/file-attachment/filePolicy.ts` | 파일첨부 공통 기본 정책 |
| `shared/components/file-attachment/fileTypeUtils.ts` | 확장자별 아이콘과 색상 클래스 매핑 |
| `shared/components/file-attachment/types.ts` | 서버 파일, 변경 상태, props 타입 |
| `shared/components/file-attachment/FileAttachment.css` | 파일첨부 전용 스타일 |

외부 import는 배럴 파일을 사용한다.

```tsx
import {
  FileInputGroup,
  FileDownloadList,
  FileHint,
} from '@/shared/components/file-attachment';
```

## 사용 시나리오

| 시나리오 | 컴포넌트 | 기준 |
|---|---|---|
| 등록 | `FileInputGroup` | 기존 파일 없이 새 파일만 선택한다. |
| 수정 | `FileInputGroup` | 기존 파일 목록을 받고, 신규 파일과 삭제 파일을 분리한다. |
| 상세 | `FileDownloadList` | 파일 선택·삭제 없이 다운로드만 제공한다. |
| 제약 안내 | `FileHint` | `FileInputGroup`이 기본 정책 기반으로 자동 생성하거나 호출부에서 직접 전달한다. |

## FileInputGroup

`FileInputGroup`은 새로 선택한 `File` 객체와 삭제 예정 서버 파일만 반환한다.
실제 저장 payload 조립은 각 feature hook/API 계층에서 담당한다.

```tsx
const [fileState, setFileState] = useState<FileChangeState>({
  newFiles: [],
  deletedFiles: [],
});

<FileInputGroup
  files={serverFiles}
  maxFiles={5}
  maxFileSizeMB={10}
  maxTotalSizeMB={50}
  onChange={setFileState}
/>
```

`hint`를 전달하지 않으면 `FileInputGroup`은 현재 정책을 기준으로 기본 `FileHint`를 자동 생성한다.
화면 전용 안내 문구가 필요할 때만 `hint`를 직접 전달한다.

```tsx
<FileInputGroup
  files={serverFiles}
  hint={<FileHint message="PDF 파일은 업로드 후 미리보기를 지원합니다." />}
  onChange={setFileState}
/>
```

`maxFiles: 1`처럼 파일당 최대 용량과 전체 최대 용량이 같은 정책이면, 자동 생성 힌트의 "전체 최대 ○○MB" 문구가 "파일당 최대"와 같은 값을 중복 표시해 한 줄을 넘기기 쉽다. 이때는 `maxTotalSize`를 뺀 `FileHint`를 직접 전달해 한 줄 안에 들어오게 한다.

```tsx
<FileInputGroup
  variant="button"
  maxFiles={1}
  maxFileSizeMB={10}
  maxTotalSizeMB={10}
  hint={<FileHint variant="simple" maxSize="10MB" maxCount={1} allowedExts={['JPG', 'PNG']} />}
  onChange={setFileState}
/>
```

## FileDownloadList

다운로드 API 호출 방식은 화면이 결정한다.
컴포넌트는 파일 목록과 클릭 이벤트만 제공한다.

```tsx
<FileDownloadList
  files={serverFiles}
  showHeader
  showDownloadAll
  onDownload={handleDownload}
  onDownloadAll={handleDownloadAll}
/>
```

## 데이터 타입

```ts
type ServerFile = {
  sysId: string;
  linkSysId: string;
  originalFileNm: string;
  convertFileNm: string;
  fileExt: string;
  mimeType: string;
  fileSize: string;
  filePath: string;
  ordNo: number;
  pdfYn: string;
};
```

```ts
type FileChangeState = {
  newFiles: File[];
  deletedFiles: ServerFile[];
};
```

- `newFiles`는 브라우저 `File` 객체 그대로 전달한다.
- `deletedFiles`는 기존 서버 파일 중 삭제 대상만 전달한다.
- multipart `FormData` 구성은 공용 UI가 아니라 feature hook/API 계층에서 처리한다.

## 아이콘 기준

확장자별 아이콘과 색상은 `fileTypeUtils.ts`에서 관리한다.

| 확장자 | 아이콘 | 색상 |
|---|---|---|
| JPG, JPEG, PNG | `i-file-image` | `--color-status-info-default` |
| PDF | `i-file-doc` | `--color-status-error-default` |
| DOC, DOCX | `i-file-doc` | `--color-text-secondary` |
| XLS, XLSX | `i-file-sheet` | `--color-status-success-default` |
| PPT, PPTX | `i-file-ppt` | `--color-brand-default` |
| ZIP | `i-file-zip` | `--color-status-warning-default` |
| 기타 | `i-file` | `--color-text-tertiary` |

동작 아이콘:

| 용도 | 아이콘 |
|---|---|
| 파일 선택/드롭존 | `i-file` |
| 업로드 중 | `i-loading` |
| 삭제 | `i-close` |
| 다운로드 | `i-download` |
| 안내 | `i-info` |
| 경고 | `i-lightbulb` |
| 오류 | `i-error` |

## Dev 확인

개발 미리보기는 `/dev/file-attachment`에서 확인한다.

- 등록·수정·상세 시나리오
- 드롭존 형식과 버튼 형식
- 업로드 중·disabled·최대 개수 도달 상태
- 확장자별 파일 아이콘과 색상
- `FileHint` 변형
- `onChange` 결과 로그
