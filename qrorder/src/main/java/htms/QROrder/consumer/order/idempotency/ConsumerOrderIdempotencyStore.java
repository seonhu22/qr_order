package htms.QROrder.consumer.order.idempotency;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderIdempotencyException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

@Component
public class ConsumerOrderIdempotencyStore {

    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
    private static final Duration DEFAULT_WAIT_TIMEOUT = Duration.ofSeconds(2);

    private final ConcurrentHashMap<ConsumerOrderIdempotencyKey, Entry> entries = new ConcurrentHashMap<>();
    private final Clock clock;
    private final Duration ttl;
    private final Duration waitTimeout;

    public ConsumerOrderIdempotencyStore() {
        this(Clock.systemUTC(), DEFAULT_TTL, DEFAULT_WAIT_TIMEOUT);
    }

    ConsumerOrderIdempotencyStore(Clock clock, Duration ttl, Duration waitTimeout) {
        this.clock = Objects.requireNonNull(clock, "clock must not be null");
        this.ttl = requirePositive(ttl, "ttl");
        this.waitTimeout = requirePositive(waitTimeout, "waitTimeout");
    }

    public ConsumerOrderCreateResponse execute(
            ConsumerOrderIdempotencyKey key,
            String fingerprint,
            Supplier<ConsumerOrderCreateResponse> operation) {
        Objects.requireNonNull(key, "key must not be null");
        Objects.requireNonNull(fingerprint, "fingerprint must not be null");
        Objects.requireNonNull(operation, "operation must not be null");

        Entry candidate = new Entry(fingerprint);
        Entry existing = entries.putIfAbsent(key, candidate);
        if (existing == null) {
            return executeAsOwner(key, candidate, operation);
        }
        return replayOrWait(existing, fingerprint);
    }

    private ConsumerOrderCreateResponse executeAsOwner(
            ConsumerOrderIdempotencyKey key,
            Entry entry,
            Supplier<ConsumerOrderCreateResponse> operation) {
        try {
            ConsumerOrderCreateResponse response = operation.get();
            entry.succeededAt = clock.instant();
            entry.response.complete(response);
            return response;
        } catch (RuntimeException | Error exception) {
            entry.response.completeExceptionally(exception);
            entries.remove(key, entry);
            throw exception;
        }
    }

    private ConsumerOrderCreateResponse replayOrWait(Entry entry, String fingerprint) {
        if (!entry.fingerprint.equals(fingerprint)) {
            throw new ConsumerOrderIdempotencyException(
                    ConsumerOrderIdempotencyException.PAYLOAD_MISMATCH,
                    "같은 요청 식별자로 다른 주문 내용을 전송할 수 없습니다.");
        }

        if (!entry.response.isDone()) {
            return waitForOwner(entry);
        }
        return replayCompleted(entry);
    }

    private ConsumerOrderCreateResponse waitForOwner(Entry entry) {
        try {
            return entry.response.get(waitTimeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException exception) {
            throw new ConsumerOrderIdempotencyException(
                    ConsumerOrderIdempotencyException.IN_PROGRESS,
                    "동일한 주문 요청을 처리 중입니다. 주문 내역을 확인해 주세요.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ConsumerOrderIdempotencyException(
                    ConsumerOrderIdempotencyException.IN_PROGRESS,
                    "동일한 주문 요청의 처리 결과를 기다리는 중 중단되었습니다.");
        } catch (ExecutionException exception) {
            throw propagate(exception.getCause());
        }
    }

    private ConsumerOrderCreateResponse replayCompleted(Entry entry) {
        Instant succeededAt = entry.succeededAt;
        if (succeededAt != null && !clock.instant().isBefore(succeededAt.plus(ttl))) {
            throw new ConsumerOrderIdempotencyException(
                    ConsumerOrderIdempotencyException.KEY_EXPIRED,
                    "이미 처리된 오래된 주문 요청입니다. 주문 내역을 확인해 주세요.");
        }
        try {
            return entry.response.join();
        } catch (RuntimeException exception) {
            Throwable cause = exception.getCause();
            throw propagate(cause == null ? exception : cause);
        }
    }

    private RuntimeException propagate(Throwable cause) {
        if (cause instanceof RuntimeException runtimeException) {
            return runtimeException;
        }
        if (cause instanceof Error error) {
            throw error;
        }
        return new IllegalStateException("주문 멱등성 처리 결과를 확인할 수 없습니다.", cause);
    }

    private static Duration requirePositive(Duration duration, String name) {
        Objects.requireNonNull(duration, name + " must not be null");
        if (duration.isZero() || duration.isNegative()) {
            throw new IllegalArgumentException(name + " must be positive");
        }
        return duration;
    }

    private static final class Entry {
        private final String fingerprint;
        private final CompletableFuture<ConsumerOrderCreateResponse> response = new CompletableFuture<>();
        private volatile Instant succeededAt;

        private Entry(String fingerprint) {
            this.fingerprint = fingerprint;
        }
    }
}
