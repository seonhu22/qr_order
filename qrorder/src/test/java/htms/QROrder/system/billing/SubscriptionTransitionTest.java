package htms.QROrder.system.billing;

import htms.QROrder.system.billing.domain.SubscriptionAction;
import htms.QROrder.system.billing.domain.SubscriptionEvent;
import htms.QROrder.system.billing.domain.SubscriptionFacts;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.domain.SubscriptionTransition;
import htms.QROrder.system.billing.domain.SubscriptionTransition.Kind;
import htms.QROrder.system.billing.domain.SubscriptionTransition.Outcome;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static htms.QROrder.system.billing.domain.SubscriptionAction.*;
import static htms.QROrder.system.billing.domain.SubscriptionEvent.*;
import static htms.QROrder.system.billing.domain.SubscriptionStatus.*;
import static org.junit.jupiter.api.Assertions.*;

/** 정책 4C §3 표의 45칸 전부와 조건 분기. 기본 입력은 기한 전, 조건 플래그 false. */
class SubscriptionTransitionTest {
    private static final Instant NOW = Instant.parse("2026-11-25T00:00:00Z");
    private static final SubscriptionFacts BEFORE_DEADLINES = SubscriptionFacts.at(NOW)
            .withPaidThroughAt(NOW.plus(Duration.ofDays(10)))
            .withGraceUntil(NOW.plus(Duration.ofDays(3)))
            .withEndAt(NOW.plus(Duration.ofDays(5)));

    record Cell(SubscriptionStatus from, SubscriptionEvent event, Kind kind, SubscriptionStatus next,
                Set<SubscriptionAction> actions) {
        @Override public String toString() { return from + " x " + event; }
    }

    private static Cell cell(SubscriptionStatus from, SubscriptionEvent event, Kind kind, SubscriptionStatus next,
                             SubscriptionAction... actions) {
        return new Cell(from, event, kind, next, Set.of(actions));
    }

    static List<Cell> table() {
        return List.of(
                // E1 결제 시작
                cell(PENDING, CHECKOUT_START, Kind.APPLY, PENDING, START_NEW_CHECKOUT),
                cell(ACTIVE, CHECKOUT_START, Kind.REJECT, ACTIVE),
                cell(PAST_DUE, CHECKOUT_START, Kind.APPLY, PAST_DUE, REREGISTER_PAYMENT_METHOD),
                cell(CANCEL_SCHEDULED, CHECKOUT_START, Kind.REJECT, CANCEL_SCHEDULED),
                cell(EXPIRED, CHECKOUT_START, Kind.REJECT, EXPIRED),
                // E2 Paid
                cell(PENDING, INVOICE_PAID, Kind.APPLY, ACTIVE, GRANT_ROLE, EXTEND_PERIOD),
                cell(ACTIVE, INVOICE_PAID, Kind.RECORD, ACTIVE),
                cell(PAST_DUE, INVOICE_PAID, Kind.APPLY, ACTIVE, EXTEND_PERIOD, CLEAR_GRACE),
                cell(CANCEL_SCHEDULED, INVOICE_PAID, Kind.RECORD, CANCEL_SCHEDULED, HOLD_REFUND_AFTER_CANCEL),
                cell(EXPIRED, INVOICE_PAID, Kind.RECORD, EXPIRED, HOLD_REFUND_STALE),
                // E3 Failed
                cell(PENDING, INVOICE_FAILED, Kind.APPLY, PENDING, RECORD_FAILURE),
                cell(ACTIVE, INVOICE_FAILED, Kind.RECORD, ACTIVE, RECORD_FAILURE),
                cell(PAST_DUE, INVOICE_FAILED, Kind.APPLY, PAST_DUE, RECORD_FAILURE),
                cell(CANCEL_SCHEDULED, INVOICE_FAILED, Kind.RECORD, CANCEL_SCHEDULED, RECORD_FAILURE),
                cell(EXPIRED, INVOICE_FAILED, Kind.RECORD, EXPIRED, RECORD_FAILURE),
                // E4 현재 회차 전액 환불
                cell(PENDING, CURRENT_PERIOD_FULL_REFUND, Kind.RECORD, PENDING),
                cell(ACTIVE, CURRENT_PERIOD_FULL_REFUND, Kind.APPLY, EXPIRED, REVOKE_ROLE, END_PROVIDER),
                cell(PAST_DUE, CURRENT_PERIOD_FULL_REFUND, Kind.APPLY, EXPIRED, REVOKE_ROLE, END_PROVIDER),
                cell(CANCEL_SCHEDULED, CURRENT_PERIOD_FULL_REFUND, Kind.APPLY, EXPIRED, REVOKE_ROLE, END_PROVIDER),
                cell(EXPIRED, CURRENT_PERIOD_FULL_REFUND, Kind.RECORD, EXPIRED),
                // E5 그 밖의 환불
                cell(PENDING, OTHER_REFUND, Kind.RECORD, PENDING),
                cell(ACTIVE, OTHER_REFUND, Kind.RECORD, ACTIVE),
                cell(PAST_DUE, OTHER_REFUND, Kind.RECORD, PAST_DUE),
                cell(CANCEL_SCHEDULED, OTHER_REFUND, Kind.RECORD, CANCEL_SCHEDULED),
                cell(EXPIRED, OTHER_REFUND, Kind.RECORD, EXPIRED),
                // E6 해지 요청
                cell(PENDING, CANCEL_REQUEST, Kind.APPLY, EXPIRED, END_PROVIDER),
                cell(ACTIVE, CANCEL_REQUEST, Kind.APPLY, CANCEL_SCHEDULED, FIX_END_AT),
                cell(PAST_DUE, CANCEL_REQUEST, Kind.APPLY, CANCEL_SCHEDULED, FIX_END_AT),
                cell(CANCEL_SCHEDULED, CANCEL_REQUEST, Kind.NOOP, CANCEL_SCHEDULED),
                cell(EXPIRED, CANCEL_REQUEST, Kind.NOOP, EXPIRED),
                // E7 대표 삭제
                cell(PENDING, OWNER_DELETE, Kind.REJECT, PENDING),
                cell(ACTIVE, OWNER_DELETE, Kind.REJECT, ACTIVE),
                cell(PAST_DUE, OWNER_DELETE, Kind.REJECT, PAST_DUE),
                cell(CANCEL_SCHEDULED, OWNER_DELETE, Kind.REJECT, CANCEL_SCHEDULED),
                cell(EXPIRED, OWNER_DELETE, Kind.NOOP, EXPIRED),
                // E8 기한 도래(기본 입력은 모두 기한 전)
                cell(PENDING, DUE, Kind.NOOP, PENDING),
                cell(ACTIVE, DUE, Kind.NOOP, ACTIVE),
                cell(PAST_DUE, DUE, Kind.NOOP, PAST_DUE),
                cell(CANCEL_SCHEDULED, DUE, Kind.NOOP, CANCEL_SCHEDULED),
                cell(EXPIRED, DUE, Kind.NOOP, EXPIRED),
                // E9 카드 만료
                cell(PENDING, PAYMENT_METHOD_EXPIRED, Kind.RECORD, PENDING),
                cell(ACTIVE, PAYMENT_METHOD_EXPIRED, Kind.APPLY, ACTIVE, MARK_PAYMENT_METHOD_EXPIRED),
                cell(PAST_DUE, PAYMENT_METHOD_EXPIRED, Kind.APPLY, PAST_DUE, MARK_PAYMENT_METHOD_EXPIRED),
                cell(CANCEL_SCHEDULED, PAYMENT_METHOD_EXPIRED, Kind.APPLY, CANCEL_SCHEDULED, MARK_PAYMENT_METHOD_EXPIRED),
                cell(EXPIRED, PAYMENT_METHOD_EXPIRED, Kind.NOOP, EXPIRED));
    }

    @Test void tableCoversEveryStatusAndEventExactlyOnce() {
        var pairs = table().stream().map(c -> c.from() + "/" + c.event()).collect(Collectors.toList());
        assertEquals(45, pairs.size());
        assertEquals(45, new HashSet<>(pairs).size());
        assertEquals(SubscriptionStatus.values().length * SubscriptionEvent.values().length, pairs.size());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("table")
    void everyCellMatchesPolicyTable(Cell cell) {
        assertOutcome(cell.kind(), cell.next(), cell.actions(),
                SubscriptionTransition.apply(cell.from(), cell.event(), BEFORE_DEADLINES));
    }

    @Test void pendingCheckoutResumesOnlyAnOpenAttempt() {
        assertOutcome(Kind.APPLY, PENDING, Set.of(RESUME_CHECKOUT),
                SubscriptionTransition.apply(PENDING, CHECKOUT_START, BEFORE_DEADLINES.withCheckoutOpen(true)));
    }

    @Test void expiredStoreMayResubscribeOnlyWhenAllowed() {
        assertOutcome(Kind.APPLY, EXPIRED, Set.of(CREATE_NEW_SUBSCRIPTION),
                SubscriptionTransition.apply(EXPIRED, CHECKOUT_START, BEFORE_DEADLINES.withResubscribeAllowed(true)));
    }

    @Test void activePaidExtendsOnlyForNextPeriod() {
        assertOutcome(Kind.APPLY, ACTIVE, Set.of(EXTEND_PERIOD),
                SubscriptionTransition.apply(ACTIVE, INVOICE_PAID, BEFORE_DEADLINES.withNextPeriodInvoice(true)));
    }

    @Test void activeFailureMovesToPastDueOnlyWhenConfirmedAndLatest() {
        assertOutcome(Kind.APPLY, PAST_DUE, Set.of(RECORD_FAILURE, SET_GRACE),
                SubscriptionTransition.apply(ACTIVE, INVOICE_FAILED, BEFORE_DEADLINES.withConfirmedLatestFailure(true, true)));
        for (var facts : List.of(BEFORE_DEADLINES.withConfirmedLatestFailure(true, false),
                BEFORE_DEADLINES.withConfirmedLatestFailure(false, true))) {
            assertOutcome(Kind.RECORD, ACTIVE, Set.of(RECORD_FAILURE),
                    SubscriptionTransition.apply(ACTIVE, INVOICE_FAILED, facts));
        }
    }

    @Test void pastDueCancelAfterPaidPeriodExpiresAndRevokes() {
        var ended = BEFORE_DEADLINES.withPaidThroughAt(NOW);
        assertOutcome(Kind.APPLY, EXPIRED, Set.of(REVOKE_ROLE, END_PROVIDER),
                SubscriptionTransition.apply(PAST_DUE, CANCEL_REQUEST, ended));
        assertOutcome(Kind.APPLY, CANCEL_SCHEDULED, Set.of(FIX_END_AT),
                SubscriptionTransition.apply(PAST_DUE, CANCEL_REQUEST, ended.withPaidThroughAt(NOW.plusSeconds(1))));
    }

    @Test void activeExpiresAtPaidThroughPlusSevenDaysInclusive() {
        var paidThrough = NOW.minus(Duration.ofDays(7));
        assertOutcome(Kind.APPLY, EXPIRED, Set.of(REVOKE_ROLE, END_PROVIDER),
                SubscriptionTransition.apply(ACTIVE, DUE, BEFORE_DEADLINES.withPaidThroughAt(paidThrough)));
        assertOutcome(Kind.NOOP, ACTIVE, Set.of(),
                SubscriptionTransition.apply(ACTIVE, DUE, BEFORE_DEADLINES.withPaidThroughAt(paidThrough.plusSeconds(1))));
    }

    @Test void pastDueExpiresAtGraceUntilInclusive() {
        assertOutcome(Kind.APPLY, EXPIRED, Set.of(REVOKE_ROLE, END_PROVIDER),
                SubscriptionTransition.apply(PAST_DUE, DUE, BEFORE_DEADLINES.withGraceUntil(NOW)));
        assertOutcome(Kind.NOOP, PAST_DUE, Set.of(),
                SubscriptionTransition.apply(PAST_DUE, DUE, BEFORE_DEADLINES.withGraceUntil(NOW.plusMillis(1))));
    }

    @Test void cancelScheduledExpiresAtEndAtInclusive() {
        assertOutcome(Kind.APPLY, EXPIRED, Set.of(REVOKE_ROLE, END_PROVIDER),
                SubscriptionTransition.apply(CANCEL_SCHEDULED, DUE, BEFORE_DEADLINES.withEndAt(NOW)));
    }

    @Test void missingDeadlineNeverExpires() {
        var none = SubscriptionFacts.at(NOW);
        for (var status : List.of(ACTIVE, PAST_DUE, CANCEL_SCHEDULED)) {
            assertEquals(Kind.NOOP, SubscriptionTransition.apply(status, DUE, none).kind(), status.name());
        }
    }

    @Test void pendingAndExpiredNeverExpireEvenLongAfterDeadlines() {
        var late = SubscriptionFacts.at(NOW.plus(Duration.ofDays(365)))
                .withPaidThroughAt(NOW).withGraceUntil(NOW).withEndAt(NOW);
        assertEquals(Kind.NOOP, SubscriptionTransition.apply(PENDING, DUE, late).kind());
        assertEquals(Kind.NOOP, SubscriptionTransition.apply(EXPIRED, DUE, late).kind());
    }

    @Test void rejectsMissingInputs() {
        assertThrows(IllegalArgumentException.class, () -> SubscriptionTransition.apply(null, DUE, BEFORE_DEADLINES));
        assertThrows(IllegalArgumentException.class, () -> SubscriptionTransition.apply(ACTIVE, null, BEFORE_DEADLINES));
        assertThrows(IllegalArgumentException.class, () -> SubscriptionTransition.apply(ACTIVE, DUE, null));
        assertThrows(IllegalArgumentException.class, () -> SubscriptionTransition.apply(ACTIVE, DUE, SubscriptionFacts.at(null)));
    }

    @Test void onlyRejectKindIsRejected() {
        for (var cell : table()) {
            var outcome = SubscriptionTransition.apply(cell.from(), cell.event(), BEFORE_DEADLINES);
            assertEquals(cell.kind() == Kind.REJECT, outcome.rejected(), cell.toString());
        }
        assertTrue(Stream.of(SubscriptionStatus.values()).filter(s -> s != EXPIRED).allMatch(SubscriptionStatus::isOpen));
        assertFalse(EXPIRED.isOpen());
    }

    private static void assertOutcome(Kind kind, SubscriptionStatus next, Set<SubscriptionAction> actions, Outcome actual) {
        assertEquals(kind, actual.kind());
        assertEquals(next, actual.next());
        assertEquals(actions, actual.actions());
    }
}
