package htms.QROrder.system.billing.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

import static htms.QROrder.system.billing.domain.SubscriptionAction.*;
import static htms.QROrder.system.billing.domain.SubscriptionStatus.*;

/**
 * 정책 4C §3 상태 표(5상태 x 9이벤트)를 그대로 옮긴 순수 함수. DB/시계/제공자를 모른다.
 * 호출자는 구독 행을 잠근 뒤 다시 읽은 값으로 {@link SubscriptionFacts}를 만들어 넘긴다.
 */
public final class SubscriptionTransition {
    /** 갱신 실패 유예. 이미 낸 기간 끝 + 7일. */
    public static final Duration GRACE = Duration.ofDays(7);

    private SubscriptionTransition() {}

    public enum Kind {
        /** 상태 변경 또는 부수 작업 실행. */
        APPLY,
        /** 인보이스/이벤트 기록만. 권한/상태 변화 없음. */
        RECORD,
        /** 할 일 없음. 멱등 200. */
        NOOP,
        /** 허용되지 않음. 409. */
        REJECT
    }

    public record Outcome(Kind kind, SubscriptionStatus next, Set<SubscriptionAction> actions) {
        public Outcome {
            actions = actions.isEmpty() ? Set.of() : Set.copyOf(EnumSet.copyOf(actions));
        }

        public boolean rejected() {
            return kind == Kind.REJECT;
        }
    }

    public static Outcome apply(SubscriptionStatus current, SubscriptionEvent event, SubscriptionFacts facts) {
        if (current == null || event == null || facts == null || facts.now() == null) {
            throw new IllegalArgumentException("status, event and facts.now are required");
        }
        return switch (event) {
            case CHECKOUT_START -> checkoutStart(current, facts);
            case INVOICE_PAID -> invoicePaid(current, facts);
            case INVOICE_FAILED -> invoiceFailed(current, facts);
            case CURRENT_PERIOD_FULL_REFUND -> switch (current) {
                case ACTIVE, PAST_DUE, CANCEL_SCHEDULED -> expire();
                case PENDING, EXPIRED -> record(current);
            };
            case OTHER_REFUND -> record(current);
            case CANCEL_REQUEST -> cancelRequest(current, facts);
            case OWNER_DELETE -> current == EXPIRED ? noop(current) : reject(current);
            case DUE -> due(current, facts);
            case PAYMENT_METHOD_EXPIRED -> switch (current) {
                case PENDING -> record(current);
                case ACTIVE, PAST_DUE, CANCEL_SCHEDULED -> change(current, MARK_PAYMENT_METHOD_EXPIRED);
                case EXPIRED -> noop(current);
            };
        };
    }

    private static Outcome checkoutStart(SubscriptionStatus current, SubscriptionFacts facts) {
        return switch (current) {
            case PENDING -> change(PENDING, facts.checkoutOpen() ? RESUME_CHECKOUT : START_NEW_CHECKOUT);
            case PAST_DUE -> change(PAST_DUE, REREGISTER_PAYMENT_METHOD);
            case EXPIRED -> facts.resubscribeAllowed() ? change(EXPIRED, CREATE_NEW_SUBSCRIPTION) : reject(EXPIRED);
            case ACTIVE, CANCEL_SCHEDULED -> reject(current);
        };
    }

    private static Outcome invoicePaid(SubscriptionStatus current, SubscriptionFacts facts) {
        return switch (current) {
            case PENDING -> change(ACTIVE, GRANT_ROLE, EXTEND_PERIOD);
            case ACTIVE -> facts.nextPeriodInvoice() ? change(ACTIVE, EXTEND_PERIOD) : record(ACTIVE);
            case PAST_DUE -> change(ACTIVE, EXTEND_PERIOD, CLEAR_GRACE);
            case CANCEL_SCHEDULED -> new Outcome(Kind.RECORD, CANCEL_SCHEDULED, Set.of(HOLD_REFUND_AFTER_CANCEL));
            case EXPIRED -> new Outcome(Kind.RECORD, EXPIRED, Set.of(HOLD_REFUND_STALE));
        };
    }

    private static Outcome invoiceFailed(SubscriptionStatus current, SubscriptionFacts facts) {
        if (current == PENDING || current == PAST_DUE) {
            return change(current, RECORD_FAILURE);
        }
        if (current == ACTIVE) {
            return facts.providerConfirmedFailed() && facts.latestOpenInvoice()
                    ? change(PAST_DUE, RECORD_FAILURE, SET_GRACE)
                    : new Outcome(Kind.RECORD, ACTIVE, Set.of(RECORD_FAILURE));
        }
        // C/X는 인보이스/이벤트 기록만 한다. 구독 행(last_failure_code)도 건드리지 않는다(§3 E3).
        return record(current);
    }

    private static Outcome cancelRequest(SubscriptionStatus current, SubscriptionFacts facts) {
        return switch (current) {
            case PENDING -> change(EXPIRED, END_PROVIDER);
            case ACTIVE -> change(CANCEL_SCHEDULED, FIX_END_AT);
            case PAST_DUE -> reached(facts.now(), facts.paidThroughAt())
                    ? expire() : change(CANCEL_SCHEDULED, FIX_END_AT);
            case CANCEL_SCHEDULED, EXPIRED -> noop(current);
        };
    }

    private static Outcome due(SubscriptionStatus current, SubscriptionFacts facts) {
        boolean reached = switch (current) {
            case ACTIVE -> facts.paidThroughAt() != null && reached(facts.now(), facts.paidThroughAt().plus(GRACE));
            case PAST_DUE -> reached(facts.now(), facts.graceUntil());
            case CANCEL_SCHEDULED -> reached(facts.now(), facts.endAt());
            case PENDING, EXPIRED -> false;
        };
        return reached ? expire() : noop(current);
    }

    /** 기한 비교는 {@code now >= deadline}. 기한이 없으면 도래하지 않은 것으로 본다. */
    private static boolean reached(Instant now, Instant deadline) {
        return deadline != null && !now.isBefore(deadline);
    }

    private static Outcome expire() {
        return change(EXPIRED, REVOKE_ROLE, END_PROVIDER);
    }

    private static Outcome change(SubscriptionStatus next, SubscriptionAction... actions) {
        return new Outcome(Kind.APPLY, next, actions.length == 0 ? Set.of() : EnumSet.of(actions[0], actions));
    }

    private static Outcome record(SubscriptionStatus current) {
        return new Outcome(Kind.RECORD, current, Set.of());
    }

    private static Outcome noop(SubscriptionStatus current) {
        return new Outcome(Kind.NOOP, current, Set.of());
    }

    private static Outcome reject(SubscriptionStatus current) {
        return new Outcome(Kind.REJECT, current, Set.of());
    }
}
