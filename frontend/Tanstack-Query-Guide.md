# TanStack Query 학습 가이드

## 1. 문서 목적

본 문서는 QR Order 프론트엔드에 TanStack Query를 처음 도입하는 개발자를 위한 학습 가이드이다.  
목표는 단순히 라이브러리 사용법을 나열하는 것이 아니라, 현재 저장소의 코드 상태를 **커밋 단위로 쌓아 올라가며 이해하는 것**이다.

즉, 이 문서는 다음 질문에 답하도록 구성한다.

- 왜 TanStack Query를 도입하는가
- 왜 MSW를 먼저 준비하는가
- QueryClient는 무엇이며 왜 필요한가
- Provider는 왜 App 최상단에서 연결하는가
- `useQuery`는 어떤 원리로 동작하는가
- 현재 코드가 어떤 순서로 실행되는가

이 가이드는 초보 개발자가 다음 두 가지를 동시에 얻는 것을 목표로 한다.

1. 커밋 이력을 보며 학습할 수 있는 구조
2. 현재 코드가 왜 이런 모양이 되었는지 이해할 수 있는 설명

---

## 2. 이 가이드를 읽는 방법

이 문서는 “최종 완성 코드 설명서”가 아니다.  
오히려 아래처럼 **점진적으로 기초를 쌓는 방식**으로 읽어야 한다.

1. 먼저 서버 상태와 UI 상태의 차이를 이해한다.
2. 그 다음 MSW로 응답을 먼저 고정한다.
3. QueryClient를 만든다.
4. QueryClientProvider를 App에 연결한다.
5. API 함수를 분리한다.
6. `useQuery`를 사용하는 첫 컴포넌트를 만든다.
7. 페이지에 붙여 실제로 동작을 확인한다.

즉, 코드는 아래 질문에 대한 답으로 쌓인다.

- “무엇을 조회할 것인가”
- “그 조회를 누가 관리할 것인가”
- “그 결과를 어디에 저장할 것인가”
- “그 결과를 화면에서 어떻게 사용할 것인가”

---

## 3. 서버 상태와 UI 상태를 먼저 구분하기

TanStack Query를 이해하기 전에 가장 먼저 알아야 할 개념은 **서버 상태(server state)** 와 **UI 상태(client/UI state)** 의 차이이다.

### 3.1 UI 상태란 무엇인가

UI 상태는 화면 내부에서만 의미가 있는 상태이다.

예시:

- 모달이 열려 있는가
- 현재 선택한 탭은 무엇인가
- 사이드바가 펼쳐져 있는가
- 검색어 input에 무엇을 입력 중인가

이런 값은 서버에서 받아오는 데이터가 아니라 화면 동작을 위해 필요한 값이다.

### 3.2 서버 상태란 무엇인가

서버 상태는 백엔드에서 조회해 온 데이터이다.

예시:

- 사업장 목록
- 로그인 사용자 정보
- 공통코드 목록
- 메시지 목록

이 데이터는 프론트가 스스로 만들어내는 값이 아니라 서버에서 받아와야 하며, 다음 특징을 가진다.

- 비동기 요청이 필요하다.
- 로딩 상태가 있다.
- 실패 가능성이 있다.
- 같은 데이터를 여러 화면에서 다시 사용할 수 있다.
- 캐싱 전략이 필요할 수 있다.

### 3.3 왜 분리해야 하는가

초보자가 자주 하는 패턴은 아래와 같다.

```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

이 방식은 처음에는 단순해 보이지만, 화면이 많아질수록 아래 문제가 생긴다.

- 로딩 처리 코드가 반복된다.
- 오류 처리 코드가 반복된다.
- 같은 데이터를 다시 요청하게 된다.
- 새로고침 타이밍이 제각각이 된다.
- “언제 다시 조회할 것인가” 기준이 화면마다 달라진다.

TanStack Query는 바로 이 문제를 해결하기 위해 사용한다.

---

## 4. TanStack Query가 해결하려는 문제

TanStack Query는 **서버 상태를 위한 전용 관리 도구**이다.

핵심 역할은 다음과 같다.

- 조회 결과를 캐시에 저장한다.
- 로딩 상태를 관리한다.
- 오류 상태를 관리한다.
- 필요할 때 다시 조회한다.
- 같은 조회를 여러 곳에서 재사용할 수 있게 한다.

즉, 이 도구는 “서버에서 가져온 데이터를 안전하고 일관되게 다루기 위한 관리자”라고 이해하면 된다.

---

## 5. 왜 MSW를 먼저 준비하는가

초보 개발자가 TanStack Query를 처음 학습할 때 가장 큰 혼란은 이것이다.

- 지금 문제가 Query 개념 문제인지
- 백엔드 응답 구조 문제인지
- CORS/세션/인증 문제인지

이 세 가지가 한 번에 섞이면 학습이 매우 어려워진다.

그래서 먼저 **MSW로 응답을 고정**한다.

MSW를 먼저 쓰는 이유는 다음과 같다.

- 응답 형태를 먼저 확정할 수 있다.
- 실제 백엔드 상태와 무관하게 프론트 흐름을 학습할 수 있다.
- 로딩/실패/성공 시나리오를 쉽게 재현할 수 있다.
- 테스트 작성이 쉬워진다.

즉, MSW는 TanStack Query를 배우기 전에 “데이터가 들어오는 환경을 통제”하기 위한 도구이다.

---

## 6. MSW 기초 개념

현재 프로젝트에는 `[handlers.js](.../qr_order/frontend/src/test/handlers.js)`가 존재한다.

이 파일은 “테스트나 mock 환경에서 어떤 요청이 들어왔을 때 어떤 응답을 줄 것인가”를 정의한다.

### 6.1 `http.get`, `http.post`

예를 들어:

```js
http.get('/api/system/settings/plant/search', () => {
  return HttpResponse.json([...]);
})
```

이 코드는 다음 의미를 가진다.

- 브라우저 또는 테스트 코드가 `/api/system/settings/plant/search`로 GET 요청을 보내면
- 실제 서버로 가지 않고
- 여기서 정의한 JSON을 응답으로 돌려준다

즉, 간단한 모의 서버 라우팅을 작성한다고 생각하면 된다.

### 6.2 `HttpResponse.json()`

이 함수는 JSON 응답을 만들어 준다.

예시:

```js
return HttpResponse.json([{ plantCd: 'SEOUL', plantNm: '서울점', useYn: 'Y' }]);
```

의미:

- 서버가 JSON 바디를 응답했다고 가정한다.
- 프론트는 실제 API 응답처럼 이 데이터를 받게 된다.

### 6.3 왜 `fetch`를 직접 mock하지 않는가

물론 테스트에서 `fetch = vi.fn()`처럼 직접 mock할 수도 있다.  
하지만 이 방식은 요청 URL, 메서드, 응답 흐름이 실제 네트워크 구조와 멀어지기 쉽다.

MSW를 쓰면 다음 이점이 있다.

- 실제 요청 URL 기반으로 동작한다.
- `fetch` 호출 구조를 유지할 수 있다.
- 테스트와 실제 코드의 거리감이 줄어든다.

즉, 초보자가 “나중에 실제 서버 붙었을 때도 비슷하게 동작한다”는 감각을 익히기 좋다.

---

## 7. 1단계 커밋: MSW 핸들러로 응답 먼저 정의하기

첫 단계는 TanStack Query를 넣는 것이 아니다.  
먼저 “사업장 조회 API가 무엇을 반환하는가”를 고정하는 것이다.

현재 예시 응답은 아래와 같다.

```js
[
  { plantCd: 'SEOUL', plantNm: '서울점', useYn: 'Y' },
  { plantCd: 'BUSAN', plantNm: '부산점', useYn: 'Y' },
  { plantCd: 'JEJU', plantNm: '제주점', useYn: 'N' },
];
```

이 커밋에서 학습해야 할 포인트는 다음이다.

- 프론트는 먼저 “무슨 데이터를 받을 것인가”를 정리해야 한다.
- 화면보다 응답 구조가 먼저 정리되어야 한다.
- 조회 흐름을 만들기 전에 성공 응답 모양을 고정하면 이후 단계가 쉬워진다.

추천 커밋 메시지 예시:

```text
test: 사업장 조회용 MSW 핸들러 추가
```

### 7.1 실습 체크포인트

- `[handlers.js](...qr_order/frontend/src/test/handlers.js)`에 사업장 조회용 `http.get()` 핸들러가 있는지 확인한다.
- 응답 데이터가 배열 형태인지 확인한다.
- 응답 객체에 `plantCd`, `plantNm`, `useYn` 필드가 들어 있는지 확인한다.
- “이 응답을 실제 서버가 아니라 mock이 대신 돌려준다”는 점을 말로 설명해본다.

---

## 8. Query란 무엇인가

TanStack Query에서 `Query`는 아주 단순하게 말하면 **조회 작업**이다.

예시:

- 사업장 목록 조회
- 로그인 사용자 정보 조회
- 공통코드 조회

중요한 점은 Query가 “단순 함수”가 아니라는 것이다.  
Query는 보통 아래 정보와 함께 이해해야 한다.

- 무엇을 조회하는가
- 어떤 키로 구분하는가
- 어떤 함수로 가져오는가
- 그 결과를 캐시에 얼마나 유지할 것인가

즉, Query는 “조회 요청 + 결과 + 상태 + 캐시 전략”이 묶인 단위라고 보면 된다.

---

## 9. QueryClient란 무엇인가

초보자가 가장 먼저 헷갈리는 이름이 바로 `QueryClient`이다.

### 9.1 왜 이름이 QueryClient인가

이름을 직역하면 “조회(Query)를 다루는 클라이언트(Client)”이다.

여기서 `Client`는 브라우저 안에서 동작하는 관리자 객체라고 이해하면 된다.  
즉, QueryClient는 다음 일을 담당한다.

- 어떤 query가 있는지 기억한다.
- 어떤 결과가 캐시에 들어 있는지 기억한다.
- 다시 조회가 필요한지 판단한다.
- 재조회, 무효화, 캐시 삭제 등을 관리한다.

쉽게 말하면:

- `Query` = 개별 조회 작업
- `QueryClient` = 그 조회 작업들을 총괄 관리하는 관리자

### 9.2 왜 하나만 두는가

앱 전체에서 `QueryClient`를 공유해야 하는 이유는 다음과 같다.

- 같은 query를 여러 화면에서 공유할 수 있다.
- 캐시 정책이 통일된다.
- 재조회 기준이 통일된다.
- invalidate, refetch 같은 동작이 한 체계 안에서 작동한다.

각 화면마다 새 QueryClient를 만들면 캐시가 흩어지고, TanStack Query를 쓰는 장점이 크게 줄어든다.

---

## 10. 2단계 커밋: `queryClient` 생성하기

현재 프로젝트에는 `[queryClient.js](.../qr_order/frontend/src/shared/lib/queryClient.js)`가 있다.

이 파일은 앱 전체에서 공통으로 사용할 QueryClient 인스턴스를 만든다.

예시 개념은 아래와 같다.

```js
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 10.1 각 옵션의 의미

- `retry: 1`
  - 실패 시 한 번만 재시도한다.
- `staleTime: 60 * 1000`
  - 조회 결과를 1분 동안 fresh 하다고 본다.
- `refetchOnWindowFocus: false`
  - 브라우저 탭으로 돌아왔을 때 자동 재조회를 막는다.

초보자 관점에서는 “왜 여기서 이런 값을 정하는가”가 중요하다.  
이 파일에 공통 정책을 넣어두면 화면마다 따로 고민하지 않아도 되기 때문이다.

추천 커밋 메시지 예시:

```text
feat: TanStack Query 공통 QueryClient 설정 추가
```

### 10.2 실습 체크포인트

- `[queryClient.js](...qr_order/frontend/src/shared/lib/queryClient.js)`에서 `new QueryClient()`가 생성되는지 확인한다.
- `queries.defaultOptions`에 `retry`, `staleTime`, `refetchOnWindowFocus`가 들어 있는지 확인한다.
- 왜 이 파일을 화면 안이 아니라 `shared/lib`에 두는지 설명해본다.
- “QueryClient는 개별 query가 아니라 query 전체를 관리하는 관리자”라고 스스로 정리해본다.

---

## 11. QueryClientProvider란 무엇인가

`QueryClientProvider`는 React 앱 전체에 QueryClient를 공급하는 Provider이다.

즉, 이 Provider로 감싸야 아래 훅들이 동작한다.

- `useQuery`
- `useMutation`
- `useQueryClient`

이것은 React Router의 `BrowserRouter`와 비슷하게 이해하면 쉽다.

- `BrowserRouter`가 라우팅 기능을 앱 전체에 공급하듯
- `QueryClientProvider`는 서버 상태 관리 기능을 앱 전체에 공급한다

---

## 12. 3단계 커밋: App 최상단에 Provider 연결하기

현재 프로젝트의 `[App.jsx](...qr_order/frontend/src/App.jsx)`는 아래 구조로 되어 있다.

```jsx
<BrowserRouter>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </QueryClientProvider>
</BrowserRouter>
```

여기서 이해해야 할 핵심은 다음과 같다.

- App 전체에서 TanStack Query를 사용할 수 있게 됨
- 화면마다 Provider를 중복 선언할 필요가 없음
- QueryClient가 앱 전체에서 공유됨

추천 커밋 메시지 예시:

```text
feat: App 루트에 QueryClientProvider 연결
```

### 12.1 실습 체크포인트

- `[App.jsx](...qr_order/frontend/src/App.jsx)`에 `QueryClientProvider`가 있는지 확인한다.
- `client={queryClient}`로 연결되어 있는지 확인한다.
- `BrowserRouter`와 `QueryClientProvider`의 역할 차이를 한 문장으로 설명해본다.
- Provider가 없으면 `useQuery`가 왜 동작하지 않는지 스스로 설명해본다.

---

## 13. 왜 API 함수를 먼저 분리하는가

TanStack Query를 처음 쓰는 초보자가 많이 하는 실수는 컴포넌트 안에 직접 `fetch`를 쓰는 것이다.

예:

```jsx
useQuery({
  queryKey: ['plants'],
  queryFn: async () => {
    const res = await fetch('/api/system/settings/plant/search');
    return res.json();
  },
});
```

이 방식은 당장은 가능하지만, 다음 문제가 생긴다.

- API 경로가 화면 파일 안에 흩어진다.
- 에러 처리 방식이 통일되지 않는다.
- 테스트와 재사용이 어렵다.
- 같은 API를 다른 곳에서 다시 쓰기 어렵다.

그래서 API 함수는 `shared/api`에 분리한다.

즉:

- 컴포넌트는 “언제 조회할지”를 결정
- API 함수는 “어떻게 요청할지”를 담당

---

## 14. 4단계 커밋: 사업장 조회 API 함수 만들기

현재 프로젝트의 `[plant.js](...qr_order/frontend/src/shared/api/plant.js)`는 사업장 조회 함수를 제공한다.

핵심 흐름은 다음과 같다.

1. 검색어가 있으면 query string을 만든다.
2. `/api/system/settings/plant/search`로 요청한다.
3. 응답이 실패하면 Error를 던진다.
4. JSON을 읽는다.
5. 배열이 아니면 빈 배열로 안전하게 처리한다.

이 커밋에서 봐야 할 포인트는 다음이다.

- TanStack Query의 `queryFn`은 API 계층 함수를 호출해야 한다.
- 실패 시 `throw`해야 `useQuery`가 오류 상태를 인식한다.
- 컴포넌트는 API 세부 구현보다 결과 상태에 집중해야 한다.

추천 커밋 메시지 예시:

```text
feat: 사업장 조회용 API 함수 분리
```

### 14.1 실습 체크포인트

- `[plant.js](...qr_order/frontend/src/shared/api/plant.js)`가 `fetch`를 직접 수행하는지 확인한다.
- 응답 실패 시 `throw new Error(...)` 형태로 오류를 던지는지 확인한다.
- 컴포넌트에서 직접 `fetch`하지 않고 API 함수를 호출하는 이유를 설명해본다.
- 검색어가 들어가면 이 함수에 어떤 식으로 파라미터를 확장할지 상상해본다.

---

## 15. `useQuery`를 처음 이해하기

이제 실제로 TanStack Query를 사용하는 핵심 훅이 `useQuery`이다.

현재 예시 컴포넌트는 `[PlantListPreview.jsx](...qr_order/frontend/src/apps/admin/features/plant/components/PlantListPreview.jsx)`이다.

핵심 코드는 다음과 같은 구조이다.

```jsx
const {
  data: plants = [],
  error,
  isError,
  isPending,
  refetch,
} = useQuery({
  queryKey: ['plants', 'preview'],
  queryFn: () => fetchPlantSummaries(),
});
```

### 15.1 `queryKey`

`queryKey`는 이 조회를 식별하는 이름표이다.

```js
['plants', 'preview'];
```

이 키가 중요한 이유는 다음과 같다.

- 캐시를 구분한다.
- 다시 조회할 대상을 구분한다.
- 조건이 달라지면 다른 query로 인식한다.

예를 들어 검색어가 들어가면 나중에는 이렇게 확장될 수 있다.

```js
['plants', 'list', searchKeyword];
```

### 15.2 `queryFn`

`queryFn`은 실제 조회 함수이다.

여기서는 직접 `fetch`하지 않고:

```js
() => fetchPlantSummaries();
```

처럼 API 계층 함수를 호출한다.

### 15.3 반환값

`useQuery`는 여러 상태를 함께 돌려준다.

- `data`
  - 조회 성공 데이터
- `isPending`
  - 현재 로딩 중인지 여부
- `isError`
  - 오류 상태인지 여부
- `error`
  - 오류 객체
- `refetch`
  - 수동 재조회 함수

즉, `useState`, `useEffect`, `error handling`, `retry`, `cache`를 각각 직접 작성하던 패턴을 하나의 훅으로 묶어 제공한다고 이해하면 된다.

---

## 16. 5단계 커밋: 첫 TanStack Query 컴포넌트 만들기

현재 프로젝트에서 첫 예시 컴포넌트는 `PlantListPreview`이다.

이 컴포넌트는 다음 상태를 모두 처리한다.

1. 로딩 중
2. 오류 발생
3. 데이터 없음
4. 정상 목록 표시

초보자가 반드시 익혀야 하는 점은 다음이다.

- 조회 컴포넌트는 성공 상태만 그리면 안 된다.
- 로딩, 실패, 빈 상태를 먼저 정리해야 한다.
- 화면에서 서버 상태를 다시 `useState`로 복사하지 않는다.

추천 커밋 메시지 예시:

```text
feat: 사업장 조회 예시용 useQuery 컴포넌트 추가
```

### 16.1 실습 체크포인트

- `[PlantListPreview.jsx](...qr_order/frontend/src/apps/admin/features/plant/components/PlantListPreview.jsx)`에서 `useQuery`를 찾는다.
- `queryKey`와 `queryFn`이 각각 무엇을 의미하는지 말로 설명해본다.
- `isPending`, `isError`, `data`가 각각 어떤 UI 분기를 만들고 있는지 확인한다.
- `refetch()`가 어떤 상황에서 필요한지 생각해본다.

---

## 17. 6단계 커밋: 페이지에 연결하기

마지막 단계는 이 컴포넌트를 페이지에 실제로 연결하는 것이다.

현재 `[PlantPage.jsx](...qr_order/frontend/src/apps/admin/pages/system/PlantPage.jsx)`는 `PlantListPreview`를 렌더링한다.

이 단계의 목적은 단순하다.

- Query Client가 실제로 연결되었는지 확인
- 라우트 진입 시 조회가 실행되는지 확인
- 화면에 결과가 표시되는지 확인

즉, 이 단계에서 “이제 TanStack Query가 앱 안에서 실제로 움직인다”는 감각을 익히게 된다.

추천 커밋 메시지 예시:

```text
feat: 사업장 관리 페이지에 조회 예시 컴포넌트 연결
```

### 17.1 실습 체크포인트

- `[PlantPage.jsx](...qr_order/frontend/src/apps/admin/pages/system/PlantPage.jsx)`에 `PlantListPreview`가 연결되어 있는지 확인한다.
- 화면 진입 시 자동으로 조회가 시작되는 이유를 설명해본다.
- 로컬에서 페이지를 열었을 때 로딩, 성공, 실패 중 어떤 상태가 먼저 보이는지 관찰한다.
- “페이지는 조립만 하고, 실제 조회 로직은 feature 컴포넌트가 가진다”는 구조를 이해한다.

---

## 18. 현재 코드가 실제로 동작하는 순서

현재 프로젝트는 아래 순서로 동작한다.

1. 앱이 시작된다.
2. `App.jsx`에서 `QueryClientProvider`가 QueryClient를 공급한다.
3. 사용자가 사업장 관리 페이지에 진입한다.
4. `PlantListPreview`가 렌더링된다.
5. `useQuery`가 `queryKey`와 `queryFn`을 등록한다.
6. TanStack Query는 캐시에 이 key가 있는지 확인한다.
7. 없거나 stale 상태면 `fetchPlantSummaries()`를 실행한다.
8. 이 함수는 `/api/system/settings/plant/search`를 요청한다.
9. 테스트 또는 mock 환경에서는 MSW가 응답을 돌려준다.
10. TanStack Query는 결과를 캐시에 저장한다.
11. 컴포넌트는 `data`를 받아 목록을 렌더링한다.

이 흐름을 이해하면, TanStack Query가 단순한 fetch wrapper가 아니라  
**조회 상태와 캐시를 함께 관리하는 계층**이라는 점이 보인다.

---

## 19. 캐시는 어떻게 이해하면 되는가

캐시는 “이미 조회한 결과를 일정 시간 기억해 두는 저장소”이다.

현재 예시에서는:

- 같은 `queryKey`를 다시 사용하면
- TanStack Query는 먼저 캐시를 확인한다.

이때 `staleTime` 안에 있으면 다음과 같은 이점이 있다.

- 불필요한 재요청을 줄일 수 있다.
- 사용자 입장에서 화면이 더 빠르게 보일 수 있다.
- 여러 컴포넌트가 같은 데이터를 공유할 수 있다.

즉, TanStack Query는 “조회한 데이터를 저장해 두고 다시 활용하는 체계”를 기본 제공한다.

---

## 20. 초보자가 처음 TanStack Query를 쓸 때 지켜야 할 규칙

### 20.1 queryKey는 항상 의미 있게 작성한다

나쁜 예:

```js
['data'];
```

좋은 예:

```js
['plants', 'preview'];
['plants', 'list', searchKeyword];
['commonCodes', 'master', searchKeyword];
```

### 20.2 queryFn은 API 계층 함수만 호출한다

컴포넌트 안에서 직접 `fetch`를 남발하지 않는다.

### 20.3 로딩/오류/빈 상태를 반드시 분리한다

서버 조회 화면은 성공 상태만 있는 것이 아니다.

### 20.4 서버 상태를 다시 `useState`에 복사하지 않는다

`useQuery`에서 받은 `data`를 또 `const [list, setList] = useState(data)`처럼 복사하면  
TanStack Query를 쓰는 이점이 줄어든다.

### 20.5 저장/수정/삭제는 나중에 `useMutation`으로 분리한다

조회는 `useQuery`, 저장 계열은 `useMutation`으로 역할을 나누는 것이 기본 원칙이다.

---

## 21. 다음 단계는 무엇인가

현재 코드는 “조회 예시”까지 구축된 상태이다.  
다음 단계는 아래 순서로 확장하면 된다.

1. 검색어 상태 추가
2. queryKey에 검색어 반영
3. 실제 검색 form 연결
4. `useMutation`으로 저장/수정/삭제 추가
5. 저장 후 invalidate로 목록 재조회 연결

즉, 지금 단계는 “서버 상태 관리의 시작점”이며, 이후 관리자형 CRUD 화면으로 확장할 수 있는 기초를 만든 것이다.

### 21.1 실습 체크포인트

- `queryKey`에 검색 조건을 추가하면 캐시가 어떻게 분리될지 생각해본다.
- 조회와 저장을 같은 훅으로 처리하지 않는 이유를 설명해본다.
- “목록 조회 -> 저장 -> invalidate -> 목록 재조회” 흐름을 말로 그려본다.

---

## 22. 다음 단계: useMutation 기초 이해

지금까지는 조회를 담당하는 `useQuery`만 사용했다.  
하지만 실제 관리자 화면은 조회만으로 끝나지 않는다. 저장, 수정, 삭제가 반드시 필요하다.

이때 사용하는 훅이 `useMutation`이다.

### 22.1 `useMutation`은 무엇인가

`useMutation`은 생성, 수정, 삭제처럼 서버 데이터를 바꾸는 작업을 담당한다.

예시:

- 공통코드 신규 등록
- 사업장 정보 수정
- 메시지 삭제
- 규칙 저장

즉:

- `useQuery` = 읽기
- `useMutation` = 쓰기

### 22.2 왜 조회와 저장을 분리하는가

조회와 저장은 성격이 다르다.

- 조회는 캐싱이 중요하다.
- 저장은 성공/실패 처리와 후속 갱신이 중요하다.

그래서 TanStack Query는 읽기와 쓰기를 서로 다른 훅으로 나눈다.

### 22.3 저장 후 왜 invalidate가 필요한가

예를 들어 사업장 저장이 성공했으면, 기존 사업장 목록 캐시는 이제 오래된 데이터가 될 수 있다.  
이때 관련 query를 무효화(invalidate)하면 TanStack Query가 해당 목록을 다시 조회하게 할 수 있다.

이 흐름은 보통 아래 순서로 이해하면 된다.

1. `useMutation`으로 저장 요청 수행
2. 저장 성공
3. `queryClient.invalidateQueries(...)` 호출
4. 목록 query 재조회
5. 화면 최신화

### 22.4 useMutation 후속 학습 루트

TanStack Query 학습의 다음 단계는 아래 순서를 권장한다.

1. 간단한 저장 API 함수 작성
2. `useMutation`으로 저장 버튼 연결
3. 성공/실패 메시지 분기
4. 저장 성공 후 `invalidateQueries` 연결
5. 목록 query와 mutation을 하나의 화면에서 연결
6. `newItems`, `delItems`, `updateItems` 구조와 mutation payload 연결

즉, 현재 문서가 조회 편이라면 다음 학습 문서는 “mutation과 invalidate를 이용한 CRUD 편”으로 이어지는 것이 가장 자연스럽다.

---

## 23. 커밋 순서 요약

이 가이드는 아래 순서로 커밋을 쌓으며 학습하는 것을 권장한다.

1. MSW 핸들러 추가
2. QueryClient 생성
3. QueryClientProvider 연결
4. API 함수 분리
5. 첫 `useQuery` 컴포넌트 추가
6. 페이지 연결

이 순서를 지키면 초보자도 다음 흐름으로 이해할 수 있다.

- 먼저 응답을 고정하고
- 그 다음 조회 관리자(QueryClient)를 만들고
- 그 다음 앱 전체에 공급하고
- 그 다음 API 함수를 분리하고
- 마지막에 화면에서 사용한다

이 순서가 중요한 이유는, “도구를 먼저 넣고 나중에 이유를 찾는 방식”이 아니라  
“왜 필요한지 이해하고 한 단계씩 도입하는 방식”이기 때문이다.

---

## 24. 결론

TanStack Query를 처음 배울 때 가장 중요한 것은 문법이 아니다.  
가장 중요한 것은 다음 세 가지이다.

1. 서버 상태는 별도로 관리해야 한다는 점
2. QueryClient가 그 상태를 총괄하는 관리자라는 점
3. `useQuery`는 조회 함수 하나가 아니라 조회 상태 전체를 다루는 훅이라는 점

현재 저장소의 코드는 이 세 가지를 학습하기 위한 최소 예시로 구성되어 있다.  
따라서 이 문서는 단순 사용법 문서가 아니라, 앞으로 팀원이 커밋을 따라가며 TanStack Query를 이해할 수 있도록 만드는 학습용 가이드로 사용해야 한다.
