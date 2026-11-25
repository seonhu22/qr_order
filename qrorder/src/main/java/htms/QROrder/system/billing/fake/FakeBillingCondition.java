package htms.QROrder.system.billing.fake;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.type.AnnotatedTypeMetadata;

/** 가짜 PG는 {@code local} 프로필 + {@code billing.provider=fake} 둘 다일 때만 켜진다(정책 §6). */
public class FakeBillingCondition implements Condition {
    public static boolean enabled(Environment environment) {
        return environment.acceptsProfiles(Profiles.of("local"))
                && "fake".equals(environment.getProperty("billing.provider"));
    }

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return enabled(context.getEnvironment());
    }

    /** 가짜 PG가 꺼져 있을 때. */
    public static class Disabled implements Condition {
        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return !enabled(context.getEnvironment());
        }
    }
}
