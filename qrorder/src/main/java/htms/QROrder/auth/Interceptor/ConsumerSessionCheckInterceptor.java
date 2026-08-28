package htms.QROrder.auth.Interceptor;

import htms.QROrder.qr.dto.QrConnectResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Consumer API(/api/client/consumer/**)의 인증 경계.
 *
 * 직원 로그인(loginUser)은 이 경계의 인증 근거가 되지 않는다.
 * QR 연결로 생성된 qrTableInfo만 인정하며, 구조가 유효한지까지 확인한다.
 */
@Component
public class ConsumerSessionCheckInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler) throws Exception {

        HttpSession session = request.getSession(false);

        if (session == null || !isValidQrTableInfo(session.getAttribute("qrTableInfo"))) {
            if (session != null) {
                session.removeAttribute("qrTableInfo");
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요.\"}");
            return false;
        }

        return true;
    }

    private boolean isValidQrTableInfo(Object sessionValue) {
        return sessionValue instanceof QrConnectResponse qrTableInfo
                && qrTableInfo.getSysId() != null
                && !qrTableInfo.getSysId().isBlank()
                && qrTableInfo.getSysPlantCd() != null
                && !qrTableInfo.getSysPlantCd().isBlank()
                && qrTableInfo.getTableNum() != null;
    }
}
