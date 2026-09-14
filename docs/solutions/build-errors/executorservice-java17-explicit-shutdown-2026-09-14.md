---
title: Java 17 ExecutorService 테스트는 명시적으로 종료한다
date: 2026-09-14
category: build-errors
module: consumer-order-idempotency
problem_type: build_error
component: testing_framework
symptoms:
  - "Java 17에서 ExecutorService를 try-with-resources에 사용한 동시성 테스트가 컴파일되지 않음"
root_cause: wrong_api
resolution_type: test_fix
severity: low
related_components:
  - development_workflow
tags:
  - java-17
  - executor-service
  - try-with-resources
  - concurrency-test
---

# Java 17 ExecutorService 테스트는 명시적으로 종료한다

## Problem

Consumer 주문 멱등성 동시성 테스트가 구현 코드 검증 전에 `compileTestJava`에서 실패했다. 프로젝트 Java 17에서는 `ExecutorService`를 try-with-resources의 리소스로 사용할 수 없다.

## Symptoms

- `ExecutorService cannot be converted to AutoCloseable` 계열의 컴파일 오류가 발생한다.
- `var`로 선언해도 실제 타입이 `ExecutorService`라서 같은 오류가 난다.

## What Didn't Work

```java
try (var executor = Executors.newFixedThreadPool(2)) {
    // 동시 요청 테스트
}
```

이 문법은 리소스 타입이 `AutoCloseable`이어야 하지만 Java 17의 `ExecutorService`는 해당 인터페이스를 구현하지 않는다.

## Solution

실행기를 일반 변수로 만들고 예외 여부와 무관하게 `finally`에서 종료한다.

```java
var executor = Executors.newFixedThreadPool(2);
try {
    // 동시 요청과 assertions
} finally {
    executor.shutdownNow();
}
```

적용 위치: `ConsumerOrderIdempotencyStoreTest`

## Why This Works

Java 17이 제공하는 `shutdown()`/`shutdownNow()` 생명주기 API를 직접 사용한다. `finally`는 정상/실패 경로 모두 실행되므로 테스트 실패 때도 작업 스레드가 다음 테스트나 Gradle 프로세스에 남지 않는다.

## Prevention

- 동시성 테스트를 작성하기 전에 프로젝트 toolchain 버전을 확인한다.
- Java 17의 `ExecutorService`는 `try/finally`로 정리한다.
- 실행기 사용이 반복될 때만 테스트 헬퍼나 JUnit 확장을 고려한다.
- CI도 프로젝트와 같은 Java 17 toolchain으로 전체 테스트를 실행한다.

## Related Issues

- [Consumer 주문/세션 계약 강화](../workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
