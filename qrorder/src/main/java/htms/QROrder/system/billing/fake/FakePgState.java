package htms.QROrder.system.billing.fake;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 가짜 PG 상태. JSON 파일 한 개에 통째로 저장한다(가짜용 DDL 0개). */
public class FakePgState {
    public long sequence;
    public boolean webhooksEnabled = true;
    /** 0보다 크면 다음 조회가 그 횟수만큼 실패한다(503 재현). */
    public int lookupFailuresRemaining;
    /** attemptId → providerSubscriptionId. 같은 시도 키는 같은 등록을 돌려준다. */
    public Map<String, String> attempts = new LinkedHashMap<>();
    public Map<String, Sub> subscriptions = new LinkedHashMap<>();
    public Map<String, Invoice> invoices = new LinkedHashMap<>();
    public Map<String, Token> tokens = new LinkedHashMap<>();
    public List<Delivery> deliveries = new ArrayList<>();

    public static class Sub {
        public String subscriptionId;
        public String customerId;
        public String subscriptionSysId;
        public String ownerUserSysId;
        public String plantCd;
        public String productId;
        public int amount;
        public String currency;
        public int periodMonth;
        /** INCOMPLETE / ACTIVE / ENDED. */
        public String status;
        /** NONE / ACTIVE / EXPIRED. */
        public String paymentMethodStatus;
        public Instant updatedAt;
    }

    public static class Invoice {
        public String invoiceId;
        public String subscriptionId;
        public String customerId;
        public String productId;
        public String chargeKind;
        public String paymentMethod;
        public int amount;
        public int refundedAmount;
        public String currency;
        public String status;
        public int attemptCount;
        public Instant periodStartAt;
        public Instant periodEndAt;
        public Instant paidAt;
        public Instant updatedAt;
        public String failureCode;
    }

    /** 결제창 토큰: 1회용, 10분, 대표 sys_id와 구독에 결속. */
    public static class Token {
        public String token;
        public String subscriptionId;
        public String subscriptionSysId;
        public String ownerUserSysId;
        public Instant expiresAt;
        public boolean used;
        /** true = PAST_DUE 결제수단 재등록 창(ACTIVE 구독에만 열린다). */
        public boolean reregister;
    }

    /** 보낸(또는 꺼둬서 잃은) 웹훅. 재전송은 같은 webhookId/본문으로 한다. */
    public static class Delivery {
        public String webhookId;
        public String type;
        public String body;
        public Instant lastSentAt;
        /** HTTP 상태 코드, 꺼져 있으면 0(유실). */
        public int lastStatus;
        public int sendCount;
    }
}
