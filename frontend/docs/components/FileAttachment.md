# FileAttachment

> 추가일: 2026-04-28

첨부파일 등록·수정·상세 조회 UI에 사용하는 공용 컴포넌트 기준을 다룬다.
UI 컴포넌트는 파일 선택 상태와 기존 파일 삭제 상태만 콜백으로 전달하고, 실제 저장 API payload 조립은 각 feature hook에서 담당한다.

## 1. 구성

| 위치 | 역할 |
|---|---|
| `shared/components/file-attachment/FileInputGroup.tsx` | 등록·수정 화면의 파일 선택 UI |
| `shared/components/file-attachment/FileDownloadList.tsx` | 상세 화면의 다운로드 전용 목록 |
| `shared/components/file-attachment/FileHint.tsx` | 확장자·용량·개수 제약 안내 |
| `shared/components/file-attachment/fileTypeUtils.ts` | 확장자별 아이콘과 색상 클래스 매핑 |
| `shared/components/file-attachment/types.ts` | 서버 파일, 변경 상태, props 타입 |
| `shared/components/file-attachment/FileAttachment.css` | 파일첨부 전용 스타일 |

외부 import는 반드시 배럴 파일을 사용한다.

```tsx
import {
  FileInputGroup,
  FileDownloadList,
  FileHint,
} from '@/shared/components/file-attachment';
```

## 2. 사용 시나리오

| 시나리오 | 컴포넌트 | 기준 |
|---|---|---|
| 등록 | `FileInputGroup` | 기존 파일 없이 새 파일만 선택한다. |
| 수정 | `FileInputGroup` | 기존 파일 목록을 받고, 신규 파일과 삭제 파일을 분리한다. |
| 상세 | `FileDownloadList` | 파일 선택·삭제 없이 다운로드만 제공한다. |
| 제약 안내 | `FileHint` | 화면 정책에 맞춰 확장자·용량·개수 안내를 표시한다. |

```tsx
const [fileState, setFileState] = useState<FileChangeState>({
  newFiles: [],
  deletedFiles: [],
});

<FileInputGroup
  files={serverFiles}
  maxFiles={5}
  maxFileSizeMB={50}
  maxTotalSizeMB={50}
  onChange={setFileState}
/>
```

```tsx
<FileDownloadList
  files={serverFiles}
  showHeader
  showDownloadAll
  onDownload={handleDownload}
  onDownloadAll={handleDownloadAll}
/>
```

## 3. 데이터 계약

`ServerFile`은 화면에서 다루는 서버 첨부파일 메타데이터 기준이다.
`GET /api/attach_file` 응답은 이 중 화면 표시와 다운로드에 필요한 일부 필드만 내려올 수 있고,
저장 API의 `updateItems`·`delItems`는 더 많은 메타데이터를 포함할 수 있다.

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

`FileInputGroup`의 `onChange`는 아래 구조를 반환한다.

```ts
type FileChangeState = {
  newFiles: File[];
  deletedFiles: ServerFile[];
};
```

- `newFiles`는 브라우저 `File` 객체 그대로 전달한다.
- `deletedFiles`는 기존 서버 파일 중 삭제 대상만 전달한다.
- `updateItems`는 기존 파일 순서 변경 같은 정책이 생겼을 때 feature hook에서 구성한다.
- `convertFileNm`, `filePath`는 백엔드가 생성·관리한다.
- 저장 요청은 multipart/form-data 방식으로 전송한다.
- multipart `FormData` 구성은 공용 UI가 아니라 feature hook/API 계층에서 처리한다.

## 4. API 계약

| 메서드 | API | 함수명 | 용도 | 필수값 |
|---|---|---|---|---|
| POST | `/api/attach_file/save` | `saveFile` | 파일 업로드 및 저장 | `fileRequest` |
| GET | `/api/attach_file` | `getAttachFile` | 특정 데이터에 연결된 파일 목록 조회 | `sysId` |
| GET | `/api/attach_file/download` | `downloadFile` | 개별 파일 다운로드 | `sysId` |
| GET | `/api/attach_file/download_all` | `downloadAllFile` | 전체 파일 압축 다운로드 | `linkSysId` |

저장 API의 성공 응답은 공통 응답 형식을 사용한다.

```json
{
  "success": true,
  "message": "string",
  "error": "string",
  "data": {}
}
```

목록 조회 응답은 아래 필드를 기준으로 화면에 표시한다.

```json
[
  {
    "sysId": "string",
    "originalFileNm": "string",
    "fileSize": "string",
    "filePath": "string",
    "ordNo": 1,
    "fileExt": "string",
    "pdfYn": "string"
  }
]
```

## 5. 저장 API Payload

현재 저장 API는 아래 형태를 기준으로 한다.

```http
POST /api/attach_file/save
Content-Type: multipart/form-data
```

```json
{
  "newItems": [
    {
      "sysId": "string",
      "linkSysId": "string",
      "file": "string",
      "convertFileNm": "string",
      "filePath": "string",
      "ordNo": 1
    }
  ],
  "updateItems": [
    {
      "sysId": "string",
      "linkSysId": "string",
      "originalFileNm": "string",
      "convertFileNm": "string",
      "fileExt": "string",
      "mimeType": "string",
      "fileSize": "string",
      "filePath": "string",
      "ordNo": 1,
      "pdfYn": "string"
    }
  ],
  "delItems": [
    {
      "sysId": "string",
      "linkSysId": "string",
      "originalFileNm": "string",
      "convertFileNm": "string",
      "fileExt": "string",
      "mimeType": "string",
      "fileSize": "string",
      "filePath": "string",
      "ordNo": 1,
      "pdfYn": "string"
    }
  ]
}
```

구성 기준:

- `newItems`: `FileChangeState.newFiles`를 API 형식으로 변환한다.
- `updateItems`: 유지되는 기존 파일을 저장 정책에 맞춰 구성한다.
- `delItems`: `FileChangeState.deletedFiles`를 그대로 사용한다.
- `file`은 multipart/form-data에 포함하는 실제 파일 값이다.
- `convertFileNm`은 프론트에서 생성하지 않는다. 백엔드가 자동 생성한다.
- `filePath`는 프론트에서 조립하지 않는다. 백엔드가 세션의 현재 메뉴 정보를 기준으로 저장 경로를 생성한다.
- API 경로는 `/api/attach_file/save`를 기준으로 사용한다. 이중 slash(`/api//attach_file/save`)가 생기지 않도록 호출부에서 경로를 정리한다.
- 생성된 Orval `saveFile`은 현재 `fileRequest`를 query params로 전달하는 형태일 수 있으므로, multipart 저장이 확인되기 전까지는 저장 전용 API wrapper를 별도로 둔다.

### 메뉴 접근 로그 선행 조건

첨부파일 저장은 백엔드 세션에 저장된 현재 메뉴 정보를 사용한다.
관리자 메뉴에 진입할 때 프론트는 메뉴 접근 로그 함수를 반드시 실행해야 하며, 백엔드는 이 호출을 기준으로 세션에 현재 메뉴명을 보관한다.
이 호출이 누락되면 첨부파일 저장 경로를 만들 수 없으므로, 첨부파일을 사용하는 화면은 메뉴 접근 로그 흐름이 먼저 동작해야 한다.

예시 저장 경로:

```text
.../upload/sys_menu/2026/01/.pdf
.../upload/sys_admin/2026/03/.pdf
```

관련 기준은 [`menu-access-log.md`](../menu-access-log.md)를 함께 확인한다.

## 6. 훅 구성 기준

첨부파일 훅은 UI 상태와 API 호출을 분리한다.

| 훅 | 위치 | 역할 |
|---|---|---|
| `useFileAttachmentState` | `shared/hooks` 또는 feature hook 내부 | 새 파일과 삭제 파일 상태 관리 |
| `useAttachFileList` | feature hook | `GET /api/attach_file`로 기존 첨부파일 조회 |
| `useSaveAttachFiles` | feature hook/API 계층 | `multipart/form-data` 저장 요청 생성 |
| `useAttachFileDownload` | feature hook/API 계층 | 개별·전체 다운로드 처리 |

`useFileAttachmentState`는 컴포넌트와 가장 가깝게 두고, 저장·조회·다운로드는 화면 데이터의 `sysId`·`linkSysId`를 아는 feature hook에서 조립한다.

```tsx
const fileAttachment = useFileAttachmentState();

<FileInputGroup
  files={attachFiles}
  onChange={fileAttachment.handleChange}
/>
```

저장 흐름:

```ts
await saveAttachFiles({
  linkSysId,
  newFiles: fileAttachment.newFiles,
  updateItems,
  delItems: fileAttachment.deletedFiles,
});
```

저장 훅 기준:

- `FormData`의 `Content-Type`은 브라우저가 boundary와 함께 자동 설정하게 둔다.
- 프론트에서 `convertFileNm`, `filePath`를 생성하지 않는다.
- 신규 파일의 `ordNo`는 화면 정렬 순서를 기준으로 부여한다.
- 저장 성공 후 `GET /api/attach_file` 쿼리를 invalidate 하거나 다시 조회한다.
- 메뉴 접근 로그는 훅에서 직접 호출하지 않는다. 메뉴 진입 시 `AdminLayout` 흐름에서 먼저 실행되어야 한다.
- 첨부파일 저장 버튼과 저장 실행 함수는 `useAdminMenuAccessLogStatus().isReady`가 `true`일 때만 동작하게 막는다.

```tsx
const menuAccessLog = useAdminMenuAccessLogStatus();

<Button disabled={!menuAccessLog.isReady || saveMutation.isPending}>
  저장
</Button>
```

```ts
if (!menuAccessLog.isReady) {
  throw new Error('메뉴 접근 로그 완료 후 첨부파일을 저장할 수 있습니다.');
}
```

## 7. 다운로드 API

파일 다운로드는 `filePath`에 직접 접근하지 않고 백엔드 다운로드 API를 호출한다.

| 용도 | API | 필수값 |
|---|---|---|
| 개별 다운로드 | `GET /api/attach_file/download` | `sysId` |
| 전체 다운로드 | `GET /api/attach_file/download_all` | `linkSysId` |

- `FileDownloadList`의 `onDownload`, `onDownloadAll` 콜백에서 위 API를 호출한다.
- `filePath`는 직접 다운로드 URL로 사용하지 않는다. 서버 파일 메타데이터로만 보관하고 다운로드는 API를 통해 처리한다.
- 다운로드 응답은 blob으로 처리해야 한다. 공용 `httpClient`가 `responseType: 'blob'`을 처리하지 못하면 다운로드 전용 wrapper에서 먼저 처리한다.

## 8. 기본 정책

| 항목 | 기본값 |
|---|---|
| 최대 파일 수 | 5개 |
| 파일당 최대 크기 | 50 MB |
| 전체 최대 크기 | 50 MB |
| 허용 확장자 | JPG, JPEG, PNG, PDF, DOCX, XLSX, PPTX, ZIP |

정책 값은 `FileInputGroup`과 `FileHint`에 같은 값으로 전달한다.

```tsx
const policy = {
  maxFiles: 5,
  maxFileSizeMB: 50,
  maxTotalSizeMB: 50,
};
```

## 9. 아이콘 기준

확장자별 아이콘과 색상은 `fileTypeUtils.ts`에서 관리한다.

| 확장자 | 아이콘 | 색상 |
|---|---|---|
| JPG, JPEG, PNG | `i-file-image` | `--color-status-info-default` |
| PDF | `i-file-doc` | `--color-status-error-default` |
| DOCX | `i-file-doc` | `--color-text-secondary` |
| XLSX | `i-file-sheet` | `--color-status-success-default` |
| PPTX | `i-file-ppt` | `--color-brand-default` |
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

## 10. Dev 확인

개발 미리보기는 `/dev/file-attachment`에서 확인한다.

- 등록·수정·상세 시나리오
- 드롭존 형식과 버튼 형식
- 업로드 중·disabled·최대 개수 도달 상태
- 확장자별 파일 아이콘과 색상
- `FileHint` 변형
- `onChange` 결과 로그
