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

    /**
     * 이 제공자 인보이스들을 기록한 구독(정확히 1개일 때만, 아니면 null). 연결이 끊긴 옛 등록의 새 청구를
     * 그 구독의 문제 건으로 남길 때 쓴다. 잠금 없는 읽기(호출자가 이어서 구독 행을 잠근다).
     */
    String findSubscriptionOfProviderInvoices(@Param("provider") String provider,
                                              @Param("providerStoreId") String providerStoreId,
                                              @Param("providerInvoiceIds") List<String> providerInvoiceIds);

    SubscriptionInvoice findById(@Param("sysId") String sysId);

    /** 구독의 인보이스, 기간 시작 최신순. */
    List<SubscriptionInvoice> listBySubscription(@Param("subscriptionSysId") String subscriptionSysId);
}
