# File Attachment API

첨부파일 API 계약과 저장 payload 구성 기준을 정리한다.
컴포넌트 사용법은 [`components/FileAttachment.md`](./components/FileAttachment.md)를 참고한다.

## 핵심 ID

| 이름 | 의미 | 주 사용처 |
|---|---|---|
| `attach_file.sys_id` | 파일 1개의 고유 ID | 개별 다운로드, 개별 삭제 |
| `linkSysId` | 업무 데이터와 파일 묶음을 연결하는 ID | 파일 목록 조회, 전체 다운로드, 저장 payload |
| `fileUlid` | 공지사항/문의사항 응답에서 내려오는 파일 그룹 ID | 화면 row에서 받아 `linkSysId`로 전달 |

`fileUlid`는 프론트 화면에서 사용하는 응답 필드명이고, 첨부파일 API에는 `linkSysId`로 전달한다.

```ts
downloadAllFile({ linkSysId: row.fileUlid });
```

## API 계약

| 메서드 | API | 함수명 | 용도 | 필수값 |
|---|---|---|---|---|
| POST | `/api/attach_file/save` | `saveFile` | 파일 업로드 및 저장 | `fileRequest` |
| GET | `/api/attach_file` | `getAttachFile` | 특정 데이터에 연결된 파일 목록 조회 | `linkSysId` |
| GET | `/api/attach_file/download` | `downloadFile` | 개별 파일 다운로드 | `sysId` |
| GET | `/api/attach_file/download_all` | `downloadAllFile` | 전체 파일 압축 다운로드 | `linkSysId` |

다운로드는 `filePath`에 직접 접근하지 않고 백엔드 다운로드 API를 호출한다.

## 목록 조회 응답

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

`GET /api/attach_file` 응답은 화면 표시와 다운로드에 필요한 일부 필드만 내려올 수 있다.
저장 API의 `updateItems`, `delItems`는 더 많은 메타데이터를 포함할 수 있다.

## 저장 API Payload

현재 저장 API는 `multipart/form-data`를 기준으로 한다.

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
      "file": "File",
      "convertFileNm": "string",
      "filePath": "string",
      "ordNo": 1
    }
  ],
  "updateItems": [
    {
      "sysId": "string",
      "ordNo": 1
    }
  ],
  "delItems": [
    {
      "sysId": "string"
    }
  ]
}
```

구성 기준:

- `newItems`: `FileChangeState.newFiles`를 API 형식으로 변환한다.
- `updateItems`: 기존 파일 순서 변경 같은 정책이 있을 때 구성한다.
- `delItems`: `FileChangeState.deletedFiles`를 기준으로 구성한다.
- `file`은 multipart/form-data에 포함하는 실제 파일 값이다.
- `Content-Type`은 직접 지정하지 않고 브라우저가 boundary와 함께 자동 설정하게 둔다.
- multipart `FormData` 구성은 공용 UI가 아니라 feature hook/API 계층에서 처리한다.

## 경로 관련 주의사항

`convertFileNm`, `filePath`는 API 계약과 화면별 구현 상태에 따라 프론트 또는 백엔드에서 처리될 수 있다.
현재 구현을 변경할 때는 해당 feature API wrapper와 백엔드 계약을 함께 확인한다.

## 메뉴 접근 로그 선행 조건

첨부파일 저장은 백엔드 세션에 저장된 현재 메뉴 정보를 사용할 수 있다.
관리자 메뉴에 진입할 때 프론트는 메뉴 접근 로그 함수를 실행해야 하며, 백엔드는 이 호출을 기준으로 세션에 현재 메뉴명을 보관한다.

이 호출이 누락되면 첨부파일 저장 경로를 만들 수 없을 수 있으므로, 첨부파일을 사용하는 화면은 메뉴 접근 로그 흐름이 먼저 동작해야 한다.

관련 기준은 [`menu-access-log.md`](./menu-access-log.md)를 함께 확인한다.

## 다운로드 API

| 용도 | API | 필수값 |
|---|---|---|
| 개별 다운로드 | `GET /api/attach_file/download` | `sysId` |
| 전체 다운로드 | `GET /api/attach_file/download_all` | `linkSysId` |

- `FileDownloadList`의 `onDownload`, `onDownloadAll` 콜백에서 위 API를 호출한다.
- 다운로드 응답은 blob으로 처리한다.
- 전체 다운로드 ZIP은 같은 ZIP entry 이름이 중복되면 백엔드에서 실패할 수 있다.
