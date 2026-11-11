package htms.QROrder.auth;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.repository.LoginMapper;
import htms.QROrder.auth.service.LoginService;
import htms.QROrder.log.service.LogService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LoginLockServiceTest {
    private final LoginMapper mapper = mock(LoginMapper.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final LoginService service = new LoginService(mapper, encoder, mock(LogService.class));
    private Login user(int count) {
        var user = new Login();
        user.setSysId("USER-1"); user.setUserId("OWNER");
        user.setPasswordFailCnt(count); user.setUserPassword("HASH");
        user.setEmailValidYn("Y"); user.setSysPlantCd("STORE-1");
        when(mapper.findByUserId("OWNER")).thenReturn(user);
        return user;
    }
    private void login(MockHttpSession session) {
        var request = new LoginRequest(); request.setUserId("OWNER"); request.setUserPassword("INPUT");
        service.loginCheck(request, new MockHttpServletRequest(), session);
    }
    @Test void fifthFailureReturnsUpdatedCountAndDoesNotAuthenticate() {
        user(4); var session = new MockHttpSession();
        var failure = assertThrows(LoginFailException.class, () -> login(session));
        assertEquals(5, failure.getData());
        verify(mapper).pwdIncorrectCntIncrease("USER-1");
        assertNull(session.getAttribute("loginUser"));
    }
    @Test void fifthFailureAlreadyStoredRejectsEvenCorrectPassword() {
        user(5); when(encoder.matches("INPUT", "HASH")).thenReturn(true);
        var session = new MockHttpSession();
        var failure = assertThrows(LoginFailException.class, () -> login(session));
        assertEquals(5, failure.getData());
        verifyNoInteractions(encoder);
        verify(mapper, never()).pwdCntReset(anyString());
        assertNull(session.getAttribute("loginUser"));
    }
    @Test void correctPasswordBeforeThresholdResetsCounterAndAuthenticates() {
        user(4); when(encoder.matches("INPUT", "HASH")).thenReturn(true);
        var session = new MockHttpSession(); login(session);
        verify(mapper).pwdCntReset("USER-1");
        assertNotNull(session.getAttribute("loginUser"));
    }
}
