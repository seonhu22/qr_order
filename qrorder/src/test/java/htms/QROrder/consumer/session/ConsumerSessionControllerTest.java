package htms.QROrder.consumer.session;

import htms.QROrder.consumer.session.controller.ConsumerSessionController;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerSessionResponse;
import htms.QROrder.consumer.session.service.ConsumerSessionService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConsumerSessionControllerTest {

    private ConsumerSessionService consumerSessionService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        consumerSessionService = mock(ConsumerSessionService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new ConsumerSessionController(consumerSessionService)).build();
    }

    @Test
    void returnsActiveSessionAndStoresServerBinding() throws Exception {
        QrConnectResponse qr = qrTableInfo();
        ConsumerSessionResponse response = response("ACTIVE");
        when(consumerSessionService.getSession(qr, null)).thenReturn(response);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qr);

        mockMvc.perform(get("/api/client/consumer/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.consumerSessionId").value("VISIT-1"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.orderingAllowed").value(true))
                .andExpect(jsonPath("$.data.orderingBlockedReason").isEmpty())
                .andExpect(jsonPath("$.data.startedAt").value("2026-08-27 10:20:30"));

        ConsumerSessionBinding stored = (ConsumerSessionBinding) session.getAttribute(
                ConsumerSessionBinding.SESSION_ATTRIBUTE);
        assertEquals("VISIT-1", stored.getConsumerSessionId());
    }

    @Test
    void reusesExistingServerBinding() throws Exception {
        QrConnectResponse qr = qrTableInfo();
        ConsumerSessionBinding binding = response("ACTIVE").toBinding();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qr);
        session.setAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE, binding);
        when(consumerSessionService.getSession(qr, binding)).thenReturn(response("CLOSED"));

        mockMvc.perform(get("/api/client/consumer/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));

        assertSame(binding, session.getAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE));
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        qr.setTableName("내부 1번");
        qr.setTableNum(3);
        qr.setTableQty(4);
        return qr;
    }

    private ConsumerSessionResponse response(String status) {
        return new ConsumerSessionResponse(
                "VISIT-1", status, "PLANT-1", "테스트 매장", "TABLE-1",
                "내부 1번", 3, 4, "ACTIVE".equals(status), null,
                LocalDateTime.of(2026, 8, 27, 10, 20, 30));
    }
}
