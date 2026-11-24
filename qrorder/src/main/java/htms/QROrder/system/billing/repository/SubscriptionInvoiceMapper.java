package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** sys_subscription_invoice 접근. 구독 행을 잠근 뒤에만 호출한다({@link SubscriptionMapper} 잠금 순서). */
@Mapper
public interface SubscriptionInvoiceMapper {
    SubscriptionInvoice lockByProviderInvoice(@Param("provider") String provider,
                                              @Param("providerStoreId") String providerStoreId,
                                              @Param("providerInvoiceId") String providerInvoiceId);

    int insertInvoice(SubscriptionInvoice invoice);
}
