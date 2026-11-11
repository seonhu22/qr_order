package htms.QROrder.config;

import htms.QROrder.auth.domain.Login;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.handler.MappedInterceptor;
import org.springframework.web.util.ServletRequestPathUtils;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class PasswordOwnerBoundaryTest {
    private static class Registry extends InterceptorRegistry {
        List<Object> entries() { return getInterceptors(); }
    }

    private MockHttpServletResponse request(String path, String target, boolean loggedIn) throws Exception {
        return request(path, target, loggedIn, "STAFF");
    }
    private MockHttpServletResponse request(String path, String target, boolean loggedIn, String role) throws Exception {
        var request = new MockHttpServletRequest("POST", path);
        if (target != null) request.setParameter("userId", target);
        if (loggedIn) {
            var login = new Login();
            login.setUserId("OWNER");
            var session = new MockHttpSession();
            session.setAttribute("loginUser", login);
            session.setAttribute("role", role);
            request.setSession(session);
        }
        ServletRequestPathUtils.parseAndCache(request);
        var registry = new Registry();
        new WebConfig().addInterceptors(registry);
        var response = new MockHttpServletResponse();
        for (Object entry : registry.entries()) {
            var mapped = (MappedInterceptor) entry;
            if (mapped.matches(request) && !mapped.getInterceptor().preHandle(request, response, new Object())) break;
        }
        return response;
    }

    @Test void rejectsOtherAccountForBothPasswordEndpoints() throws Exception {
        for (String path : List.of("/api/auth/init-pwd", "/api/auth/init-pwd-active")) {
            assertEquals(403, request(path, "OTHER", true).getStatus());
        }
    }
    @Test void allowsOwnerAndRejectsMissingOrAnonymousTarget() throws Exception {
        for (String path : List.of("/api/auth/init-pwd-active")) {
            assertEquals(200, request(path, "OWNER", true).getStatus());
            assertEquals(403, request(path, null, true).getStatus());
            assertEquals(401, request(path, "OWNER", false).getStatus());
        }
    }
    @Test void supportResetRequiresSystemAdminButActiveChangeRemainsOwnerOnly() throws Exception {
        assertEquals(200, request("/api/auth/init-pwd", "STORE-MANAGER", true, "SUPER_ADMIN").getStatus());
        assertEquals(403, request("/api/auth/init-pwd", "OWNER", true).getStatus());
        assertEquals(403, request("/api/auth/init-pwd-active", "OTHER", true, "SUPER_ADMIN").getStatus());
    }
    @Test void doesNotRestrictPublicPasswordRecovery() throws Exception {
        assertEquals(200, request("/api/auth/pwd_change", "OTHER", false).getStatus());
    }

    @Test void rejectedTargetNeverInvokesPasswordService() throws Exception {
        var service = org.mockito.Mockito.mock(htms.QROrder.auth.service.LoginService.class);
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .standaloneSetup(new htms.QROrder.auth.controller.LoginController(service))
                .addInterceptors(new htms.QROrder.auth.Interceptor.LoginCheckInterceptor(),
                        new htms.QROrder.auth.Interceptor.PasswordOwnerInterceptor()).build();
        var login = new Login(); login.setUserId("OWNER");
        for (String path : List.of("/api/auth/init-pwd", "/api/auth/init-pwd-active")) {
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)
                    .param("userId", "OTHER").sessionAttr("loginUser", login)
                    .contentType("application/json").content("{\"password\":\"test-password\",\"chkPassword\":\"test-password\"}"))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        }
        org.mockito.Mockito.verifyNoInteractions(service);
    }
}
