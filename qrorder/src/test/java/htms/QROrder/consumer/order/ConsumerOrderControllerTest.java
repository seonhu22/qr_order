package htms.QROrder.consumer.order;

import htms.QROrder.auth.Interceptor.ConsumerSessionCheckInterceptor;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.controller.ConsumerOrderController;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderConflictException;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConsumerOrderControllerTest {

    private ConsumerOrderCreationService consumerOrderCreationService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        consumerOrderCreationService = mock(ConsumerOrderCreationService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ConsumerOrderController(consumerOrderCreationService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addInterceptors(new ConsumerSessionCheckInterceptor())
                .build();
    }

    @Test
    void createsOrderWithCurrentServerSession() throws Exception {
        MockHttpSession session = activeSession();
        ConsumerOrderCreateResponse response = new ConsumerOrderCreateResponse(
                "ORDER-1", "1002", "RECEIVED", 18_000,
                LocalDateTime.of(2026, 8, 28, 10, 30));
        when(consumerOrderCreationService.createOrder(any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/consumer/orders")
                        .session(session)
                        .contentType("application/json")
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderId").value("ORDER-1"))
                .andExpect(jsonPath("$.data.orderNo").value("1002"))
                .andExpect(jsonPath("$.data.status").value("RECEIVED"))
                .andExpect(jsonPath("$.data.totalAmount").value(18_000))
                .andExpect(jsonPath("$.data.orderedAt").value("2026-08-28 10:30:00"));
    }

    @Test
    void rejectsRequestWithoutQrSession() throws Exception {
        mockMvc.perform(post("/api/consumer/orders")
                        .contentType("application/json")
                        .content(validRequestJson()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verifyNoInteractions(consumerOrderCreationService);
    }

    @Test
    void rejectsRequestWithoutConsumerBinding() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo());

        mockMvc.perform(post("/api/consumer/orders")
                        .session(session)
                        .contentType("application/json")
                        .content(validRequestJson()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Consumer 방문 세션을 먼저 확인해주세요."));
    }

    @Test
    void mapsValidationFailureToBadRequest() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ValidationException("주문 항목은 1개 이상이어야 합니다."));

        performWithActiveSession()
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("주문 항목은 1개 이상이어야 합니다."));
    }

    @Test
    void mapsMalformedJsonToBadRequest() throws Exception {
        mockMvc.perform(post("/api/consumer/orders")
                        .session(activeSession())
                        .contentType("application/json")
                        .content("{\"items\": [}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("요청 본문을 확인해주세요."));

        verifyNoInteractions(consumerOrderCreationService);
    }

    @Test
    void hidesUnavailableMenuAsNotFound() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderNotFoundException("주문할 수 없는 메뉴입니다."));

        performWithActiveSession()
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("주문할 수 없는 메뉴입니다."));
    }

    @Test
    void mapsSoldOutMenuToConflict() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderConflictException("품절된 메뉴가 포함되어 있습니다."));

        performWithActiveSession()
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("품절된 메뉴가 포함되어 있습니다."));
    }

    @Test
    void mapsClosedVisitToGone() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderSessionGoneException("종료되었거나 만료된 방문입니다."));

        performWithActiveSession()
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("종료되었거나 만료된 방문입니다."));
    }

    private org.springframework.test.web.servlet.ResultActions performWithActiveSession()
            throws Exception {
        return mockMvc.perform(post("/api/consumer/orders")
                .session(activeSession())
                .contentType("application/json")
                .content(validRequestJson()));
    }

    private MockHttpSession activeSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo());
        session.setAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE,
                new ConsumerSessionBinding(
                        "VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now()));
        return session;
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        qr.setTableNum(1);
        return qr;
    }

    private String validRequestJson() {
        return """
                {
                  "clientRequestId": "01K3N8Q9Z6D1F4T2Y7M5C0B8XA",
                  "items": [{"menuSysId": "MENU-1", "quantity": 1, "options": []}]
                }
                """;
    }
}
