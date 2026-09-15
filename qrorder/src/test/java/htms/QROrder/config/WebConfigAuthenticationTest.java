package htms.QROrder.config;

import htms.QROrder.auth.Interceptor.ConsumerAuthInterceptor;
import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.auth.Interceptor.RoleCheckInterceptor;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.handler.MappedInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.util.ServletRequestPathUtils;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 실제 WebConfig가 등록하는 경로 패턴을 검증한다.
 *
 * 컨트롤러 단위 테스트로는 경로 매칭 실수를 잡을 수 없어, 등록된 MappedInterceptor를 직접 확인한다.
 */
class WebConfigAuthenticationTest {

    /** InterceptorRegistry.getInterceptors()가 protected라 상속으로 열어 쓴다. */
    private static class ExposedRegistry extends InterceptorRegistry {
        List<Object> registered() {
            return getInterceptors();
        }
    }

    private static List<Object> registeredInterceptors() {
        ExposedRegistry registry = new ExposedRegistry();
        new WebConfig().addInterceptors(registry);
        return registry.registered();
    }

    /** 주어진 경로에 실제로 걸리는 인터셉터 타입 목록. */
    private static List<Class<?>> boundariesFor(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        // Spring 6의 MappedInterceptor는 PathPattern 매칭을 위해 파싱된 경로를 요구한다.
        ServletRequestPathUtils.parseAndCache(request);
        List<Class<?>> matched = new ArrayList<>();

        for (Object registered : registeredInterceptors()) {
            MappedInterceptor mapped = (MappedInterceptor) registered;
            if (mapped.matches(request)) {
                HandlerInterceptor interceptor = mapped.getInterceptor();
                matched.add(interceptor.getClass());
            }
        }

        return matched;
    }

    private static void assertGuardedBy(String path, Class<?> expected) {
        assertTrue(boundariesFor(path).contains(expected),
                path + " 는 " + expected.getSimpleName() + " 의 보호를 받아야 한다");
    }

    private static void assertNotGuardedBy(String path, Class<?> unexpected) {
        assertFalse(boundariesFor(path).contains(unexpected),
                path + " 는 " + unexpected.getSimpleName() + " 에 걸리면 안 된다");
    }

    // ---------- 두 경계가 겹치지 않는다 ----------

    @Test
    void consumerPathsAreGuardedOnlyByConsumerBoundary() {
        assertGuardedBy("/api/client/consumer/menu/main", ConsumerAuthInterceptor.class);
        assertNotGuardedBy("/api/client/consumer/menu/main", LoginCheckInterceptor.class);

        assertGuardedBy("/api/client/consumer/menu/search", ConsumerAuthInterceptor.class);
        assertNotGuardedBy("/api/client/consumer/menu/search", LoginCheckInterceptor.class);

        assertGuardedBy("/api/client/consumer/menu/01JABCDEF", ConsumerAuthInterceptor.class);
        assertNotGuardedBy("/api/client/consumer/menu/01JABCDEF", LoginCheckInterceptor.class);
    }

    @Test
    void staffPathsAreGuardedOnlyByStaffBoundary() {
        assertGuardedBy("/api/client/menu_manage/menu/master/search", LoginCheckInterceptor.class);
        assertNotGuardedBy("/api/client/menu_manage/menu/master/search", ConsumerAuthInterceptor.class);
    }

    /** 0824-1의 핵심: 타 매장 메뉴가 노출되던 경로가 직원 경계 안에 남아야 한다. */
    @Test
    void crossTenantMenuDetailPathStaysBehindStaffBoundary() {
        assertGuardedBy("/api/client/menu_manage/menu/detail/search/01JMASTER", LoginCheckInterceptor.class);
        assertNotGuardedBy("/api/client/menu_manage/menu/detail/search/01JMASTER", ConsumerAuthInterceptor.class);
    }

    /** 첨부파일 조회는 Consumer 경로가 아니므로 직원 경계가 지켜야 한다. */
    @Test
    void attachFileViewStaysBehindStaffBoundary() {
        assertGuardedBy("/api/attach_file/view", LoginCheckInterceptor.class);
        assertNotGuardedBy("/api/attach_file/view", ConsumerAuthInterceptor.class);
    }

    // ---------- 역할 검사는 직원 인증 뒤에 온다 ----------

    @Test
    void systemPathsRequireStaffAuthenticationBeforeRoleCheck() {
        List<Class<?>> boundaries = boundariesFor("/api/system/settings/plant/search");

        assertTrue(boundaries.contains(LoginCheckInterceptor.class), "직원 인증이 걸려야 한다");
        assertTrue(boundaries.contains(RoleCheckInterceptor.class), "역할 검사가 걸려야 한다");
        assertTrue(boundaries.indexOf(LoginCheckInterceptor.class) < boundaries.indexOf(RoleCheckInterceptor.class),
                "직원 인증이 역할 검사보다 먼저 실행되어야 한다");
    }

    @Test
    void menuSearchKeepsRoleCheckExemptionButStillRequiresLogin() {
        List<Class<?>> boundaries = boundariesFor("/api/system/settings/menu/search");

        assertTrue(boundaries.contains(LoginCheckInterceptor.class));
        assertFalse(boundaries.contains(RoleCheckInterceptor.class));
    }

    // ---------- 공개 경로는 그대로 열려 있다 ----------

    @Test
    void publicPathsStayOpen() {
        List<String> publicPaths = List.of(
                "/api/auth/login",
                "/api/auth/signup/new",
                "/api/auth/pwd_change",
                "/api/auth/email_valid/pwd_change/send",
                "/api/qr/qr-code-001",
                "/v3/api-docs/swagger-config",
                "/swagger-ui/index.html");

        for (String path : publicPaths) {
            assertTrue(boundariesFor(path).isEmpty(), path + " 는 인증 없이 열려 있어야 한다");
        }
    }
}
