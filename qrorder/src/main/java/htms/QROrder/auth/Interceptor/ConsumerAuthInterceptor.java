package htms.QROrder.auth.Interceptor;

import htms.QROrder.qr.dto.QrConnectResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class ConsumerAuthInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler) throws Exception {

        HttpSession session = request.getSession(false);
        QrConnectResponse qrTableInfo = session == null ? null : (QrConnectResponse) session.getAttribute("qrTableInfo");

        if (qrTableInfo == null || qrTableInfo.getSysPlantCd() == null || qrTableInfo.getTableNum() == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"QR코드를 다시 스캔해주세요.\"}");
            return false;
        }

        return true;
    }
}
