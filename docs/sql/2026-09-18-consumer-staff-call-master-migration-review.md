# [DB-001] Consumer 직원 호출 마스터 마이그레이션 검토

> 결론: 목표에 적합하며, 아래 적용 조건을 충족하면 개발 DB에 적용할 수 있다.
>
> DB 담당자는 DBeaver에서 사전 확인과 백업을 마친 뒤 전체 스크립트를 한 번에 실행하고, 백엔드/프론트엔드 담당자는 신규 스키마 기준 코드와 함께 smoke QA를 수행한다.

## 현상

- 기존 `consumer_staff_call`은 호출 항목마다 한 행을 저장한다.
- 물 1개와 냅킨 2개를 한 번에 호출해도 서로 다른 호출처럼 조회된다.
- 기존 행에는 테이블/방문 정보가 없어 어느 테이블의 한 번의 요청인지 복원할 수 없다.

## 원인

- 한 번의 호출 요청을 나타내는 상위 식별자가 없다.
- 읽음 상태와 호출 시각이 항목 행에 있어 요청 전체를 한 번에 처리하기 어렵다.
- 테이블 식별자와 방문 식별자가 저장되지 않는다.

## 결정 사항

### 확정

- `consumer_staff_call_master` 1행을 호출 요청 1건으로 사용한다.
- `consumer_staff_call` N행은 `link_sys_id`로 master를 참조한다.
- master에 `sys_plant_cd`, `table_sys_id`, `table_num`, `consumer_session_id`, `read_yn`, `insert_datetime`을 저장한다.
- `table_sys_id`는 테이블의 안정적인 식별자이고, `table_num`은 호출 당시 화면 표시용 스냅샷이다.
- 직원 호출은 주문 전에 가능하므로 `order_id` 대신 방문 단위 `consumer_session_id`를 사용한다.
- 항목별 수량은 child의 `quantity`에 저장하며 허용 범위는 1~99이다.
- 읽음 처리는 master 단위로 수행하므로 한 번의 호출에 포함된 항목이 함께 읽음 처리된다.
- 설정 코드는 매장 안에서 유일해야 하므로 `(sys_plant_cd, call_cd)` UNIQUE 제약을 추가한다.
- 기존 데이터는 테이블/방문 정보를 정확히 채울 수 없어 `consumer_staff_call_legacy_20260918`에 원형 보관하고 신규 목록에는 승계하지 않는다.

### 결정 필요

- 실행 전 기존 직원 호출이 새 화면에서 사라져도 되는지 확인한다. 개발용 테스트 데이터라면 보관 후 초기화하는 현재 방식이 적합하다.
- `public.table_info.sys_id`가 현재 DB에서 PK/UNIQUE이고 `varchar(36)`과 호환되는지 확인한다.
- 실행 계정에 `CREATE TABLE`, `ALTER TABLE`, `LOCK TABLE` 권한이 있는지 확인한다.

## 목표 대비 검토

| 목표 | 판정 | 근거 |
| --- | --- | --- |
| 한 번의 호출을 한 목록 행으로 표시 | 충족 | master 1행에 child N행을 연결한다. |
| 어느 테이블의 호출인지 구분 | 충족 | `table_sys_id`와 `table_num`을 master에 저장한다. |
| 여러 항목/수량 표현 | 충족 | child의 `call_cd`, `description`, `quantity`를 사용한다. |
| 미확인 배지 복원 | 충족 | master의 `read_yn`을 매장별로 조회한다. |
| 매장 간 데이터 격리 | 충족 | 조회/읽음 처리 조건에 `sys_plant_cd`를 함께 사용한다. |
| 기존 데이터 안전 보존 | 부분 충족 | 원본은 legacy 테이블에 보존되지만 신규 목록에는 나타나지 않는다. |

## 적용 전 중단 조건

다음 중 하나라도 해당하면 실행하지 않고 원인을 먼저 해결한다.

- `(sys_plant_cd, call_cd)`가 중복된 설정 행이 있다.
- `consumer_staff_call_legacy_20260918` 테이블이 이미 존재한다.
- `consumer_staff_call.link_sys_id`가 이미 존재한다.
- 외부 백업을 확보하지 못했다.
- 구 백엔드가 DB에 요청을 쓰는 중이다.
- 기존 미확인 호출을 새 목록에서도 유지해야 한다.

## DBeaver 적용 순서

1. 백엔드 인스턴스를 모두 중지해 직원 호출 쓰기를 막는다.
2. `consumer_staff_call`과 `consumer_staff_call_setting`을 DBeaver export 또는 DB 백업으로 별도 보관한다.
3. 아래 사전 확인 쿼리를 실행한다.

```sql
SELECT sys_plant_cd, call_cd, COUNT(*)
FROM public.consumer_staff_call_setting
GROUP BY sys_plant_cd, call_cd
HAVING COUNT(*) > 1;

SELECT COUNT(*) AS existing_call_count
FROM public.consumer_staff_call;

SELECT to_regclass('public.consumer_staff_call_legacy_20260918') AS legacy_table;

SELECT data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'table_info'
  AND column_name = 'sys_id';
```

4. 원본 SQL을 복사하고 마지막 `COMMIT`을 `ROLLBACK`으로 바꿔 전체 스크립트 dry-run을 수행한다.
5. 오류가 없으면 원본 SQL을 DBeaver의 스크립트 실행 기능으로 처음부터 끝까지 한 번에 실행한다.
6. SQL 파일의 적용 후 구조 확인 쿼리로 컬럼과 legacy 행 수를 확인한다.
7. 신규 백엔드를 배포하고 서비스를 시작한다.
8. Consumer에서 항목 2종을 한 번에 호출해 master 1행/child 2행이 생성되는지 확인한다.
9. Client에서 목록 1행/항목 2종/배지 1건이 보이는지 확인하고 읽음 처리 후 `read_yn = 'Y'`인지 확인한다.

## 롤백 기준

- `COMMIT` 전 오류는 PostgreSQL 트랜잭션이 전체 변경을 되돌린다.
- `COMMIT` 후 문제는 스크립트를 역방향으로 임의 수정하지 않고 외부 백업으로 복구한다.
- 구 백엔드/신규 DB와 신규 백엔드/구 DB는 서로 호환되지 않으므로 DB와 백엔드 전환을 같은 점검 시간에 수행한다.

## 요약

- 문제: 기존 구조는 여러 항목을 하나의 직원 호출로 묶거나 호출 테이블을 식별할 수 없다.
- 요청: 마스터 테이블을 추가하고 child를 연결하되 기존 데이터를 안전하게 보존한다.
- 목표: 요청 1건을 Client 목록 1행으로 표시하고, 테이블/방문/읽음 상태/항목 수량을 추적한다.
