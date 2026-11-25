package htms.QROrder.auth;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.repository.SignUpMapper;
import htms.QROrder.auth.service.BusinessRegistrationVerifier;
import htms.QROrder.auth.service.LocalFakeBusinessRegistrationVerifier;
import htms.QROrder.auth.service.NtsBusinessRegistrationVerifier;
import htms.QROrder.auth.service.SignUpService;
import htms.QROrder.config.BusinessVerifierConfig;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** 가짜 사업자 확인은 local 프로필 + 설정 + 루프백 DB에서만, 기본은 NTS(결정 3). */
class BusinessVerifierProfileTest {
    private static final String LOCAL_DB = "spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo";

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(BusinessVerifierConfig.class)
            .withPropertyValues("nts.api.service-key=dummy");

    @Test void defaultProfileKeepsRealNtsVerifier() {
        runner.withPropertyValues(LOCAL_DB, "signup.business-verifier=fake").run(context -> {
            assertNull(context.getStartupFailure());
            assertInstanceOf(NtsBusinessRegistrationVerifier.class, context.getBean(BusinessRegistrationVerifier.class));
        });
    }

    @Test void localProfileWithoutSettingKeepsNts() {
        runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local")).withPropertyValues(LOCAL_DB)
                .run(context -> assertInstanceOf(NtsBusinessRegistrationVerifier.class,
                        context.getBean(BusinessRegistrationVerifier.class)));
    }

    @Test void localProfileWithFakeSettingUsesOnlyListedNumbers() {
        runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues(LOCAL_DB, "signup.business-verifier=fake",
                        "signup.fake-business.numbers=999-00-00001, 9990000002")
                .run(context -> {
                    var verifier = context.getBean(BusinessRegistrationVerifier.class);
                    assertInstanceOf(LocalFakeBusinessRegistrationVerifier.class, verifier);
                    assertTrue(verifier.isValid("9990000001", LocalDate.of(2020, 1, 2), "대표"));
                    assertTrue(verifier.isValid("9990000002", LocalDate.of(2020, 1, 2), "대표"));
                    assertFalse(verifier.isValid("1234567890", LocalDate.of(2020, 1, 2), "대표"));
                });
    }

    @Test void fakeVerifierRefusesToStartOnRemoteOrTunneledDatabase() {
        var local = runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local"));
        local.withPropertyValues("spring.datasource.url=jdbc:postgresql://10.0.0.5:5432/qr",
                        "signup.business-verifier=fake")
                .run(context -> assertNotNull(context.getStartupFailure()));
        local.withPropertyValues("spring.datasource.url=jdbc:postgresql://localhost:15432/team", "ssh.enabled=true",
                        "signup.business-verifier=fake")
                .run(context -> assertNotNull(context.getStartupFailure()));
        for (String url : new String[]{"jdbc:postgresql://localhost/qr?PGHOST=10.0.0.5",
                "jdbc:postgresql://127.0.0.1/qr?socketFactory=org.example.Proxy",
                "jdbc:postgresql://localhost/qr?service=no-such-service"}) {
            local.withPropertyValues("spring.datasource.url=" + url, "signup.business-verifier=fake")
                    .run(context -> assertNotNull(context.getStartupFailure(), url));
        }
    }

    @Test void signupCheckWithFakeVerifierPassesListedNumberAndRejectsOthers() {
        var verifier = new LocalFakeBusinessRegistrationVerifier("9990000001",
                "jdbc:postgresql://127.0.0.1:55432/qrdemo", false);
        var service = new SignUpService(mock(SignUpMapper.class), mock(SubscriptionMapper.class),
                mock(PasswordEncoder.class), verifier);
        assertDoesNotThrow(() -> service.chkBRN(request("999-00-00001")));
        assertThrows(BusinessRegiException.class, () -> service.chkBRN(request("1234567890")));
    }

    private static SignUpRequest request(String number) {
        var request = new SignUpRequest();
        request.setBusinessRegiNum(number);
        request.setBusinessRegiDate(LocalDate.of(2020, 1, 2));
        request.setUserNm("대표");
        return request;
    }
}
