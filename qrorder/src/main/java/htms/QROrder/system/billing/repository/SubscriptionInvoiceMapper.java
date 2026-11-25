package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** sys_subscription_invoice 접근. 구독 행을 잠근 뒤에만 호출한다({@link SubscriptionMapper} 잠금 순서). */
@Mapper
public interface SubscriptionInvoiceMapper {
    SubscriptionInvoice lockByProviderInvoice(@Param("provider") String provider,
                                              @Param("providerStoreId") String providerStoreId,
                                              @Param("providerInvoiceId") String providerInvoiceId);

    int insertInvoice(SubscriptionInvoice invoice);

    /** 재조회 값으로 덮어쓴다. 호출자가 provider_updated_at이 더 새롭고 상태 이동이 허용될 때만 부른다. */
    int updateFromProvider(SubscriptionInvoice invoice);

    /** 구독의 인보이스, 기간 시작 최신순. */
    List<SubscriptionInvoice> listBySubscription(@Param("subscriptionSysId") String subscriptionSysId);
}
