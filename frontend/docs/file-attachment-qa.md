# File Attachment QA

첨부파일 기능 수동 QA 체크리스트와 장애 확인 순서를 정리한다.
API 계약은 [`file-attachment-api.md`](./file-attachment-api.md)를 참고한다.

## 공통 확인

- 화면에 표시되는 허용 확장자가 실제 백엔드 허용 확장자와 일치하는지 확인한다.
- 파일 개수, 파일당 용량, 전체 용량 제한이 UI에서 먼저 안내되는지 확인한다.
- 허용되지 않은 확장자를 선택하면 저장 요청 전에 UI 에러가 표시되는지 확인한다.
- `Content-Type`을 직접 지정하지 않고 `multipart/form-data` boundary가 브라우저에서 자동 설정되는지 확인한다.

## 등록 QA

- 파일 없이 게시물을 등록할 수 있는지 확인한다.
- 허용 확장자 파일을 1개 첨부해 등록한다.
- 여러 파일을 첨부해 등록한다.
- 최대 파일 수를 초과하면 UI 에러가 표시되는지 확인한다.
- 파일당 최대 용량을 초과하면 UI 에러가 표시되는지 확인한다.
- 전체 파일 용량을 초과하면 UI 에러가 표시되는지 확인한다.

## 수정 QA

- 기존 첨부파일이 목록에 표시되는지 확인한다.
- 기존 첨부파일을 삭제 예정으로 표시한 뒤 저장한다.
- 새 파일을 추가한 뒤 저장한다.
- 기존 파일 삭제와 새 파일 추가를 한 번에 수행한다.
- 저장 후 다시 열었을 때 첨부파일 목록이 최신 상태인지 확인한다.

## 다운로드 QA

- 개별 다운로드가 `sysId` 기준으로 호출되는지 확인한다.
- 전체 다운로드가 `linkSysId` 기준으로 호출되는지 확인한다.
- 다운로드 응답이 blob으로 처리되어 파일이 저장되는지 확인한다.
- 문의사항/공지사항 row의 `fileUlid`가 첨부파일 API에는 `linkSysId`로 전달되는지 확인한다.

## ZIP 생성 실패 확인

`download_all` 응답이 아래처럼 실패하면 백엔드 ZIP 생성 단계 문제일 가능성이 높다.

```json
{
  "data": null,
  "error": "ZIP 생성 실패",
  "message": "오류가 발생했습니다. 관리자에게 문의 바랍니다.",
  "success": false
}
```

확인 순서:

1. 요청 파라미터가 `linkSysId`인지 확인한다.
2. `attach_file.link_sys_id`에 해당 파일 목록이 있는지 확인한다.
3. DB의 `file_path`, `convert_file_nm`, `file_ext`, `pdf_yn` 조합으로 실제 파일이 존재하는지 확인한다.
4. 같은 `link_sys_id` 안에 `original_file_nm + file_ext`가 중복되는지 확인한다.

중복 파일명 확인 SQL:

```sql
select
    link_sys_id,
    original_file_nm,
    file_ext,
    count(*) as cnt
from public.attach_file
where link_sys_id = '확인할 linkSysId'
  and delete_yn = 'N'
group by link_sys_id, original_file_nm, file_ext
having count(*) > 1;
```

실제 파일 경로 확인 기준:

```text
pdf_yn = 'Y' -> file_path/convert_file_nm.pdf
pdf_yn = 'N' -> file_path/convert_file_nm + file_ext
```

## 중복 파일명 QA

프론트에서 중복 파일명 차단을 구현한 경우 아래를 확인한다.

- 기존 서버 파일과 같은 이름의 새 파일을 추가하면 차단된다.
- 대소문자만 다른 파일명도 중복으로 차단된다.
- 이미 선택한 새 파일과 같은 이름을 다시 선택하면 차단된다.
- 한 번에 선택한 파일 목록 안에 중복 이름이 있으면 차단된다.
- 삭제 예정 기존 파일과 같은 이름의 새 파일은 허용된다.

프론트에서 막아도 이미 DB에 들어간 중복 데이터는 막을 수 없다.
전체 다운로드 안정성을 위해 백엔드 ZIP 생성 쪽에서도 중복 entry 이름 방어가 필요하다.
