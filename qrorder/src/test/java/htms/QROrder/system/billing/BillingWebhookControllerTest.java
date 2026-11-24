package htms.QROrder.system.billing;

import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.config.WebConfig;
import htms.QROrder.system.billing.controller.BillingWebhookController;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.service.BillingWebhookService;
import htms.QROrder.system.billing.service.BillingWebhookService.Outcome;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.handler.MappedInterceptor;
import org.springframework.web.util.ServletRequestPathUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 웹훅 경로: 로그인 제외는 정확히 한 단계 경로만, 결과 → HTTP 상태, 켜지지 않은 제공자 404. */
class BillingWebhookControllerTest {
    private final BillingWebhookService service = mock(BillingWebhookService.class);
    private final BillingProvider fake = mock(BillingProvider.class);

    private MockMvc mvc(BillingProvider... providers) {
        var context = new StaticApplicationContext();
        for (int i = 0; i < providers.length; i++) context.getBeanFactory().registerSingleton("p" + i, providers[i]);
        context.refresh();
        ObjectProvider<BillingProvider> beans = context.getBeanProvider(BillingProvider.class);
        return MockMvcBuilders.standaloneSetup(new BillingWebhookController(beans, service)).build();
    }

    @Test void outcomesMapToHttpStatus() throws Exception {
        when(fake.name()).thenReturn("fake");
        var mvc = mvc(fake);
        for (var pair : List.of(List.of(Outcome.OK, 200), List.of(Outcome.UNAUTHORIZED, 401), List.of(Outcome.UNAVAILABLE, 503))) {
            when(service.handle(eq(fake), any(), any())).thenReturn((Outcome) pair.get(0));
            mvc.perform(post("/api/billing/webhook/fake").contentType("application/json").content("{}")
                            .header("webhook-id", "msg_1"))
                    .andExpect(status().is((Integer) pair.get(1)));
        }
        verify(service, times(3)).handle(eq(fake), argThat(h -> "msg_1".equals(h.get("webhook-id"))), any());
    }

    @Test void providerNotEnabledIs404AndServiceIsNotCalled() throws Exception {
        mvc().perform(post("/api/billing/webhook/fake").contentType("application/json").content("{}"))
                .andExpect(status().isNotFound());
        verifyNoInteractions(service);
    }

    @Test void onlyTheExactWebhookPathSkipsLogin() throws Exception {
        assertFalse(loginChecked("/api/billing/webhook/fake"));
        assertTrue(loginChecked("/api/billing/webhook/fake/extra"));
        assertTrue(loginChecked("/api/billing/webhook"));
        assertTrue(loginChecked("/api/billing/other"));
    }

    private static boolean loginChecked(String path) throws Exception {
        var registry = new InterceptorRegistry() {
            List<Object> entries() { return getInterceptors(); }
        };
        new WebConfig(mock(htms.QROrder.auth.repository.LoginMapper.class)).addInterceptors(registry);
        var request = new MockHttpServletRequest("POST", path);
        ServletRequestPathUtils.parseAndCache(request);
        return registry.entries().stream().map(MappedInterceptor.class::cast)
                .anyMatch(m -> m.getInterceptor() instanceof LoginCheckInterceptor && m.matches(request));
    }
}
