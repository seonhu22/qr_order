package htms.QROrder.qr;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.qr.controller.QrConnectController;
import htms.QROrder.qr.dto.QrConnectResponse;
import htms.QROrder.qr.service.QrConnectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * QR 재연결 시 이전 QR 권한이 남지 않는지 확인한다.
 */
class QrConnectControllerTest {

    private QrConnectService qrConnectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        qrConnectService = mock(QrConnectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new QrConnectController(qrConnectService))
                .build();
    }

    private static QrConnectResponse tableInfo(String plantCd, int tableNum) {
        QrConnectResponse response = new QrConnectResponse();
        response.setSysPlantCd(plantCd);
        response.setTableNum(tableNum);
        return response;
    }

    @Test
    void storesQrTableInfoForValidQr() throws Exception {
        QrConnectResponse response = tableInfo("PC002", 10);
        when(qrConnectService.getTableInfo("qr-code-001")).thenReturn(response);

        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(get("/api/qr/qr-code-001").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertSame(response, session.getAttribute("qrTableInfo"));
    }

    @Test
    void replacesPreviousQrTableInfoOnReconnect() throws Exception {
        QrConnectResponse next = tableInfo("PC002", 20);
        when(qrConnectService.getTableInfo("qr-code-002")).thenReturn(next);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", tableInfo("PC002", 10));

        mockMvc.perform(get("/api/qr/qr-code-002").session(session))
                .andExpect(status().isOk());

        assertSame(next, session.getAttribute("qrTableInfo"));
    }

    @Test
    void clearsStaleQrTableInfoWhenReconnectFails() throws Exception {
        when(qrConnectService.getTableInfo("broken-qr")).thenReturn(null);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", tableInfo("PC002", 10));

        mockMvc.perform(get("/api/qr/broken-qr").session(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("유효하지 않은 QR코드입니다."));

        assertNull(session.getAttribute("qrTableInfo"), "실패한 재연결 뒤 이전 QR 권한이 남으면 안 된다");
    }

    @Test
    void keepsStaffLoginWhenQrFails() throws Exception {
        when(qrConnectService.getTableInfo("broken-qr")).thenReturn(null);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", tableInfo("PC002", 10));
        session.setAttribute("loginUser", new Login());

        mockMvc.perform(get("/api/qr/broken-qr").session(session))
                .andExpect(status().isNotFound());

        assertNull(session.getAttribute("qrTableInfo"));
        assertNotNull(session.getAttribute("loginUser"), "QR 실패가 직원 로그인을 지우면 안 된다");
    }
}
