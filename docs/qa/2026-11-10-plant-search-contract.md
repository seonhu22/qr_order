# 사업장 조회 계약 점검

## 근거와 변경 이유

- [Plant DTO](../../qrorder/src/main/java/htms/QROrder/system/domain/Plant.java)와 [생성 타입](../../frontend/src/generated/types/plant.ts)에 `empNm`이 있지만 [화면 매퍼](../../frontend/src/apps/admin/features/plant-search/api/plantSearchApi.ts)는 대표자명을 `-`로 고정했다. 기존 필드를 연결했다.
- 같은 매퍼는 사업장 코드 첫 글자로 `localhost:9090` 링크를 만들었다. 실제 접속 URL 계약이 없으므로 링크를 생성하지 않고 `-`로 표시한다.
- 담당자명도 API 계약이 없어 `-`를 유지한다. 대표자명과 동일하다고 가정하지 않는다.

## 회원가입에서 조회까지 확인

| 입력/계약 | 저장 | 사업장 조회 |
| --- | --- | --- |
| 사업자 등록번호 `businessNo` → `businessRegiNum` | `sys_plant.plant_cd/reg_num` | `plantCd` |
| 대표자명 `businessRepName` → `userNm` | `sys_plant.emp_nm` | `empNm` → 대표자명 |
| 이메일 `email` | `sys_user.email` | `sys_plant.email_url` 조회로 서로 다른 저장 대상 |
| 개업일 `openDate` → `businessRegiDate` | 사업자 인증에 사용, 가입 INSERT에는 없음 | 조회 필드 없음 |
| `plantNm` | 우회 가입만 대표자명+컴퍼니 생성 | 일반 가입에는 입력/생성 경로 없음 |
| 상호/우편번호/주소/전화 | 현재 가입 화면 입력 없음 | 기존 사업장 데이터 조회 |

근거: [가입 UI](../../frontend/src/apps/client/features/signup/components/SignupBusinessForm.tsx), [요청 매퍼](../../frontend/src/apps/client/features/signup/api/signupNewUserApi.ts), [가입 DTO](../../qrorder/src/main/java/htms/QROrder/auth/dto/SignUpRequest.java), [가입 SQL](../../qrorder/src/main/resources/mapper/auth/SignUpMapper.xml), [사업장 조회 SQL](../../qrorder/src/main/resources/mapper/system/PlantMapper.xml).

사업장 이메일과 사용자 이메일은 저장 대상이 달라 임의로 동기화하지 않았다. 일반 가입의 사업장명 수집 방식과 사업장 이메일의 의미는 기존 계약 확인이 필요하다. 개업일 영속 저장이나 신규 가입 필드 추가도 이번 변경에 포함하지 않는다.

## 검증

- 수정 전 회귀 테스트: 2개 중 1개 실패. 대표자명 누락과 허위 URL 생성 재현.
- 수정 후 `npm run test -- src/apps/admin/features/plant-search src/apps/client/features/signup/api/signupNewUserApi.test.ts`: 4개 파일/16개 테스트 통과.
- [회귀 테스트](../../frontend/src/apps/admin/features/plant-search/api/plantSearchApi.test.ts)는 생성 Plant 계약을 기준으로 대표자명, 누락값, URL 미생성을 검증한다.

## 영향 경계

| 경계 | 상태 |
| --- | --- |
| DB/영속 매퍼/백엔드 DTO/OpenAPI 생성 타입 | 기존 계약 읽기 확인 / 변경 없음 |
| 프론트 모델/응답 매퍼 | 수정 / 테스트 검증 |
| 요청 매퍼/전송 직렬화 | 변경 없음 / 가입 매퍼 기존 테스트 통과 |
| DB 기반 가입/조회 성공 | 미검증 |
| dev:real 수동 QA | 일괄 QA 대기 |

수동 QA: 관리자 사업장 조회에서 기존 `emp_nm`과 대표자명 표시 일치 확인 / 담당자명과 접속 URL `-` 확인. 신규 가입 검증은 테스트 사업자 데이터 확보 후 진행한다.
