package htms.QROrder.system.billing.webhook;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Standard Webhooks 서명 검증(정책 4C §7 1단계). 포트원 V2 웹훅이 이 규격을 따른다.
 * 서명 = {@code v1,base64(HMAC-SHA256(key, id + "." + timestamp + "." + body))}, 시크릿 = {@code whsec_<base64 key>}.
 * 헤더 {@code webhook-signature}에는 공백으로 나눈 서명이 여러 개 올 수 있고(시크릿 교체 중), 하나만 맞으면 통과한다.
 */
public final class StandardWebhookVerifier {
    public static final String HEADER_ID = "webhook-id";
    public static final String HEADER_TIMESTAMP = "webhook-timestamp";
    public static final String HEADER_SIGNATURE = "webhook-signature";
    /** 전송 시각 허용 차이(앞뒤 각각). */
    public static final Duration TOLERANCE = Duration.ofMinutes(5);
    private static final String SECRET_PREFIX = "whsec_";
    private static final String VERSION = "v1";

    private final byte[] key;
    private final Clock clock;

    public StandardWebhookVerifier(String secret, Clock clock) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("webhook secret is required");
        }
        String encoded = secret.startsWith(SECRET_PREFIX) ? secret.substring(SECRET_PREFIX.length()) : secret;
        this.key = Base64.getDecoder().decode(encoded);
        this.clock = clock;
    }

    /** 실패하면 {@link WebhookVerificationException}. 호출자는 401로 답하고 DB에 아무것도 쓰지 않는다. */
    public void verify(String webhookId, String timestamp, String signatureHeader, byte[] body) {
        if (isBlank(webhookId) || isBlank(timestamp) || isBlank(signatureHeader) || body == null) {
            throw new WebhookVerificationException(WebhookVerificationException.Reason.MISSING_HEADER);
        }
        long seconds;
        try {
            seconds = Long.parseLong(timestamp.trim());
        } catch (NumberFormatException invalid) {
            throw new WebhookVerificationException(WebhookVerificationException.Reason.INVALID_TIMESTAMP);
        }
        Instant sentAt = Instant.ofEpochSecond(seconds);
        Instant now = clock.instant();
        if (sentAt.isBefore(now.minus(TOLERANCE)) || sentAt.isAfter(now.plus(TOLERANCE))) {
            throw new WebhookVerificationException(WebhookVerificationException.Reason.TIMESTAMP_OUT_OF_TOLERANCE);
        }
        byte[] expected = hmac(webhookId, seconds, body);
        boolean matched = false;
        for (String candidate : signatureHeader.trim().split("\\s+")) {
            int comma = candidate.indexOf(',');
            if (comma <= 0 || !VERSION.equals(candidate.substring(0, comma))) continue;
            byte[] actual;
            try {
                actual = Base64.getDecoder().decode(candidate.substring(comma + 1));
            } catch (IllegalArgumentException notBase64) {
                continue;
            }
            // 상수 시간 비교. 다른 후보가 먼저 맞아도 남은 후보를 계속 비교해 시간 차이를 줄인다.
            matched |= MessageDigest.isEqual(expected, actual);
        }
        if (!matched) {
            throw new WebhookVerificationException(WebhookVerificationException.Reason.SIGNATURE_MISMATCH);
        }
    }

    /** 가짜 제공자와 테스트가 같은 규격으로 서명한다. */
    public String sign(String webhookId, long timestampSeconds, byte[] body) {
        return VERSION + "," + Base64.getEncoder().encodeToString(hmac(webhookId, timestampSeconds, body));
    }

    private byte[] hmac(String webhookId, long timestampSeconds, byte[] body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            mac.update((webhookId + "." + timestampSeconds + ".").getBytes(StandardCharsets.UTF_8));
            return mac.doFinal(body);
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException("HmacSHA256 unavailable", impossible);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
