package htms.QROrder.auth.Interceptor;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.repository.LoginMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.function.Predicate;

public class LoginCheckInterceptor implements HandlerInterceptor {
    private static final String CHECKED_USER = LoginCheckInterceptor.class.getName() + ".user";
    private final LoginMapper loginMapper;
    private final Predicate<Object> signedHandler;

    public LoginCheckInterceptor(LoginMapper loginMapper) {
        this(loginMapper, handler -> false);
    }

    /** signedHandler: 로그인 대신 서명으로 인증하는 핸들러(경로가 아니라 실제로 고른 핸들러로 판단). */
    public LoginCheckInterceptor(LoginMapper loginMapper, Predicate<Object> signedHandler) {
        this.loginMapper = java.util.Objects.requireNonNull(loginMapper);
        this.signedHandler = java.util.Objects.requireNonNull(signedHandler);
    }
    @Override
    public boolean preHandle(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler) throws Exception {
        if (signedHandler.test(handler)) return true;

        HttpSession session = request.getSession(false);

        Object value = session == null ? null : session.getAttribute("loginUser");
        if (!(value instanceof Login previous) || previous.getSysId() == null || previous.getSysId().isBlank()
                || previous.getSysPlantCd() == null || previous.getSysPlantCd().isBlank()) {
            return unauthorized(response);
        }
        if (request.getAttribute(CHECKED_USER) instanceof Login checked
                && previous.getSysId().equals(checked.getSysId())) return true;
        // A new request re-reads authority. Never fall back to stale session data on DB errors.
        Login current = loginMapper.findForAuthorization(previous.getSysId());
        if (current == null || current.getSysPlantCd() == null
                || !previous.getSysPlantCd().equals(current.getSysPlantCd())) {
            session.invalidate();
            return unauthorized(response);
        }
        session.setAttribute("loginUser", current);
        session.setAttribute("role", "ADMIN".equals(current.getSysPlantCd()) ? "SUPER_ADMIN" : "STAFF");
        request.setAttribute(CHECKED_USER, current);
        return true;
    }

    private boolean unauthorized(HttpServletResponse response) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"세션이 만료되었습니다. 다시 로그인해주세요.\"}");
        return false;
    }
}
