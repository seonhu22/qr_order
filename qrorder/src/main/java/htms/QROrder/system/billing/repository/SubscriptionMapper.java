package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.List;

/**
 * sys_subscription 접근과 구독 대표의 역할 변경.
 *
 * <p>잠금 순서(정책 4C §8): 모든 쓰기 트랜잭션은 sys_subscription, sys_subscription_invoice,
 * sys_billing_webhook_event, sys_user 순서로 잠근다. 여러 행이면 sys_id 오름차순.
 * 제공자 HTTP 호출은 잠금 밖에서 한다. lock* 메서드는 이 순서의 첫 단계다.
 */
@Mapper
public interface SubscriptionMapper {
    int insertSubscription(Subscription subscription);

    Subscription findOpenByPlant(@Param("plantCd") String plantCd);

    Subscription lockOpenByPlant(@Param("plantCd") String plantCd);

    /** 대표 계정들이 가진 진행 중 구독을 sys_id 순서로 잠근다. */
    List<Subscription> lockOpenByOwners(@Param("ownerUserSysIds") List<String> ownerUserSysIds);

    Subscription lockByProviderSubscription(@Param("provider") String provider,
                                            @Param("providerStoreId") String providerStoreId,
                                            @Param("providerSubscriptionId") String providerSubscriptionId);

    /** 대표 02를 01로. 잠긴 구독의 대표/매장과 일치할 때만 1행. */
    int grantOwnerRole(@Param("subscriptionSysId") String subscriptionSysId, @Param("userId") String userId);

    /** grantOwnerRole이 1행일 때만 호출한다. */
    int markRoleGranted(@Param("subscriptionSysId") String subscriptionSysId, @Param("now") Instant now,
                        @Param("userId") String userId);

    /** role_granted_yn='Y'이고 아직 회수 전일 때만 대표 01을 02로. */
    int revokeOwnerRole(@Param("subscriptionSysId") String subscriptionSysId, @Param("userId") String userId);

    /** SUPER_ADMIN 수동 승격: 이 구독이 올린 01을 영구 01로 바꿔 만료 회수 대상에서 뺀다. */
    int markRolePermanent(@Param("subscriptionSysId") String subscriptionSysId, @Param("userId") String userId);

    int markRoleRevoked(@Param("subscriptionSysId") String subscriptionSysId, @Param("now") Instant now,
                        @Param("userId") String userId);

    /** 스냅샷한 플랜의 sys_payment.payment_cd(제공자 상품 ID 매핑 키). 삭제 여부와 관계없이 읽는다. */
    String findPlanCode(@Param("planSysId") String planSysId);

    /** 구독 대표가 삭제되지 않았으면 그 역할(01/02), 아니면 null. 잠금 없는 읽기(대표는 고정). */
    String findOwnerRole(@Param("subscriptionSysId") String subscriptionSysId);

    /** Paid 반영: 상태 변경 + paid_through_at은 앞으로만, clearGrace면 grace_until 제거. 잠긴 행에만 호출. */
    int applyPaid(@Param("sysId") String sysId, @Param("status") String status,
                  @Param("periodEndAt") Instant periodEndAt, @Param("clearGrace") boolean clearGrace,
                  @Param("userId") String userId);

    Subscription findById(@Param("sysId") String sysId);

    Subscription lockById(@Param("sysId") String sysId);

    /** 매장의 대표 구독 1행: 진행 중이 있으면 그것, 없으면 가장 최근 것. 화면/재구독 판단용. */
    Subscription findLatestByPlant(@Param("plantCd") String plantCd);

    /** 결제 시도 선커밋: 플랜 스냅샷 + 새 시도 ID + 만료. 제공자 등록 ID는 비운다(새 등록으로 바뀜). 잠긴 PENDING 행에만. */
    int startCheckoutAttempt(@Param("sysId") String sysId, @Param("planSysId") String planSysId,
                             @Param("amount") int amount, @Param("currency") String currency,
                             @Param("periodMonth") int periodMonth, @Param("provider") String provider,
                             @Param("providerStoreId") String providerStoreId, @Param("attemptId") String attemptId,
                             @Param("expiresAt") Instant expiresAt, @Param("userId") String userId);

    /** 제공자 사전 등록 결과 저장. 같은 시도일 때만 1행. */
    int saveCheckoutRegistration(@Param("sysId") String sysId, @Param("attemptId") String attemptId,
                                 @Param("providerCustomerId") String providerCustomerId,
                                 @Param("providerSubscriptionId") String providerSubscriptionId,
                                 @Param("expiresAt") Instant expiresAt, @Param("userId") String userId);

    /** 판매 중 플랜(sys_payment, 원화, 금액/기간 양수, 삭제 안 됨). */
    List<SubscriptionPlan> findPlans();

    SubscriptionPlan findPlan(@Param("planSysId") String planSysId);

    /** 이 구독의 결제 진행 중(PENDING) 인보이스 수. 재구독 조건. */
    int countPendingInvoices(@Param("subscriptionSysId") String subscriptionSysId);

    /** E3 ACTIVE → PAST_DUE: 유예 끝 = paid_through_at + 7일, 실패 코드. 잠긴 행에만. */
    int markPastDue(@Param("sysId") String sysId, @Param("graceUntil") Instant graceUntil,
                    @Param("failureCode") String failureCode, @Param("userId") String userId);

    /** E3 PENDING/PAST_DUE: 실패 코드만 기록(유예 그대로). */
    int recordFailure(@Param("sysId") String sysId, @Param("failureCode") String failureCode,
                      @Param("userId") String userId);

    /** → EXPIRED. providerEndStatus = REQUESTED(제공자 구독 있음) 또는 DONE(등록 전). 잠긴 진행 중 행에만 1행. */
    int expire(@Param("sysId") String sysId, @Param("now") Instant now,
               @Param("providerEndStatus") String providerEndStatus, @Param("userId") String userId);

    /** 제공자 종료 요청 결과(DONE/FAILED). 요청 중(REQUESTED/FAILED)일 때만. */
    int markProviderEnd(@Param("sysId") String sysId, @Param("status") String status, @Param("userId") String userId);

    /**
     * 배치 대상(잠금 없이 고른 후보, 잠근 뒤 다시 판정한다): ACTIVE 기한+7일 도래, PAST_DUE 유예 끝, 해지 예약 끝,
     * 제공자 종료 재시도.
     */
    List<String> findBatchCandidates(@Param("asOf") Instant asOf, @Param("activeDeadline") Instant activeDeadline);

    /** E6 → CANCEL_SCHEDULED: end_at = paid_through_at 고정(예약 시점 값), cancel_requested_at. 잠긴 A/D 행에만. */
    int scheduleCancel(@Param("sysId") String sysId, @Param("now") Instant now, @Param("userId") String userId);

    /** E9 카드 만료 / 재등록: payment_method_status. 바뀔 때만 1행. */
    int markPaymentMethod(@Param("sysId") String sysId, @Param("status") String status, @Param("userId") String userId);
}
