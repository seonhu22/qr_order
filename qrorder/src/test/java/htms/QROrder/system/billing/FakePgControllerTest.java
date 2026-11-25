package htms.QROrder.system.billing;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.system.billing.fake.FakeBillingConfig;
import htms.QROrder.system.billing.fake.FakeBillingProvider;
import htms.QROrder.system.billing.fake.FakePgController;
import htms.QROrder.system.billing.fake.FakePgDisabledController;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;
import java.time.Clock;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 결제창/콘솔: 루프백만, 대표 본인만, 1회용. 기본 프로필은 /fake-pg 404(정책 §11 행 8). */
class FakePgControllerTest {
    @TempDir Path dir;
    private FakeBillingProvider provider;
    private MockMvc mvc;
    private String token;
    private String subscriptionId;

    @BeforeEach void setUp() {
        provider = new FakeBillingProvider(dir.resolve("state.json"), "store-test", FakeBillingProviderTest.SECRET,
                "http://localhost:8080", Clock.systemUTC(), (headers, body) -> 200);
        mvc = MockMvcBuilders.standaloneSetup(new FakePgController(provider, "http://localhost:3000/client/subscription/result"))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        var launch = provider.startCheckout(new CheckoutRequest("SUB-1", "OWNER-1", "1234567890", "BASIC_MONTHLY",
                29000, "KRW", 1, "att-1"));
        String url = launch.launch().get("redirectUrl");
        token = url.substring(url.indexOf("token=") + 6);
        subscriptionId = launch.providerSubscriptionId();
    }

    private static RequestPostProcessor from(String address) {
        return request -> { request.setRemoteAddr(address); return request; };
    }

    private static MockHttpSession loggedIn(String sysId) {
        var login = new Login();
        login.setSysId(sysId);
        login.setUserId(sysId);
        var session = new MockHttpSession();
        session.setAttribute("loginUser", login);
        return session;
    }

    @Test void nonLoopbackRequestsAre403Everywhere() throws Exception {
        mvc.perform(get("/fake-pg/console").with(from("10.0.0.5"))).andExpect(status().isForbidden());
        mvc.perform(get("/fake-pg/checkout").param("token", token).session(loggedIn("OWNER-1")).with(from("192.168.0.9")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/fake-pg/checkout").param("token", token).param("scenario", "SUCCESS")
                .session(loggedIn("OWNER-1")).with(from("10.0.0.5"))).andExpect(status().isForbidden());
        mvc.perform(post("/fake-pg/console/webhooks").param("enabled", "false").with(from("10.0.0.5")))
                .andExpect(status().isForbidden());
        assertTrue(provider.snapshot().webhooksEnabled);
        assertNotNull(provider.peekToken(token, "OWNER-1"));
    }

    @Test void checkoutPageNeedsLoginAndTheOwner() throws Exception {
        mvc.perform(get("/fake-pg/checkout").param("token", token)).andExpect(status().isUnauthorized());
        mvc.perform(get("/fake-pg/checkout").param("token", token).session(loggedIn("OTHER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/fake-pg/checkout").param("token", token).session(loggedIn("OWNER-1")))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("29000 KRW")))
                .andExpect(content().string(containsString("카드 결제 성공")));
    }

    @Test void ownerPaysOnceAndTokenCannotBeReused() throws Exception {
        mvc.perform(post("/fake-pg/checkout").param("token", token).param("scenario", "SUCCESS")
                        .session(loggedIn("OWNER-1")))
                .andExpect(status().isOk()).andExpect(content().string(containsString("결제 완료")));
        assertEquals("ACTIVE", provider.getSubscription(subscriptionId).status());
        mvc.perform(post("/fake-pg/checkout").param("token", token).param("scenario", "SUCCESS")
                .session(loggedIn("OWNER-1"))).andExpect(status().isForbidden());
        assertEquals(1, provider.snapshot().invoices.size());
    }

    @Test void consoleShowsStateAndActionsRedirectBack() throws Exception {
        provider.pay(token, "OWNER-1", FakeBillingProvider.CardScenario.SUCCESS);
        mvc.perform(get("/fake-pg/console")).andExpect(status().isOk())
                .andExpect(content().string(containsString(subscriptionId)))
                .andExpect(content().string(containsString("Invoice.Paid")));
        mvc.perform(post("/fake-pg/console/next-period").param("subscriptionId", subscriptionId).param("success", "false"))
                .andExpect(status().isSeeOther());
        assertEquals(2, provider.snapshot().invoices.size());
        mvc.perform(post("/fake-pg/console/lookup-failures").param("count", "2")).andExpect(status().isSeeOther());
        assertEquals(2, provider.snapshot().lookupFailuresRemaining);
        mvc.perform(post("/fake-pg/console/refund").param("invoiceId", "nope").param("amount", "1"))
                .andExpect(status().isBadRequest());
    }

    @Test void disabledControllerAnswers404ForAnyFakePgPath() throws Exception {
        var disabled = MockMvcBuilders.standaloneSetup(new FakePgDisabledController()).build();
        disabled.perform(get("/fake-pg/console")).andExpect(status().isNotFound());
        disabled.perform(get("/fake-pg")).andExpect(status().isNotFound());
        disabled.perform(post("/fake-pg/checkout").param("token", "x")).andExpect(status().isNotFound());
    }

    @Test void fakeProviderRefusesToStartWhenDriverWouldReachAnotherHost() {
        String file = "billing.fake.state-file=" + dir.resolve("guard.json").toString().replace('\\', '/');
        var runner = new ApplicationContextRunner().withUserConfiguration(FakeBillingConfig.class)
                .withInitializer(c -> c.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues("billing.provider=fake", file);
        for (String url : new String[]{"jdbc:postgresql://localhost/qr?PGHOST=10.0.0.5",
                "jdbc:postgresql://127.0.0.1:1,db.example.com:2/qr",
                "jdbc:postgresql://127.0.0.1/qr?socketFactoryArg=10.0.0.5",
                "jdbc:postgresql://localhost/qr?service=no-such-service"}) {
            runner.withPropertyValues("spring.datasource.url=" + url)
                    .run(context -> assertNotNull(context.getStartupFailure(), url));
        }
        runner.withPropertyValues("spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo", "ssh.enabled=true")
                .run(context -> assertNotNull(context.getStartupFailure()));
        runner.withPropertyValues("spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo")
                .run(context -> assertNull(context.getStartupFailure()));
    }

    @Test void defaultProfileRegistersOnlyTheNotFoundController() {
        String file = "billing.fake.state-file=" + dir.resolve("ctx.json").toString().replace('\\', '/');
        var runner = new ApplicationContextRunner()
                .withUserConfiguration(FakeBillingConfig.class, FakePgController.class, FakePgDisabledController.class)
                .withPropertyValues("billing.provider=fake", file,
                        "spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo");
        runner.run(context -> {
            assertTrue(context.getBeansOfType(FakePgController.class).isEmpty());
            assertEquals(1, context.getBeansOfType(FakePgDisabledController.class).size());
        });
        runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local")).run(context -> {
            assertEquals(1, context.getBeansOfType(FakePgController.class).size());
            assertTrue(context.getBeansOfType(FakePgDisabledController.class).isEmpty());
        });
    }
}
