package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.Subscription;
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
}
