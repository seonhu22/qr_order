package htms.QROrder.auth.Interceptor;

import htms.QROrder.auth.domain.Login;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/** Authenticated password initialization must never target another account. */
public class PasswordOwnerInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        var session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute("loginUser");
        if (value instanceof Login login && login.getUserId() != null
                && login.getUserId().equals(request.getParameter("userId"))) {
            return true;
        }
        response.setStatus(value instanceof Login ? 403 : 401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"본인 계정의 비밀번호만 변경할 수 있습니다.\"}");
        return false;
    }
}
