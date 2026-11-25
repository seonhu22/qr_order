package htms.QROrder.system.billing.provider;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 켜진 결제 제공자 찾기. 한 번에 하나만 켠다(local = 가짜, 그 밖 = 없음). 제공자 상품 ID 매핑도 여기서 한다(정책 §5).
 */
@Component
public class BillingProviderRegistry {
    private final List<BillingProvider> providers;

    @Autowired
    public BillingProviderRegistry(ObjectProvider<BillingProvider> providers) {
        this(providers.orderedStream().toList());
    }

    public BillingProviderRegistry(List<BillingProvider> providers) {
        this.providers = List.copyOf(providers);
    }

    /** 결제 시작에 쓰는 제공자. 없으면 결제를 열 수 없다. */
    public Optional<BillingProvider> active() {
        return providers.stream().findFirst();
    }

    /** 구독 행의 provider 열로 찾는다. */
    public Optional<BillingProvider> find(String name) {
        return name == null ? Optional.empty() : providers.stream().filter(p -> p.name().equals(name)).findFirst();
    }

    /** {@code billing.products.<payment_cd>}, 없으면 payment_cd 그대로(가짜). */
    public static String productIdFor(Environment environment, String planCode) {
        return planCode == null ? null : environment.getProperty("billing.products." + planCode, planCode);
    }
}
