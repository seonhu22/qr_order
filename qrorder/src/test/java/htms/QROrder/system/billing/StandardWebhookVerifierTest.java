package htms.QROrder.system.billing;

import htms.QROrder.system.billing.webhook.StandardWebhookVerifier;
import htms.QROrder.system.billing.webhook.WebhookVerificationException;
import htms.QROrder.system.billing.webhook.WebhookVerificationException.Reason;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/** Standard Webhooks 검증: 정상/서명/5분/헤더 누락/상수 시간 비교(정책 4C §11 행 7). */
class StandardWebhookVerifierTest {
    private static final byte[] KEY = "test-only-webhook-key-32-bytes!!".getBytes(StandardCharsets.UTF_8);
    private static final String SECRET = "whsec_" + Base64.getEncoder().encodeToString(KEY);
    private static final Instant NOW = Instant.parse("2026-11-25T00:00:00Z");
    private static final long TS = NOW.getEpochSecond();
    private static final byte[] BODY = "{\"type\":\"Invoice.Paid\",\"data\":{\"invoiceId\":\"inv-1\"}}"
            .getBytes(StandardCharsets.UTF_8);
    private final StandardWebhookVerifier verifier = new StandardWebhookVerifier(SECRET, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test void validSignatureMatchesIndependentHmac() throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(KEY, "HmacSHA256"));
        mac.update(("msg_1." + TS + ".").getBytes(StandardCharsets.UTF_8));
        String independent = "v1," + Base64.getEncoder().encodeToString(mac.doFinal(BODY));
        assertEquals(independent, verifier.sign("msg_1", TS, BODY));
        assertDoesNotThrow(() -> verifier.verify("msg_1", String.valueOf(TS), independent, BODY));
    }

    @Test void secretWithoutPrefixIsSameKey() {
        var raw = new StandardWebhookVerifier(Base64.getEncoder().encodeToString(KEY), Clock.fixed(NOW, ZoneOffset.UTC));
        assertDoesNotThrow(() -> raw.verify("msg_1", String.valueOf(TS), verifier.sign("msg_1", TS, BODY), BODY));
    }

    @Test void anyOfSeveralSignaturesMayMatchDuringSecretRotation() {
        String other = new StandardWebhookVerifier("whsec_" + Base64.getEncoder().encodeToString(new byte[32]),
                Clock.fixed(NOW, ZoneOffset.UTC)).sign("msg_1", TS, BODY);
        String header = other + " v2,ignored " + verifier.sign("msg_1", TS, BODY);
        assertDoesNotThrow(() -> verifier.verify("msg_1", String.valueOf(TS), header, BODY));
    }

    @Test void tamperedBodyIdOrTimestampIsRejected() {
        String signature = verifier.sign("msg_1", TS, BODY);
        assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_1", String.valueOf(TS), signature,
                "{\"type\":\"Invoice.Paid\",\"data\":{\"invoiceId\":\"inv-2\"}}".getBytes(StandardCharsets.UTF_8)));
        assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_2", String.valueOf(TS), signature, BODY));
        assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_1", String.valueOf(TS + 1), signature, BODY));
    }

    @Test void wrongSecretOrMalformedSignatureIsRejected() {
        String wrong = new StandardWebhookVerifier("whsec_" + Base64.getEncoder().encodeToString(new byte[32]),
                Clock.fixed(NOW, ZoneOffset.UTC)).sign("msg_1", TS, BODY);
        assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_1", String.valueOf(TS), wrong, BODY));
        String good = verifier.sign("msg_1", TS, BODY).substring(3);
        for (String header : new String[]{"v2," + good, good, "v1,***", "v1,", ","}) {
            assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_1", String.valueOf(TS), header, BODY));
        }
    }

    @Test void comparisonRejectsSignaturesDifferingAnywhereOrInLength() {
        // 상수 시간 비교(MessageDigest.isEqual)는 앞/뒤 바이트 차이와 길이 차이를 같은 경로로 거절한다.
        byte[] good = Base64.getDecoder().decode(verifier.sign("msg_1", TS, BODY).substring(3));
        byte[] first = good.clone(); first[0] ^= 1;
        byte[] last = good.clone(); last[last.length - 1] ^= 1;
        byte[] shorter = java.util.Arrays.copyOf(good, good.length - 1);
        for (byte[] candidate : new byte[][]{first, last, shorter, new byte[0]}) {
            String header = "v1," + Base64.getEncoder().encodeToString(candidate);
            assertReason(Reason.SIGNATURE_MISMATCH, () -> verifier.verify("msg_1", String.valueOf(TS), header, BODY));
        }
    }

    @Test void fiveMinuteToleranceIsInclusiveBothWays() {
        for (long ts : new long[]{TS - 300, TS + 300}) {
            assertDoesNotThrow(() -> verifier.verify("msg_1", String.valueOf(ts), verifier.sign("msg_1", ts, BODY), BODY));
        }
        for (long ts : new long[]{TS - 301, TS + 301}) {
            assertReason(Reason.TIMESTAMP_OUT_OF_TOLERANCE,
                    () -> verifier.verify("msg_1", String.valueOf(ts), verifier.sign("msg_1", ts, BODY), BODY));
        }
    }

    @Test void nonNumericTimestampIsRejected() {
        assertReason(Reason.INVALID_TIMESTAMP, () -> verifier.verify("msg_1", "2026-11-25T00:00:00Z",
                verifier.sign("msg_1", TS, BODY), BODY));
    }

    @Test void timestampOutsideInstantRangeIsRejectedNotThrown() {
        for (long ts : new long[]{Long.MAX_VALUE, Long.MIN_VALUE, 31556889864403200L, -31557014167219201L}) {
            assertReason(Reason.INVALID_TIMESTAMP, () -> verifier.verify("msg_1", String.valueOf(ts),
                    verifier.sign("msg_1", ts, BODY), BODY));
        }
    }

    @Test void missingHeadersAreRejected() {
        String signature = verifier.sign("msg_1", TS, BODY);
        String ts = String.valueOf(TS);
        assertReason(Reason.MISSING_HEADER, () -> verifier.verify(null, ts, signature, BODY));
        assertReason(Reason.MISSING_HEADER, () -> verifier.verify("msg_1", " ", signature, BODY));
        assertReason(Reason.MISSING_HEADER, () -> verifier.verify("msg_1", ts, null, BODY));
        assertReason(Reason.MISSING_HEADER, () -> verifier.verify("msg_1", ts, signature, null));
    }

    @Test void blankSecretIsAConfigurationError() {
        assertThrows(IllegalArgumentException.class, () -> new StandardWebhookVerifier(" ", Clock.systemUTC()));
    }

    private static void assertReason(Reason reason, org.junit.jupiter.api.function.Executable call) {
        assertEquals(reason, assertThrows(WebhookVerificationException.class, call).reason());
    }
}
