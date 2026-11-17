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

class LoginMissingStoreTest {
    @Test void missingStoreRejectsBeforeAuditInsertEvenWithMatchingPassword() {
        for (String store : new String[]{null, "", "   "}) {
            LoginMapper mapper = mock(LoginMapper.class);
            PasswordEncoder encoder = mock(PasswordEncoder.class);
            LogService logs = mock(LogService.class);
            var service = new LoginService(mapper, encoder, logs);
            var user = new Login();
            user.setSysId("STAFF-1"); user.setUserId("QA-STAFF");
            user.setSysPlantCd(store); user.setPasswordFailCnt(0);
            user.setUserPassword("HASH"); user.setEmailValidYn("Y");
            when(mapper.findByUserId("QA-STAFF")).thenReturn(user);
            when(encoder.matches(anyString(), anyString())).thenReturn(true);
            doThrow(new IllegalStateException("sys_login_log_master.sys_plant_cd NOT NULL"))
                    .when(logs).loginLog(anyString(), any(), anyString(), nullable(String.class), any());
            var session = new MockHttpSession();
            var request = new LoginRequest(); request.setUserId("QA-STAFF"); request.setUserPassword("INPUT");
            var failure = assertThrows(LoginFailException.class,
                    () -> service.loginCheck(request, new MockHttpServletRequest(), session));
            assertTrue(failure.getMessage().contains("매장"));
            assertNull(session.getAttribute("loginUser"));
            assertNull(session.getAttribute("role"));
            verifyNoInteractions(encoder, logs);
            verify(mapper, never()).pwdIncorrectCntIncrease(anyString());
            verify(mapper, never()).pwdCntReset(anyString());
        }
    }
}
