package htms.QROrder.system.billing.domain;

import lombok.Data;

/** 구독 플랜 = sys_payment 1행(정책 4C §5). 결제 시작 때 금액/기간을 구독 행에 스냅샷한다. */
@Data
public class SubscriptionPlan {
    private String planSysId;
    private String planCode;
    private String planName;
    private Integer amount;
    private String currency;
    private Integer periodMonth;
}
