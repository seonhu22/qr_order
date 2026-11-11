package htms.QROrder.auth;

import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.service.LoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class LoginTransactionContractTest {
    @Test void serializesLoginAndCommitsExpectedFailureCounter() throws Exception {
        var transaction = LoginService.class.getMethod("loginCheck", LoginRequest.class,
                HttpServletRequest.class, HttpSession.class).getAnnotation(Transactional.class);
        assertNotNull(transaction);
        assertTrue(Arrays.asList(transaction.noRollbackFor()).contains(LoginFailException.class));
        String xml = new String(getClass().getResourceAsStream("/mapper/auth/LoginMapper.xml").readAllBytes());
        String select = xml.substring(xml.indexOf("<select id=\"findByUserId\""), xml.indexOf("</select>"));
        assertTrue(select.toLowerCase().contains("for update"));
    }
}
