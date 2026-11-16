package htms.QROrder.auth.Interceptor;

import htms.QROrder.auth.domain.Login;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class ClientMenuRoleInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        var session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute("loginUser");
        if (value instanceof Login login && "01".equals(login.getUserRole())
                && login.getSysPlantCd() != null && !login.getSysPlantCd().isBlank()
                && !"ADMIN".equals(login.getSysPlantCd())) return true;
        response.setStatus(value instanceof Login ? 403 : 401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"매장 관리자만 이용할 수 있습니다.\"}");
        return false;
    }
}
