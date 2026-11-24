package htms.QROrder.config;

import htms.QROrder.auth.service.BusinessRegistrationVerifier;
import htms.QROrder.auth.service.LocalFakeBusinessRegistrationVerifier;
import htms.QROrder.auth.service.NtsBusinessRegistrationVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * 가입 사업자 확인기 선택. 가짜는 {@code local} 프로필 + {@code signup.business-verifier=fake} 일 때만,
 * 그 밖에는 언제나 국세청(NTS). 같은 클래스 안의 순서대로 평가되어 가짜가 없을 때 NTS가 등록된다.
 */
@Configuration
public class BusinessVerifierConfig {

    @Bean
    @Profile("local")
    @ConditionalOnProperty(name = "signup.business-verifier", havingValue = "fake")
    public BusinessRegistrationVerifier localFakeBusinessRegistrationVerifier(
            @Value("${signup.fake-business.numbers:}") String numbers,
            @Value("${spring.datasource.url:}") String jdbcUrl,
            @Value("${ssh.enabled:false}") boolean sshEnabled) {
        return new LocalFakeBusinessRegistrationVerifier(numbers, jdbcUrl, sshEnabled);
    }

    @Bean
    @ConditionalOnMissingBean(BusinessRegistrationVerifier.class)
    public BusinessRegistrationVerifier ntsBusinessRegistrationVerifier() {
        return new NtsBusinessRegistrationVerifier();
    }
}
