package htms.QROrder.consumer.order.idempotency;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderIdempotencyException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConsumerOrderIdempotencyStoreTest {

    private static final Duration TTL = Duration.ofMinutes(10);
    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(2);

    @Test
    void executesConcurrentMatchingRequestsOnlyOnce() throws Exception {
        MutableClock clock = new MutableClock(Instant.parse("2026-09-14T00:00:00Z"));
        ConsumerOrderIdempotencyStore store = new ConsumerOrderIdempotencyStore(clock, TTL, WAIT_TIMEOUT);
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");
        AtomicInteger executions = new AtomicInteger();
        CountDownLatch ownerStarted = new CountDownLatch(1);
        CountDownLatch releaseOwner = new CountDownLatch(1);

        var executor = Executors.newFixedThreadPool(2);
        try {
            var tasks = List.of(
                    executor.submit(() -> store.execute(key, "fingerprint", () -> {
                        executions.incrementAndGet();
                        ownerStarted.countDown();
                        await(releaseOwner);
                        return response("ORDER-1");
                    })),
                    executor.submit(() -> {
                        assertTrue(ownerStarted.await(1, TimeUnit.SECONDS));
                        return store.execute(key, "fingerprint", () -> {
                            executions.incrementAndGet();
                            return response("ORDER-2");
                        });
                    })
            );

            releaseOwner.countDown();
            List<String> orderIds = new ArrayList<>();
            for (var task : tasks) {
                orderIds.add(task.get(2, TimeUnit.SECONDS).getOrderId());
            }

            assertEquals(List.of("ORDER-1", "ORDER-1"), orderIds);
            assertEquals(1, executions.get());
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rejectsSameKeyWithDifferentFingerprint() {
        ConsumerOrderIdempotencyStore store = store();
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");
        store.execute(key, "fingerprint-1", () -> response("ORDER-1"));

        ConsumerOrderIdempotencyException error = assertThrows(
                ConsumerOrderIdempotencyException.class,
                () -> store.execute(key, "fingerprint-2", () -> response("ORDER-2")));

        assertEquals("IDEMPOTENCY_PAYLOAD_MISMATCH", error.getErrorCode());
    }

    @Test
    void replaysACompletedResponseWithinTtl() {
        ConsumerOrderIdempotencyStore store = store();
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");
        AtomicInteger executions = new AtomicInteger();

        ConsumerOrderCreateResponse first = store.execute(key, "fingerprint", () -> {
            executions.incrementAndGet();
            return response("ORDER-1");
        });
        ConsumerOrderCreateResponse replay = store.execute(key, "fingerprint", () -> {
            executions.incrementAndGet();
            return response("ORDER-2");
        });

        assertEquals("ORDER-1", first.getOrderId());
        assertEquals("ORDER-1", replay.getOrderId());
        assertEquals(1, executions.get());
    }

    @Test
    void returnsInProgressWhenTheOwnerExceedsTheWaitLimit() throws Exception {
        ConsumerOrderIdempotencyStore store = new ConsumerOrderIdempotencyStore(
                Clock.systemUTC(), TTL, Duration.ofMillis(20));
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");
        CountDownLatch ownerStarted = new CountDownLatch(1);
        CountDownLatch releaseOwner = new CountDownLatch(1);
        var executor = Executors.newSingleThreadExecutor();
        try {
            var owner = executor.submit(() -> store.execute(key, "fingerprint", () -> {
                ownerStarted.countDown();
                await(releaseOwner);
                return response("ORDER-1");
            }));
            assertTrue(ownerStarted.await(1, TimeUnit.SECONDS));

            ConsumerOrderIdempotencyException error = assertThrows(
                    ConsumerOrderIdempotencyException.class,
                    () -> store.execute(key, "fingerprint", () -> response("ORDER-2")));

            assertEquals("IDEMPOTENCY_IN_PROGRESS", error.getErrorCode());
            releaseOwner.countDown();
            assertEquals("ORDER-1", owner.get(1, TimeUnit.SECONDS).getOrderId());
        } finally {
            releaseOwner.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void keepsExpiredKeyAsTombstoneInsteadOfCreatingAnotherOrder() {
        MutableClock clock = new MutableClock(Instant.parse("2026-09-14T00:00:00Z"));
        ConsumerOrderIdempotencyStore store = new ConsumerOrderIdempotencyStore(clock, TTL, WAIT_TIMEOUT);
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");
        AtomicInteger executions = new AtomicInteger();
        store.execute(key, "fingerprint", () -> {
            executions.incrementAndGet();
            return response("ORDER-1");
        });
        clock.advance(Duration.ofMinutes(10));

        ConsumerOrderIdempotencyException error = assertThrows(
                ConsumerOrderIdempotencyException.class,
                () -> store.execute(key, "fingerprint", () -> {
                    executions.incrementAndGet();
                    return response("ORDER-2");
                }));

        assertEquals("IDEMPOTENCY_KEY_EXPIRED", error.getErrorCode());
        assertEquals(1, executions.get());
    }

    @Test
    void removesFailedReservationSoTheRequestCanRetry() {
        ConsumerOrderIdempotencyStore store = store();
        ConsumerOrderIdempotencyKey key = key("VISIT-1", "REQUEST-1");

        assertThrows(IllegalStateException.class,
                () -> store.execute(key, "fingerprint", () -> {
                    throw new IllegalStateException("DB failure");
                }));

        assertEquals("ORDER-1", store.execute(
                key, "fingerprint", () -> response("ORDER-1")).getOrderId());
    }

    @Test
    void scopesTheSameClientRequestIdByPlantAndVisit() {
        ConsumerOrderIdempotencyStore store = store();

        assertEquals("ORDER-1", store.execute(
                key("VISIT-1", "REQUEST-1"), "fingerprint", () -> response("ORDER-1")).getOrderId());
        assertEquals("ORDER-2", store.execute(
                key("VISIT-2", "REQUEST-1"), "fingerprint", () -> response("ORDER-2")).getOrderId());
    }

    private ConsumerOrderIdempotencyStore store() {
        return new ConsumerOrderIdempotencyStore(
                Clock.fixed(Instant.parse("2026-09-14T00:00:00Z"), ZoneOffset.UTC),
                TTL,
                WAIT_TIMEOUT);
    }

    private ConsumerOrderIdempotencyKey key(String visitId, String requestId) {
        return new ConsumerOrderIdempotencyKey("PLANT-1", visitId, requestId);
    }

    private ConsumerOrderCreateResponse response(String orderId) {
        return new ConsumerOrderCreateResponse(
                orderId, "1001", "RECEIVED", 10_000, LocalDateTime.of(2026, 9, 14, 9, 0));
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
