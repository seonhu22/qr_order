package htms.QROrder.system.billing.dto;

import lombok.Data;

import java.time.Instant;

/** Admin 구독 목록 1행(조회 결과 그대로). problemCount = 미해결 문제 인보이스 수(MISMATCH/STALE/AFTER_CANCEL/OWNER_MISSING). */
@Data
public class AdminSubscriptionRow {
    private String subscriptionSysId;
    private String plantCd;
    private String plantNm;
    private String ownerUserSysId;
    private String ownerUserId;
    private String ownerUserNm;
    private String ownerUserRole;
    private String status;
    private String planName;
    private Integer amount;
    private Instant paidThroughAt;
    private Instant graceUntil;
    private Instant endAt;
    private Instant expiredAt;
    private String roleGrantedYn;
    private String paymentMethodStatus;
    private String providerEndStatus;
    private String lastFailureCode;
    private Integer problemCount;
}
