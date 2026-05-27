# File Attachment Policy

첨부파일 허용 확장자, 용량, 개수 정책을 정리한다.
컴포넌트 사용법은 [`components/FileAttachment.md`](./components/FileAttachment.md)를 참고한다.

## 기본 정책

| 항목 | 기본값 |
|---|---|
| 최대 파일 수 | 5개 |
| 파일당 최대 크기 | 10 MB |
| 전체 최대 크기 | 50 MB |
| 허용 확장자 | DOC, DOCX, XLS, XLSX, PPT, PPTX, PDF, PNG, TXT, ZIP |

기본 허용 확장자는 `filePolicy.ts`의 `DEFAULT_FILE_ALLOWED_EXTENSIONS`에서 관리한다.

```ts
import { DEFAULT_FILE_ALLOWED_EXTENSIONS } from '@/shared/components/file-attachment';
```

```ts
const policy = {
  maxFiles: 5,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 50,
  allowedExtensions: DEFAULT_FILE_ALLOWED_EXTENSIONS,
};
```

## 역할 분리

| 파일 | 역할 |
|---|---|
| `filePolicy.ts` | 파일첨부 공통 기본 정책 원본 |
| `FileInputGroup.tsx` | 정책 적용, 파일 선택 검증, 기본 힌트 생성 |
| `buildHintParts.ts` | 받은 정책을 화면 안내 문구로 조립 |
| feature `constants.ts` | 화면별 첨부파일 정책 선언 |

`buildHintParts.ts`에는 정책 값을 넣지 않는다.
이 파일은 정책을 소유하지 않고, 전달받은 값을 문장으로 바꾸는 formatter 역할만 한다.

## 화면별 정책 기준

기본 정책과 같은 화면은 공통 정책을 재사용한다.

```ts
export const NOTICE_FILE_POLICY = {
  maxFiles: 5,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 50,
  allowedExtensions: DEFAULT_FILE_ALLOWED_EXTENSIONS,
} as const;
```

화면별 정책이 달라지면 feature constants에서 별도 정책을 선언한다.

```ts
export const PROFILE_IMAGE_FILE_POLICY = {
  maxFiles: 1,
  maxFileSizeMB: 5,
  maxTotalSizeMB: 5,
  allowedExtensions: ['jpg', 'jpeg', 'png'],
} as const;
```

## 주의사항

- 백엔드 허용 확장자와 프론트 정책이 다르면 사용자는 업로드 가능하다고 보지만 서버에서 실패할 수 있다.
- 정책 변경 시 `FileInputGroup` 힌트, `accept` 속성, 유효성 검사가 함께 바뀌는지 확인한다.
- `FileInputGroup` prop 이름은 `allowedExtensions`다. feature 정책 필드명도 같은 이름을 사용한다.
- `FileHint`와 `buildHintParts` 내부의 `allowedExts`는 힌트 전용 인자 이름이므로 `FileInputGroup` 정책 prop과 구분한다.
