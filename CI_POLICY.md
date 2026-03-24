# CI 규칙 정리

> 요약하자면 깃을 올렸을 때 규칙 검사를 자동화하는 기능을 추가했습니다. 설치 외 주의사항은 없습니다.

### 할 일

- 루트 디렉토리에서 npm install해서 husky 설치
- gitleaks 설치 (brew install gitleaks)

## 로컬 시크릿 관리

- 실제 시크릿 값은 `qrorder/src/main/resources/application-local.properties` 같은 로컬 전용 파일에만 보관합니다.
- 저장소에는 `qrorder/src/main/resources/application-local.properties.example` 같은 템플릿 파일만 커밋합니다.
- 실제 비밀번호, 토큰, SSH 개인키, API 키는 저장소에 올리지 않습니다.

## Pre-commit 시크릿 스캔

- 이 저장소는 `Husky`를 사용해 `pre-commit` hook을 실행합니다.
- `pre-commit` hook은 커밋 직전에 staged 파일을 `Gitleaks`로 검사합니다.
- 저장소를 clone 받은 뒤 아래 명령으로 hook을 설치합니다.

```bash
npm install
```

- 커밋 전에 각 개발자 PC에 `Gitleaks`를 별도로 설치해야 합니다.

### 설치 및 확인 커맨드

- winget install --id Gitleaks.Gitleaks -e (윈도우)
- brew install gitleaks (맥)
- gitleaks version

- 공식 설치 가이드: https://github.com/gitleaks/gitleaks

## CI 검사 항목

- GitHub Actions는 Pull Request와 `main` 또는 `master` 브랜치 push 시 아래 검사를 실행합니다.
- `Gitleaks` 시크릿 스캔
- `frontend` 빌드: `npm ci && npm run build`
- `qrorder` 백엔드 검증: `./gradlew test`

## CI 및 운영 시크릿

- CI용 시크릿은 GitHub Actions Secrets에 저장합니다.
- 운영 환경 시크릿은 환경변수 또는 별도 secret manager에 저장합니다.
- 저장소에는 변수 이름과 설정 방법만 남기고, 실제 시크릿 값은 기록하지 않습니다.
