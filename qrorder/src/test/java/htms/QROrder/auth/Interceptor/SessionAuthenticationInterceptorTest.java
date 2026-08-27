package htms.QROrder.auth.Interceptor;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 직원 경계(loginUser)와 Consumer 경계(qrTableInfo)가 서로의 인증 정보를 인정하지 않는지 확인한다.
 */
class SessionAuthenticationInterceptorTest {

    private static final String STAFF_MESSAGE = "세션이 만료되었습니다. 다시 로그인해주세요.";
    private static final String CONSUMER_MESSAGE = "QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요.";

    private final LoginCheckInterceptor staffBoundary = new LoginCheckInterceptor();
    private final ConsumerSessionCheckInterceptor consumerBoundary = new ConsumerSessionCheckInterceptor();

    private static QrConnectResponse validQrTableInfo() {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);
        return qrTableInfo;
    }

    private static MockHttpServletRequest requestWith(MockHttpSession session) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (session != null) {
            request.setSession(session);
        }
        return request;
    }

    // ---------- 직원 경계 ----------

    @Test
    void staffBoundaryAllowsLoginSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("loginUser", new Login());

        assertTrue(staffBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
    }

    @Test
    void staffBoundaryRejectsQrOnlySession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", validQrTableInfo());
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(staffBoundary.preHandle(requestWith(session), response, new Object()));
        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains(STAFF_MESSAGE));
    }

    @Test
    void staffBoundaryRejectsMissingSession() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(staffBoundary.preHandle(requestWith(null), response, new Object()));
        assertEquals(401, response.getStatus());
    }

    @Test
    void staffBoundaryAllowsDualSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("loginUser", new Login());
        session.setAttribute("qrTableInfo", validQrTableInfo());

        assertTrue(staffBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
    }

    // ---------- Consumer 경계 ----------

    @Test
    void consumerBoundaryAllowsValidQrSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", validQrTableInfo());

        assertTrue(consumerBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
        assertNotNull(session.getAttribute("qrTableInfo"));
    }

    @Test
    void consumerBoundaryRejectsLoginOnlySession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("loginUser", new Login());
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(consumerBoundary.preHandle(requestWith(session), response, new Object()));
        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains(CONSUMER_MESSAGE));
    }

    @Test
    void consumerBoundaryRejectsMissingSession() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(consumerBoundary.preHandle(requestWith(null), response, new Object()));
        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains(CONSUMER_MESSAGE));
    }

    @Test
    void consumerBoundaryRejectsQrTableInfoWithoutPlantCode() throws Exception {
        QrConnectResponse malformed = new QrConnectResponse();
        malformed.setTableNum(10);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", malformed);

        assertFalse(consumerBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
    }

    @Test
    void consumerBoundaryRejectsQrTableInfoWithoutTableNum() throws Exception {
        QrConnectResponse malformed = new QrConnectResponse();
        malformed.setSysPlantCd("PC002");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", malformed);

        assertFalse(consumerBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
    }

    @Test
    void consumerBoundaryRejectsForeignSessionValueType() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", "not-a-qr-table-info");

        assertFalse(consumerBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
    }

    @Test
    void consumerBoundaryClearsMalformedQrTableInfoButKeepsLoginUser() throws Exception {
        QrConnectResponse malformed = new QrConnectResponse();
        malformed.setSysPlantCd("   ");

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", malformed);
        session.setAttribute("loginUser", new Login());

        assertFalse(consumerBoundary.preHandle(requestWith(session), new MockHttpServletResponse(), new Object()));
        assertNull(session.getAttribute("qrTableInfo"));
        assertNotNull(session.getAttribute("loginUser"));
    }
}
