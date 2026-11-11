package htms.QROrder.config;

import htms.QROrder.auth.domain.Login;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.handler.MappedInterceptor;
import org.springframework.web.util.ServletRequestPathUtils;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ClientMenuBoundaryTest {
    private static class Registry extends InterceptorRegistry {
        List<Object> entries() { return getInterceptors(); }
    }
    private int status(String path, String role) throws Exception {
        var request = new MockHttpServletRequest("POST", path);
        var session = new MockHttpSession();
        var login = new Login();
        login.setUserRole(role);
        session.setAttribute("loginUser", login);
        session.setAttribute("role", "SUPER_ADMIN"); // Global role is not a store manager role.
        request.setSession(session);
        ServletRequestPathUtils.parseAndCache(request);
        var registry = new Registry();
        new WebConfig().addInterceptors(registry);
        var response = new MockHttpServletResponse();
        for (Object entry : registry.entries()) {
            var mapped = (MappedInterceptor) entry;
            if (mapped.matches(request) && !mapped.getInterceptor().preHandle(request, response, new Object())) break;
        }
        return response.getStatus();
    }
    @Test void onlyStoreManagerCanReadOrWriteMenus() throws Exception {
        for (String path : List.of("/api/client/menu_manage/menu/master/search",
                "/api/client/menu_manage/menu/detail/save", "/api/client/menu_manage/option/group/new",
                "/api/client/menu_manage/option/detail/save")) {
            assertEquals(403, status(path, "02"));
            assertEquals(403, status(path, null));
            assertEquals(200, status(path, "01"));
        }
    }
    @Test void staffRetainsOtherBusinessEndpoints() throws Exception {
        for (String path : List.of("/api/client/staff-call/settings", "/api/client/order_manage/status/search",
                "/api/client/payment_manage/history/master/search", "/api/client/consumer/menu/main")) {
            if (!path.contains("consumer")) assertEquals(200, status(path, "02"));
        }
    }
}
