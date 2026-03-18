package htms.QROrder.auth.Interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class RoleCheckInterceptor implements HandlerInterceptor {

    private static final String REQUIRED_ROLE = "SUPER_ADMIN";

    @Override
    public boolean preHandle(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler) throws Exception {

        HttpSession session = request.getSession(false);

        if (session == null || !REQUIRED_ROLE.equals(session.getAttribute("role"))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"접근 권한이 없습니다.\"}");
            return false;
        }

        return true;
    }
}
