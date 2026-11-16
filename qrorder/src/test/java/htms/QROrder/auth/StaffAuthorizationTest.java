package htms.QROrder.auth;

import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.auth.domain.Login;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import htms.QROrder.auth.repository.LoginMapper;

class StaffAuthorizationTest {
    @Test void rejectsSessionWithoutStableStaffIdentity() throws Exception {
        var request = new MockHttpServletRequest();
        var session = new MockHttpSession();
        session.setAttribute("loginUser", new Login());
        request.setSession(session);
        var response = new MockHttpServletResponse();
        assertFalse(new LoginCheckInterceptor(mock(LoginMapper.class)).preHandle(request, response, new Object()));
        assertEquals(401, response.getStatus());
    }
    @Test void refreshesRoleOncePerRequestAndChecksAgainOnNextRequest() throws Exception {
        var oldUser = StaffTestSupport.login("USER", "STORE", "02");
        var promoted = StaffTestSupport.login("USER", "STORE", "01");
        var mapper = StaffTestSupport.mapperFor(promoted);
        var boundary = new LoginCheckInterceptor(mapper);
        var session = new MockHttpSession(); session.setAttribute("loginUser", oldUser);
        var request = new MockHttpServletRequest(); request.setSession(session);
        assertTrue(boundary.preHandle(request, new MockHttpServletResponse(), new Object()));
        assertTrue(boundary.preHandle(request, new MockHttpServletResponse(), new Object()));
        verify(mapper, times(1)).findForAuthorization("USER");
        assertEquals("01", ((Login) session.getAttribute("loginUser")).getUserRole());
        assertEquals("STAFF", session.getAttribute("role"));
        var next = new MockHttpServletRequest(); next.setSession(session);
        boundary.preHandle(next, new MockHttpServletResponse(), new Object());
        verify(mapper, times(2)).findForAuthorization("USER");
    }
    @Test void deletedOrMovedAccountInvalidatesSession() throws Exception {
        for (Login current : new Login[]{null, StaffTestSupport.login("USER", "OTHER", "01")}) {
            var mapper = mock(LoginMapper.class); when(mapper.findForAuthorization("USER")).thenReturn(current);
            var session = new MockHttpSession(); session.setAttribute("loginUser", StaffTestSupport.login("USER", "STORE", "01"));
            var request = new MockHttpServletRequest(); request.setSession(session);
            var response = new MockHttpServletResponse();
            assertFalse(new LoginCheckInterceptor(mapper).preHandle(request, response, new Object()));
            assertTrue(session.isInvalid()); assertEquals(401, response.getStatus());
        }
    }
    @Test void databaseFailureNeverFallsBackToSessionRole() {
        var mapper = mock(LoginMapper.class); when(mapper.findForAuthorization("USER")).thenThrow(new IllegalStateException("DB unavailable"));
        var session = new MockHttpSession(); session.setAttribute("loginUser", StaffTestSupport.login("USER", "STORE", "01"));
        var request = new MockHttpServletRequest(); request.setSession(session);
        assertThrows(IllegalStateException.class, () -> new LoginCheckInterceptor(mapper).preHandle(request, new MockHttpServletResponse(), new Object()));
    }
}
