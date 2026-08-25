---
title: Consumer 메뉴 옵션 계약은 실제 관계와 데이터 상태를 먼저 검증한다
date: 2026-08-24
category: workflow-issues
module: consumer-menu
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "기존 메뉴·옵션 테이블을 재사용해 Consumer 조회 API를 추가할 때"
  - "레거시 문자열을 공통 코드로 전환하면서 프론트와 백엔드를 함께 배포할 때"
  - "활성 데이터만 조회하는 API를 실제 DB로 QA할 때"
related_components:
  - "client-menu-option"
  - "consumer-menu-detail"
  - "mybatis"
tags:
  - "consumer-menu"
  - "option-group"
  - "api-contract"
  - "database-relation"
  - "rollout-order"
  - "tenant-isolation"
---

# Consumer 메뉴 옵션 계약은 실제 관계와 데이터 상태를 먼저 검증한다

## Context

Consumer 메뉴 상세 API는 기존 메뉴·옵션 테이블을 재사용한다. 이때 `store_menu_detail.link_sys_id2` 같은 연결 후보만 보고 관계를 추측하면 잘못된 JOIN을 만들기 쉽다. 실제 DB 확인 결과 이 프로젝트의 Consumer 상세 조회 관계는 다음과 같았다.

```text
store_menu_detail.sys_id
  → store_menu_option_group.link_sys_id
  → store_menu_option_detail.link_sys_id
```

동시에 옵션 선택 방식은 기존 한글값 `주문 옵션`, `수량 설정`에서 `01/02/03`으로 전환 중이었다. 실제 DB에는 구 값이 남아 있었고 Client 신규 옵션 그룹은 `use_yn='N'`으로 저장되어, Consumer의 활성 조건 조회에서는 옵션 목록이 비어 보였다.

## Guidance

Mapper를 구현하기 전에 DDL뿐 아니라 실제 연결 행과 기존 조회 SQL을 함께 확인한다. Consumer 상세 옵션 조회는 확인된 직접 관계를 사용하고 메뉴·그룹·항목 모두에 세션 사업장 조건과 사용·삭제 조건을 적용한다.

```sql
from store_menu_option_group smog
join store_menu_option_detail smod
  on smod.link_sys_id = smog.sys_id
 and smod.sys_plant_cd = smog.sys_plant_cd
where smog.link_sys_id = #{menuSysId}
  and smog.sys_plant_cd = #{sysPlantCd}
  and smog.use_yn = 'Y'
  and smog.delete_yn = 'N'
```

선택 방식 코드는 enum 대신 프로젝트 결정에 따라 문자열 상수를 사용하되, 허용값은 `01`, `02`, `03`으로 한 곳에서 관리한다. `주문 옵션`은 단일과 복수를 구분할 수 없으므로 자동 변환하지 않고 그룹별로 분류한다.

안전한 적용 순서는 다음과 같다.

1. 프론트가 코드값을 읽고 저장할 수 있도록 먼저 호환한다.
2. 기존 그룹을 검토해 `01/02/03`으로 변환한다.
3. Client 신규 등록의 활성 상태 저장 정책을 정비한다.
4. Consumer 상세 API를 배포하고 실제 활성 옵션으로 QA한다.
5. Swagger·Orval을 재생성해 응답 계약을 확인한다.

잘못된 선택 코드가 요청 시점에 발견되면 서버 로그에는 원인을 남기되, Consumer 응답에는 내부 예외 문구를 노출하지 않는다.

## Why This Matters

- 잘못된 관계를 사용하면 옵션이 누락되거나 다른 메뉴의 옵션이 연결된다.
- DB 변환을 먼저 하면 구 프론트가 새 코드값을 빈 값으로 다시 저장할 수 있다.
- `use_yn='N'` 저장 정책을 놓치면 API가 정상이어도 옵션이 없는 것처럼 보인다.
- 공통 예외 처리기가 내부 메시지를 `error`에 포함하므로 데이터 계약 오류를 그대로 전파하면 내부 상태가 노출된다.
- 단위 테스트만으로는 실제 관계, 코드값, 활성 상태를 증명할 수 없다.

## When to Apply

- 기존 스키마를 재사용하는 새 조회 API를 만들 때
- DB 코드값과 화면 선택값을 동시에 바꿀 때
- MyBatis JOIN 경로가 컬럼 이름만으로 명확하지 않을 때
- 사업장별 데이터 격리와 활성 조건이 필요한 Consumer API를 만들 때

## Examples

관계 검증에는 다음과 같이 실제 그룹과 메뉴 ID가 연결되는지 읽기 전용 SQL로 확인한다.

```sql
select
  smd.sys_id as menu_id,
  smog.link_sys_id as group_menu_id,
  smog.input_type,
  smog.use_yn
from store_menu_detail smd
join store_menu_option_group smog
  on smog.link_sys_id = smd.sys_id
where smd.delete_yn = 'N';
```

전환 전에는 남은 구 코드와 행 수를 확인한다.

```sql
select input_type, count(*)
from store_menu_option_group
where delete_yn = 'N'
group by input_type
order by input_type;
```

Consumer 실제 DB QA는 최소한 다음을 구분한다.

- 옵션 미사용 메뉴: `optionGroupList`가 빈 배열인지 확인
- 없는 메뉴: 동일 세션에서 404 후 QR 세션이 유지되는지 확인
- 옵션 사용 메뉴: 활성 그룹·항목과 `01/02/03` 정비 후 순서·최대 수량 확인

## Related

- [옵션 메뉴 캐시와 API 계약 전환](../integration-issues/option-menu-cache-not-invalidated-after-menu-crud-2026-07-28.md)
- [Q&A FormData 계약 검증](../integration-issues/qna-update-modelattribute-formdata-contract-2026-07-31.md)
