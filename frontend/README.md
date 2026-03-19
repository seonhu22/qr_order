# QR Order Frontend 설정 가이드

## 1. 문서 목적

본 문서는 `frontend` 프로젝트를 처음 전달받은 팀원이 개발 환경을 스스로 구성하고, 실행, 점검, 테스트까지 수행할 수 있도록 작성한 설정 가이드이다.  
대상 독자는 React, Vite, 테스트 도구에 익숙하지 않은 초보 개발자까지 포함한다.

본 문서는 다음 내용을 순서대로 설명한다.

1. 팀원이 처음 작업을 시작할 때 어떤 순서로 진행해야 하는지
2. 프로젝트가 어떤 방식으로 동작하는지
3. 실행 전에 무엇을 준비해야 하는지
4. 설치와 실행은 어떤 순서로 해야 하는지
5. 개발 중 어떤 사이클로 점검해야 하는지
6. 현재 채택한 라이브러리는 왜 선택했는지

---

## 2. 팀원 작업 시작 순서 권장안

신규 팀원은 아래 순서대로 시작하는 것을 권장한다.

1. `frontend/README.md` 전체 읽기
2. `npm install`
3. `npm run lint`
4. `npm run typecheck`
5. `npm test`
6. `npm run dev`
7. 백엔드 기동 확인
8. 브라우저에서 기본 화면 확인
9. 이후 담당 화면 개발 시작

이 순서를 앞에 둔 이유는, 초보자에게 가장 필요한 정보가 "무엇부터 해야 하는가"이기 때문이다.  
설정 문서를 처음 읽는 사람이 뒤쪽까지 내려가지 않아도 바로 작업을 시작할 수 있도록 구성하였다.

---

## 3. 프로젝트 개요

본 프론트엔드는 QR Order 프로젝트의 사용자 화면 및 관리자 화면 개발을 위한 프론트엔드 작업 공간이다.  
기본 개발 서버는 `Vite`, UI 라이브러리는 `React 19`, 상태 관리는 `TanStack Query`와 `Zustand`, 언어 기준은 `TypeScript`를 채택하였다.

현재 소스는 일부 `js/jsx` 파일이 남아 있으나, 설정 기준은 TypeScript 전환을 전제로 구성되어 있다.  
즉, 현재는 "점진적 전환 상태"이며, 신규 코드부터는 TypeScript 기준으로 작성하는 것을 권장한다.

---

## 4. 권장 개발 사이클

개발은 단순히 화면만 수정하고 브라우저에서 확인하는 방식으로 끝내지 않는다.  
아래 사이클을 반복하는 것을 권장한다.

1. 기능 구현 또는 수정
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. 필요 시 특정 테스트를 감시 모드로 실행
6. 브라우저에서 실제 동작 확인
7. 커밋 전 다시 `lint`, `typecheck`, `test` 수행

대표 명령어는 아래와 같다.

```powershell
npm run lint
npm run typecheck
npm test
```

테스트를 반복적으로 확인해야 하는 경우에는 아래 명령을 사용한다.

```powershell
npm run test:watch
```

이 명령은 파일 변경을 감시하면서 관련 테스트를 다시 실행하므로, 단위 테스트를 작성하거나 수정할 때 유용하다.

---

## 5. 동작 구조

본 프로젝트는 프론트엔드와 백엔드가 분리된 상태로 개발된다.

- 프론트엔드 개발 서버 포트: `3000`
- 백엔드(Spring Boot) 포트: `8080`
- 프록시 경로: `/api -> http://localhost:8080`

즉, 브라우저는 `http://localhost:3000`으로 접속하지만, 실제 API 요청은 `Vite proxy`를 통해 백엔드 `8080`으로 전달된다.

이 구조를 사용하는 이유는 다음과 같다.

- 프론트와 백엔드를 동시에 개발할 수 있다.
- 로컬 개발 중 CORS 설정 부담을 줄일 수 있다.
- 실제 운영 경로와 유사하게 `/api` 기준으로 코드를 유지할 수 있다.

---

## 6. 폴더 설계안

폴더 구조는 아직 확정이 아니라 유동적이다.  
다만 공통 기준 없이 화면을 먼저 늘리면 나중에 정리 비용이 급격히 커지므로, 아래와 같은 설계안을 참고 구조로 둔다.

현재 목표는 멀티앱 구조이다.

- `admin`: 관리자 웹
- `client`: 사업자 웹/모바일
- `consumer`: 소비자 모바일 중심

권장 예시는 아래와 같다.

```text
frontend/
  src/
    apps/
      admin/
        pages/
        features/
        routes/
      client/
        pages/
        features/
        routes/
      consumer/
        pages/
        features/
        routes/
    shared/
      components/
        input/        ← TextInput 계열 (InputBase / InputWrapper / TextInput)
        button/
        modal/
        table/
        feedback/
      dev/            ← 개발 전용 컴포넌트 가이드 페이지 (/dev/*)
      hooks/
      lib/            ← queryClient.js 등 공용 인프라
      api/
      stores/
      styles/         ← 디자인 토큰 및 전역 CSS
      utils/
      types/
    mocks/
    test/
```

각 영역의 역할은 다음과 같다.

- `apps/*/pages`: 실제 라우트 단위 화면
- `apps/*/features`: 화면 내부에서 재사용되는 기능 단위 코드
- `apps/*/routes`: 앱별 라우터 정의
- `shared/components`: 공통 UI 컴포넌트 (컴포넌트 종류별 하위 폴더로 분리)
- `shared/dev`: 개발 전용 가이드 페이지 (프로덕션 빌드와 무관)
- `shared/hooks`: 공통 훅
- `shared/lib`: Query Client, fetch 래퍼, 포맷 유틸 같은 공용 인프라 코드
- `shared/api`: API 함수 또는 API 클라이언트 계층
- `shared/stores`: Zustand 전역 스토어
- `shared/styles`: 디자인 토큰 CSS 및 전역 스타일
- `shared/utils`: 날짜, 문자열, 정렬 등 공용 유틸리티
- `shared/types`: DTO, 공통 타입, 응답 타입
- `mocks`: MSW 브라우저 mock 구성
- `test`: 테스트 설정 및 공통 테스트 유틸

이 설계안을 사용하는 이유는 다음과 같다.

- 페이지 단위 코드와 기능 단위 코드를 분리하기 쉽다.
- 앱별 분리가 가능해진다.
- 공통 코드가 어느 위치에 있어야 하는지 빠르게 판단할 수 있다.
- 초기에는 단순 구조로 시작하더라도, 나중에 멀티앱 구조로 확장하기 쉽다.

즉, 이 설계안은 "지금 당장 강제 규칙"이 아니라 "증설 시 기준점"으로 이해하면 된다.

---

## 7. 디자인 토큰 시스템

본 프로젝트는 Tailwind CSS를 사용하지 않는다.
대신 CSS 커스텀 프로퍼티(변수) 기반의 2단계 토큰 구조를 채택하였다.

### 7.1 파일 구조

```text
shared/styles/
  primitive-tokens.css   ← 원시값 정의 (색상 팔레트, 간격, 폰트 등)
  semantic-tokens.css    ← 용도 기반 이름 (컴포넌트에서 이 파일만 참조)
  global.css             ← 앱 진입점 (reset + fonts + tokens 통합 import)
  reset.css              ← 브라우저 기본 스타일 초기화
  fonts.css              ← 폰트 선언
```

### 7.2 사용 원칙

컴포넌트에서 CSS 변수를 사용할 때는 반드시 `semantic-tokens.css`의 변수만 참조한다.
`primitive-tokens.css`의 변수는 컴포넌트에서 직접 사용하지 않는다.

```css
/* 올바른 사용 */
color: var(--color-text-primary);

/* 금지 — primitive 직접 참조 */
color: var(--slate-90);
```

### 7.3 토큰 계층 요약

| 파일 | 역할 | 예시 |
|------|------|------|
| `primitive-tokens.css` | 원시값 정의 | `--slate-90`, `--orange-60`, `--spacing-8` |
| `semantic-tokens.css` | 용도 기반 매핑 | `--color-text-primary`, `--color-brand-default` |

---

## 8. 공용 컴포넌트 작성 규칙

`shared/components` 하위 컴포넌트는 아래 규칙을 따른다.

### 8.1 3-레이어 패턴

공용 컴포넌트는 역할에 따라 3개 레이어로 분리한다.

| 레이어 | 역할 | 예시 |
|--------|------|------|
| **Base** | 순수 컨트롤 박스 (테두리·배경·슬롯) | `InputBase` |
| **Wrapper** | 레이블·도움말·레이아웃 | `InputWrapper` |
| **완성형** | Base + Wrapper + 기능 조합 | `TextInput` |

Base와 Wrapper는 다른 컴포넌트에서 재사용할 수 있도록 독립적으로 설계한다.
예를 들어 `Select`, `Checkbox` 등 신규 컴포넌트 작성 시 `InputWrapper`를 그대로 재사용한다.

### 8.2 스타일 규칙

- Tailwind CSS를 사용하지 않는다.
- `semantic-tokens.css`의 CSS 변수만 참조한다.
- 각 컴포넌트 폴더 내부에 전용 CSS 파일을 작성한다 (예: `Input.css`).
- 클래스 네이밍은 BEM 방식을 따른다 (예: `.input-control__slot-left`).

### 8.3 타입 규칙

- 신규 컴포넌트는 TypeScript(`.tsx`)로 작성한다.
- 공통 타입은 컴포넌트 폴더 내 `types.ts`에 정의한다.
- 폴더 외부에서는 `index.ts` 배럴 파일을 통해서만 import한다.

```ts
// 올바른 import
import { TextInput } from '@/shared/components/input';

// 금지 — 내부 파일 직접 참조
import { TextInput } from '@/shared/components/input/TextInput';
```

### 8.4 신규 컴포넌트 추가 절차

1. `shared/components/{컴포넌트명}/` 폴더 생성
2. `types.ts` → CSS 파일 → Base/Wrapper → 완성형 순서로 작성
3. `index.ts` 배럴 파일에 공개 API 등록
4. `shared/dev/{컴포넌트명}Guide.tsx` 가이드 페이지 작성
5. `DevRoutes.tsx` 및 `DevLayout.tsx` 에 라우트·메뉴 등록

---

## 9. 개발 전용 가이드 페이지

공용 컴포넌트의 시각적 동작을 확인하기 위한 개발 전용 페이지가 있다.

### 9.1 접근 방법

개발 서버 실행 후 아래 주소로 접속한다.

```text
http://localhost:3000/dev/input
```

- 로그인 인증이 필요 없다.
- 로컬 개발 환경 전용이며 프로덕션 배포와 무관하다.

### 9.2 현재 등록된 가이드

| 경로 | 내용 |
|------|------|
| `/dev/input` | TextInput 크기·상태·레이블 위치·기능 전체 예시 |

### 9.3 신규 가이드 추가 방법

1. `shared/dev/{컴포넌트명}Guide.tsx` 파일 생성
2. `shared/dev/DevRoutes.tsx`에 라우트 추가

```ts
// DevRoutes.tsx
import ButtonGuide from './ButtonGuide';

{ path: 'button', element: <ButtonGuide /> },
```

3. `shared/dev/DevLayout.tsx`의 `NAV_ITEMS` 배열에 메뉴 등록

```ts
const NAV_ITEMS = [
  { path: '/dev/input',  label: 'TextInput' },
  { path: '/dev/button', label: 'Button' },   // 추가
];
```

---

## 10. 사전 준비 사항

프로젝트 실행 전 아래 항목이 준비되어 있어야 한다.

### 10.1 필수 설치 도구

- `Node.js` 20 이상 권장
- `npm` 사용
- `Java 17` 이상
- 백엔드 서버 실행 환경

### 10.2 확인해야 할 사항

- 백엔드 서버가 `8080` 포트에서 정상 기동 중인지 확인한다.
- 프론트엔드 디렉터리는 `frontend`인지 확인한다.
- 명령어는 반드시 `frontend` 디렉터리에서 실행한다.

예시:

```powershell
cd C:\Users\user\Desktop\k-digital\DEV\qr_order\frontend
```

### 10.3 백엔드가 `8080`에서 정상 기동 중인지 확인하는 방법

가장 확실한 방법은 로그 확인이다.  
Spring Boot 실행 로그에 아래와 유사한 문구가 보이면 정상 기동으로 판단할 수 있다.

```text
Tomcat started on port 8080 (http) with context path '/'
Started QROrderApplication
```

추가로 아래 방법으로도 확인할 수 있다.

1. VS Code의 Java Extension 또는 Spring Boot Dashboard에서 애플리케이션이 `Running` 상태인지 본다.
2. 브라우저에서 `http://localhost:8080`에 접속해본다.
3. PowerShell에서 포트 사용 여부를 확인한다.

예시:

```powershell
netstat -ano | findstr :8080
tasklist /FI "PID eq <Listening 옆 번호 - PiD>"
```

여기서 중요한 점은 다음과 같다.

- 브라우저에서 `http://localhost:8080`을 입력했을 때 화면이 반드시 예쁘게 보여야 하는 것은 아니다.
- 로그인 페이지가 바로 뜨지 않아도, 404 또는 Spring Security 응답이 나오면 "서버는 떠 있다"는 뜻일 수 있다.
- 즉, 브라우저 확인은 "정상 서비스 확인"이 아니라 "포트에서 서버 응답이 오는지 확인"하는 용도이다.

따라서 질문한 방식처럼 VS Code에서 Spring Boot를 실행하고, 크롬에서 `http://localhost:8080`을 입력해보는 것은 유효한 확인 방법이다.  
다만 가장 정확한 기준은 여전히 서버 로그의 `Tomcat started on port 8080` 문구이다.

---

## 11. 설치 절차

### 11.1 의존성 설치

아래 명령어를 실행한다.

```powershell
npm install
```

설치가 완료되면 `node_modules`와 `frontend/package-lock.json`이 생성 또는 갱신된다.

### 11.2 설치 후 확인 포인트

설치가 끝났다고 바로 개발을 시작하지 말고, 아래 3가지를 먼저 확인한다.

```powershell
npm run lint
npm run typecheck
npm test
```

위 명령이 모두 통과하면 현재 개발 환경은 정상으로 판단할 수 있다.

---

## 12. 실행 절차

### 12.1 프론트 개발 서버 실행

```powershell
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속한다.

```text
http://localhost:3000
```

### 12.2 백엔드와 함께 사용할 때

프론트는 `/api` 요청을 자동으로 `http://localhost:8080`으로 전달한다.  
따라서 백엔드가 켜져 있어야 로그인, 세션 확인, 데이터 조회 같은 기능이 정상 작동한다.

백엔드가 꺼져 있으면 다음과 같은 현상이 발생할 수 있다.

- 로그인 실패
- 사용자 정보 조회 실패
- 목록 조회 실패
- 네트워크 오류 메시지 발생

### 12.3 개발 모킹(MSW) 모드와 실제 백엔드 모드

초보 개발자가 가장 많이 헷갈리는 부분은 "지금 API가 실제 백엔드로 가는지, MSW가 응답하는지"이다.  
아래 기준으로 구분하면 된다.

#### 12.3.1 개발 모킹(MSW) 모드

- 권장 명령: `npm run dev:mock`
- 동작: 브라우저에서 MSW가 요청을 가로채고 `src/test/handlers.js`의 응답을 반환한다.
- 장점: 백엔드가 없어도 로딩/성공/실패 UI를 안정적으로 확인할 수 있다.
- 참고: `npm run dev`도 사용할 수 있으며, 기본값은 MSW 활성 상태다.

관련 파일:

- `src/main.jsx`: 개발 환경(`import.meta.env.DEV`)에서만 worker 시작
- `src/mocks/browser.js`: 브라우저 worker 설정
- `public/mockServiceWorker.js`: Service Worker 스크립트

#### 12.3.2 실제 백엔드 모드

방법 A. 개발 서버 유지 (`npm run dev:real`)

- `VITE_ENABLE_MSW=false`로 실행되므로 MSW가 시작되지 않는다.
- `/api` 요청은 Vite proxy를 통해 `http://localhost:8080`으로 전달된다.

방법 A-2. 기존 명령 유지 (`npm run dev`)

- 기존 `npm run dev`도 계속 사용 가능하다.
- 다만 이 경우 기본값이 MSW 활성 상태이므로, 실제 백엔드 확인 목적이면 `npm run dev:real`을 권장한다.

방법 B. 빌드 결과 확인

```powershell
npm run build
npm run preview
```

- `preview`는 개발 모드가 아니므로 MSW가 시작되지 않는다.
- 따라서 실제 백엔드 연동 상태를 확인하기 쉽다.

주의:

- 현재 `package.json`에는 `npm run start` 스크립트가 없다.
- 빌드 결과를 로컬에서 확인할 때는 `npm run preview`를 사용한다.

#### 12.3.3 빠른 체크리스트

1. 브라우저 콘솔에 MSW 활성 로그가 보이는가
2. 목록 조회 화면에서 데이터가 표시되는가
3. 백엔드 실행 후 네트워크 탭에서 `localhost:8080` 호출이 보이는가
4. 실패 핸들러를 적용했을 때 에러 UI가 표시되는가

---

## 13. 사용 가능한 스크립트

`package.json`에는 아래 스크립트가 정의되어 있다.

### 13.1 개발 서버

```powershell
npm run dev
```

- Vite 개발 서버를 실행한다.
- 기본 포트는 `3000`이다.

```powershell
npm run dev:mock
```

- MSW를 활성화한 개발 서버를 실행한다.
- 백엔드 없이도 화면 흐름을 점검할 수 있다.

```powershell
npm run dev:real
```

- MSW를 비활성화한 개발 서버를 실행한다.
- 실제 백엔드 연동 상태를 확인할 때 사용한다.

### 13.2 린트 검사

```powershell
npm run lint
```

- ESLint 규칙 위반 여부를 검사한다.
- 코드 스타일과 잠재적 실수를 빠르게 확인할 수 있다.

### 13.3 타입 검사

```powershell
npm run typecheck
```

- TypeScript 타입 검사를 수행한다.
- 현재는 `allowJs` 기반으로 동작하므로 JS/JSX 프로젝트에서도 점진적으로 타입 기준을 강화할 수 있다.

### 13.4 테스트 실행

```powershell
npm test
```

- Vitest 테스트를 1회 실행한다.

```powershell
npm run test:watch
```

- 테스트를 감시 모드로 실행한다.

```powershell
npm run test:coverage
```

- 커버리지 보고서를 생성한다.
- 결과는 `coverage` 디렉터리에 생성된다.
- 이 보고서는 "테스트가 몇 개 있나"를 보는 용도가 아니라, 어떤 파일과 분기문이 테스트되지 않았는지를 확인하는 용도로 사용한다.
- 일반적으로 기능 추가 후 테스트 누락 영역을 찾거나, 리팩터링 전에 위험 구간을 파악할 때 확인한다.
- 사용 방법은 coverage 파일의 html을 실행시키면 된다(live server나 다른 브라우저로)

### 13.5 빌드

```powershell
npm run build
```

- 프론트엔드 결과물을 빌드한다.
- 빌드 결과는 현재 설정 기준으로 백엔드 정적 리소스 경로인 아래 위치로 출력된다.

```text
../qrorder/src/main/resources/static
```

즉, 프론트 단독 배포가 아니라 백엔드 정적 리소스와 연결하는 방식에 맞춘 설정이다.

---

## 14. 주요 설정 파일 설명

### 14.1 `vite.config.js`

역할은 다음과 같다.

- React 플러그인 활성화
- 개발 서버 포트 `3000` 지정
- `/api` 요청을 `8080` 백엔드로 프록시
- Vitest 테스트 환경 설정
- 빌드 결과물 출력 위치 지정

### 14.2 `tsconfig.json`

- TypeScript 컴파일 기준 정의
- JSX를 React 기준으로 해석
- 현재 JS/JSX 코드도 점진적으로 수용
- 타입 검사만 수행하고 실제 파일 출력은 하지 않음

### 14.3 `eslint.config.js`

- 코드 품질 검사 규칙 정의
- React Hooks 규칙 검사
- React Fast Refresh 관련 규칙 검사
- TypeScript ESLint 규칙 적용
- Prettier와 충돌하는 포맷 규칙 제거

### 14.4 `.prettierrc.json`

- 세미콜론 사용
- 작은따옴표 사용
- trailing comma 유지
- 줄 길이 기준 설정

즉, 코드 포맷을 팀 기준으로 통일하기 위한 파일이다.

### 14.5 `src/test/*`

역할은 다음과 같다.

- `setup.js`: 테스트 시작 전 공통 초기화
- `server.js`: Node 테스트 환경에서 MSW 서버 설정
- `handlers.js`: 테스트용 API 응답 정의

---

## 15. 테스트 도구 구성 설명

현재 테스트는 `Vitest + Testing Library + MSW` 조합으로 구성하였다.

### 15.1 왜 Jest 대신 Vitest를 사용하는가

본 프로젝트는 Vite 기반 프로젝트이므로 테스트 도구도 Vite 생태계와 잘 맞는 구성이 유리하다.  
이 때문에 `Jest` 대신 `Vitest`를 채택하였다.

선정 이유는 다음과 같다.

- Vite 프로젝트와 통합이 자연스럽다.
- 설정량이 비교적 적다.
- 실행 속도가 빠르다.
- 별도 변환 체계 구성이 단순하다.
- 기본적으로 개발 서버 구조와 철학이 유사해 유지보수 부담이 낮다.

정리하면, 본 프로젝트에서는 `Jest`보다 `Vitest`가 초기 설정 비용과 운영 부담이 더 낮다고 판단하였다.

### 15.2 왜 Testing Library를 사용하는가

`Testing Library`는 테스트 실행기가 아니다.  
이 도구는 "무엇을 어떻게 찾고 검증할 것인가"를 담당하는 테스트 보조 라이브러리이다.

즉, 두 도구의 역할은 다음과 같이 다르다.

- `Vitest`: 테스트를 실행하는 도구
- `Testing Library`: 화면 요소를 사용자 관점에서 찾고 검증하는 도구

따라서 `Vitest`와 `Testing Library`는 서로 경쟁 관계가 아니라 함께 사용하는 조합이다.

선정 이유는 다음과 같다.

- 사용자가 실제로 보는 텍스트, 버튼, 입력 요소 중심으로 테스트하게 만든다.
- 구현 상세보다 화면 동작을 기준으로 테스트하게 만들어 불필요한 결합을 줄인다.
- 화면 내부 구현이 바뀌어도 사용자 동작이 유지되면 테스트를 계속 활용할 수 있다.

### 15.3 왜 MSW를 사용하는가

`MSW(Mock Service Worker)`는 실제 네트워크 요청을 가로채서 가짜 응답을 반환할 수 있게 해준다.

선정 이유는 다음과 같다.

- 현재 백엔드가 존재하더라도, 프론트 테스트는 백엔드 기동 여부와 분리해서 빠르게 실행하는 편이 유리하다.
- 백엔드 API가 아직 완전히 확정되지 않아도 프론트 테스트를 진행할 수 있다.
- 테스트에서 `fetch`를 직접 mock 처리하는 것보다 구조가 실제 사용 환경과 가깝다.
- 로그인 성공/실패, 인증 만료, 조회 실패 같은 시나리오를 쉽게 재현할 수 있다.

즉, API 명세가 변동될 가능성이 있는 프로젝트에서 프론트 개발과 테스트를 분리하기에 적합하다.

---

## 16. 라이브러리 선정 이유

본 절에서는 현재 채택한 주요 라이브러리와 그 이유를 정리한다.

### 16.1 React

사용 목적:

- 화면 렌더링
- 컴포넌트 기반 UI 구성
- 상태와 이벤트 처리

선정 이유:

- 팀 단위 개발에서 가장 일반적인 선택지 중 하나이다.
- 컴포넌트 단위 재사용 구조를 만들기 쉽다.
- 관리자/사업자/소비자 앱으로 확장할 때 구조적 이점이 크다.

### 16.2 React Router DOM

사용 목적:

- 페이지 라우팅
- 보호 라우트 처리
- 중첩 라우트 처리

선정 이유:

- React 기반 웹 애플리케이션에서 사실상 표준적인 선택지이다.
- 로그인 페이지, 대시보드, 시스템 관리 화면처럼 URL 단위 분리가 필요한 현재 구조와 잘 맞는다.

### 16.3 TypeScript

사용 목적:

- 타입 안정성 확보
- API 응답 구조 명시
- 컴포넌트 Props 검증

선정 이유:

- 화면이 늘어날수록 JS 단독 운영은 유지보수 비용이 빠르게 증가한다.
- 백엔드 API 명세와 프론트 모델을 연결할 때 실수를 줄일 수 있다.
- 팀 협업 시 코드 의도를 더 명확하게 전달할 수 있다.

### 16.4 TanStack Query

사용 목적:

- 서버 조회 데이터 캐싱
- 로딩/에러/재조회 상태 관리
- 비동기 API 호출 표준화

선정 이유:

- 서버 상태와 UI 상태를 분리한다는 현재 프론트 규칙과 잘 맞는다.
- 단순 조회 화면이 많은 관리자 프로젝트에서 반복 코드를 줄이는 효과가 크다.
- 캐싱과 재요청 제어를 수동 구현하지 않아도 된다.

### 16.5 Zustand

사용 목적:

- 전역 UI 상태 관리
- 사용자 정보, 메뉴 상태, 모달 상태 등 공용 상태 관리

선정 이유:

- Redux보다 초기 진입 장벽이 낮다.
- 보일러플레이트가 적다.
- 서버 상태는 TanStack Query, UI 전역 상태는 Zustand로 역할을 분리하기 좋다.

### 16.6 Zod

사용 목적:

- API 응답 검증
- 입력값 검증
- DTO 형태 검증

선정 이유:

- 백엔드 응답 계약이 변경되거나 흔들릴 때 프론트에서 빠르게 감지할 수 있다.
- TypeScript 타입 선언만으로는 막을 수 없는 런타임 데이터 오류를 보완할 수 있다.

### 16.7 Day.js

사용 목적:

- 날짜 포맷팅
- 기간 계산
- 조회 조건 날짜 처리

선정 이유:

- 접속이력, 변경이력, 쿠폰 기간 등 날짜 처리 요구가 명세에 많다.
- 사용법이 비교적 단순하고 번들 부담이 크지 않다.

### 16.8 ESLint

사용 목적:

- 코드 품질 점검
- 위험한 패턴 사전 방지

선정 이유:

- 팀원이 늘어날수록 스타일 차이보다 "실수 방지"가 더 중요해진다.
- React Hooks 규칙 위반, 사용하지 않는 변수, 구조적 문제를 빠르게 찾을 수 있다.

### 16.9 Prettier

사용 목적:

- 코드 포맷 자동 정리

선정 이유:

- 코드 리뷰에서 포맷 논쟁을 줄일 수 있다.
- 사람이 직접 맞추는 스타일 규칙을 도구가 대신 처리해준다.

### 16.10 Vitest

사용 목적:

- 단위 테스트 및 컴포넌트 테스트 실행

선정 이유:

- Vite와 결합이 자연스럽다.
- Jest 대비 초기 설정 비용이 낮다.
- `jsdom` 환경과 커버리지 구성도 비교적 간단하다.

### 16.11 Testing Library

사용 목적:

- 실제 사용자 관점의 컴포넌트 테스트 작성

선정 이유:

- 화면 텍스트, 버튼, 입력 요소 중심으로 테스트하게 만들어 유지보수성이 좋다.
- 구현 세부사항이 바뀌어도 사용자 동작이 유지되면 테스트를 계속 활용할 수 있다.

### 16.12 MSW

사용 목적:

- API mock
- 테스트 환경 네트워크 응답 제어
- 백엔드 미완성 구간 대응

선정 이유:

- 실제 네트워크 호출 흐름에 가까운 테스트가 가능하다.
- 로그인 성공/실패, 인증 만료, 조회 실패 같은 시나리오를 쉽게 재현할 수 있다.

---

## 17. 현재 단계에서 반드시 이해해야 할 운영 원칙

### 17.1 서버 상태와 UI 상태를 분리한다

- 서버 데이터 조회: `TanStack Query`
- 전역 UI 상태: `Zustand`

이 원칙을 지키지 않으면 상태가 서로 섞여 화면이 복잡해지고 유지보수성이 크게 떨어진다.

### 17.2 저장/수정/삭제 응답은 공통 응답 구조를 따른다

명세 기준으로 저장성 API는 `CommonResponse` 구조를 반환한다.

예시:

```json
{ "success": true, "message": "성공 메시지" }
```

또는

```json
{ "success": false, "message": "에러 메시지", "error": "상세 오류" }
```

프론트에서는 이 구조를 공통 처리해야 한다.

### 17.3 브라우저 기본 alert 사용을 지양한다

현재 프론트 목표 문서 기준으로 `window.alert`, `window.confirm`, `window.prompt`는 사용하지 않는다.  
반드시 커스텀 모달 구조로 통일해야 한다.

---

## 18. 자주 발생하는 문제와 점검 방법

### 18.1 `npm install` 중 의존성 충돌이 발생하는 경우

- 패키지 버전 충돌 가능성이 높다.
- `package.json`을 임의로 수정했다면 peer dependency 범위를 먼저 확인한다.

### 18.2 화면은 열리는데 API가 실패하는 경우

아래를 순서대로 확인한다.

1. 백엔드가 `8080`에서 실행 중인지 확인
2. `vite.config.js`의 proxy 설정 확인
3. 백엔드 인증 설정 확인
4. 브라우저 개발자 도구의 Network 탭 확인

### 18.3 테스트가 실패하는 경우

아래를 확인한다.

1. `src/test/setup.js`가 정상 로드되는지
2. MSW 핸들러가 현재 API 경로와 일치하는지
3. 테스트가 실제 화면 기준으로 작성되었는지

---

## 19. 결론

현재 프론트엔드 환경은 다음 목표를 기준으로 구성되어 있다.

- React 19 기반 UI 개발
- TypeScript 기준의 점진 전환
- 서버 상태와 UI 상태의 분리
- 빠른 테스트 실행 환경 구축
- 초기에 품질 도구를 함께 도입하여 기술 부채를 늦추는 구조

실무적으로 가장 중요한 점은 다음 두 가지이다.

- 개발 서버만 띄우는 것으로 끝내지 말고 `lint`, `typecheck`, `test`까지 항상 함께 확인할 것
- 서버 상태와 UI 상태를 섞지 말고, 선택한 라이브러리의 역할을 명확히 구분할 것

이 원칙을 지키면 프로젝트가 커져도 구조가 무너지지 않고 유지될 가능성이 높다.
