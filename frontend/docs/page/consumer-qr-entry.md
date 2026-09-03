# Consumer QR 진입 화면 규약

> 경로: `/qr/:url`
> 화면: Consumer > QR 인증(로딩·실패)

테이블 QR을 스캔해 처음 들어오는 화면이다. 성공하면 `/consumer/order`로 이동하고, 실패하면 이 경로에 머무르며 상태 화면을 보여준다.

## 상태 머신

`useQrEntryPage`(`apps/consumer/features/qr/hooks/useQrEntryPage.ts`)가 `{ status, message, retry, previewTableInfo }`를 반환한다.

| status | 의미 | 렌더링 |
|---|---|---|
| `checking` | 인증 진행 중 | `QrLoadingScreen` |
| `invalid` | QR 자체가 유효하지 않음(HTTP 4xx) | `ConsumerStatusScreen` (`ci-qr-code`), 재시도 버튼 없음 |
| `network-error` | 통신 실패(4xx가 아닌 나머지: 5xx, 네트워크 오류, abort) | `ConsumerStatusScreen` (`ci-alert-triangle`, `tone="danger"`), 재시도 버튼 있음 |

무효 QR과 통신 오류를 분리하는 기준은 `HttpError`(`shared/lib/httpClient.ts`)의 `status` 필드다: `error instanceof HttpError && status`가 4xx면 `invalid`(다시 시도해도 같은 QR이 유효해지지 않으므로 재시도 버튼을 주지 않음), 그 외는 `network-error`(같은 요청을 다시 시도하면 성공할 수 있으므로 `retry()` 제공)로 분류한다. 이 판단 기준 자체는 mock이 아니라 실제 HTTP 관례를 그대로 읽는 것이라, `QR_CONNECT_MOCK_ENABLED`를 꺼도(실 API 연동 후에도) 그대로 유지된다.

## mock 경계: `QR_CONNECT_MOCK_ENABLED`

`useQrEntryPage.ts` 상단의 `QR_CONNECT_MOCK_ENABLED = true` 플래그가 `qrConnectStub`(mock)과 `connectQr`(`features/qr/api/qrConnectApi.ts`, 실제 API 호출 코드)를 가른다. 실제 호출 코드는 지우지 않고 남겨뒀다 — 백엔드 세션/QR 파라미터가 확정되면 플래그만 끄면 된다. 패턴 자체의 근거는 [`decisions.md` ADR-021](../decisions.md#adr-021--consumer-골격-단계의-mock-경계-원칙) 참고.

`qrConnectStub.ts`가 갖는 고정 테이블 맵:

```
qr-code-001 → table-001 (테이블 1)
qr-code-002 → table-002 (테이블 2)
qr-code-003 → table-003 (테이블 3)
qr-code-004 → table-004 (테이블 4)
```

목록에 없는 `:url`은 `invalid`로 분류된다. 지연 시간은 `MOCK_LOADING_DELAY_MS = 5000`(5초) — 로딩 화면 자체를 눈으로 확인할 수 있도록 일부러 짧지 않게 잡았다. 실제 API 응답 속도를 흉내내는 값이 아니므로 실 연동 시 의미 없어진다.

## 로딩 화면 구성

`QrLoadingScreen`(`apps/consumer/features/qr/components/QrLoadingScreen.tsx`)은 공용 `AppLoadingScreen`(`shared/components/loading` — 블롭 장식, 브랜드 로고 행, 애니메이션 점 인디케이터)을 감싸고, `children`으로 **매장명**과 테이블 카드(있으면)만 얹는다. 브랜드 로고·인디케이터 자체는 앱 루트(`AppRoutes.tsx`)의 인증 로딩 화면과 같은 컴포넌트를 공유한다 — 자세한 배경은 [`decisions.md` ADR-029](../decisions.md#adr-029--앱-루트-로딩-화면을-apploadingscreen공용으로-통일한다) 참고.

- 매장명은 `apps/consumer/features/session/api/consumerSessionApi.ts`의 `MOCK_STORE_NAME`(`'맛나분식'`) 상수를 그대로 쓴다 — 세션 API가 없는 지금 단계에서 로딩 중에도 매장명이 보이도록 하기 위한 임시 값이며, 실제로는 QR 자체(또는 이후 세션 조회)가 매장 식별 정보를 담아야 한다.
- 테이블 카드는 `previewTableInfo(url)`(`qrConnectStub.ts`)이 돌려주는 값으로 채운다 — 인증 응답을 기다리지 않고 URL만으로 미리 보여주는 것이므로, 실제 API에서는 이 프리뷰 자체가 유지될지 별도 논의가 필요하다.
- `prefers-reduced-motion: reduce`에서는 점 인디케이터의 bounce·페이드인 애니메이션을 끈다(`AppLoadingScreen.css`).

## 성공 시 이전 세션 캐시 격리

인증 성공 후 `/consumer/order`로 `navigate`하기 전에 `queryClient.removeQueries({ queryKey: ['consumer'] })`를 호출한다. 같은 브라우저로 QR을 다시 스캔해 다른 테이블로 들어올 때 이전 테이블의 캐시된 세션·메뉴 데이터가 잠깐이라도 보이는 걸 막기 위함이다 — mock이 아니라 실제로 동작하는 로직이다.

## `ConsumerSessionGuard`와의 관계

이 화면은 `ConsumerSessionGuard`(`apps/consumer/routes/ConsumerSessionGuard.tsx`) 진입 **이전** 단계다. 가드는 `/consumer/*` 하위 라우트에서 세션 상태(`active`/`expired`/`closed`/`none`)를 판정하는 별도 로직이고, 지금은 `SESSION_GUARD_ENABLED = false`로 항상 통과시킨다. QR 인증 실패(`invalid`/`network-error`)와 세션 만료/마감은 서로 다른 원인이라 같은 `ConsumerStatusScreen` 컴포넌트를 공유하되 상태 판단 로직은 분리돼 있다 — 자세한 설계 근거는 [`decisions.md` ADR-020](../decisions.md#adr-020--consumer-앱-골격-뷰포트-반응형과-qr-세션-가드) 참고.
