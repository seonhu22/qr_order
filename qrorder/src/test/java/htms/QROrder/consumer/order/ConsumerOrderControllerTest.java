package htms.QROrder.consumer.order;

import htms.QROrder.auth.Interceptor.ConsumerAuthInterceptor;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.controller.ConsumerOrderController;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailItem;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderListResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderSummary;
import htms.QROrder.consumer.order.exception.ConsumerOrderConflictException;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerTableInactiveException;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.order.service.ConsumerOrderQueryService;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConsumerOrderControllerTest {

    private ConsumerOrderCreationService consumerOrderCreationService;
    private ConsumerOrderQueryService consumerOrderQueryService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        consumerOrderCreationService = mock(ConsumerOrderCreationService.class);
        consumerOrderQueryService = mock(ConsumerOrderQueryService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ConsumerOrderController(
                        consumerOrderCreationService, consumerOrderQueryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addInterceptors(new ConsumerAuthInterceptor())
                .build();
    }

    @Test
    void createsOrderWithCurrentServerSession() throws Exception {
        MockHttpSession session = activeSession();
        ConsumerOrderCreateResponse response = new ConsumerOrderCreateResponse(
                "ORDER-1", "1002", "RECEIVED", 18_000,
                LocalDateTime.of(2026, 8, 28, 10, 30));
        when(consumerOrderCreationService.createOrder(any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/client/consumer/orders")
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
        mockMvc.perform(post("/api/client/consumer/orders")
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

        mockMvc.perform(post("/api/client/consumer/orders")
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
        mockMvc.perform(post("/api/client/consumer/orders")
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
    void mapsInactiveTableToCodedConflict() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerTableInactiveException(
                        "현재 테이블에서는 새 주문을 할 수 없습니다."));

        performWithActiveSession()
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("TABLE_INACTIVE"))
                .andExpect(jsonPath("$.message")
                        .value("현재 테이블에서는 새 주문을 할 수 없습니다."));
    }

    @Test
    void mapsClosedVisitToGone() throws Exception {
        when(consumerOrderCreationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderSessionGoneException("종료되었거나 만료된 방문입니다."));

        performWithActiveSession()
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("종료되었거나 만료된 방문입니다."));
    }

    @Test
    void returnsOrdersFromCurrentSharedVisit() throws Exception {
        LocalDateTime orderedAt = LocalDateTime.of(2026, 8, 28, 10, 30);
        ConsumerOrderListResponse response = new ConsumerOrderListResponse(List.of(
                new ConsumerOrderSummary(
                        "ORDER-1", "1001", "RECEIVED", 18_000, 2,
                        orderedAt, orderedAt)));
        when(consumerOrderQueryService.getOrders(any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/client/consumer/orders").session(activeSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orders[0].orderId").value("ORDER-1"))
                .andExpect(jsonPath("$.data.orders[0].status").value("RECEIVED"))
                .andExpect(jsonPath("$.data.orders[0].totalAmount").value(18_000));
    }

    @Test
    void returnsOrderDetailFromCurrentSharedVisit() throws Exception {
        LocalDateTime orderedAt = LocalDateTime.of(2026, 8, 28, 10, 30);
        ConsumerOrderDetailResponse response = new ConsumerOrderDetailResponse(
                "ORDER-1", "1001", "RECEIVED", null, 18_000,
                orderedAt, orderedAt,
                List.of(new ConsumerOrderDetailItem(
                        "ITEM-1", "MENU-1", "메뉴", 2, 9_000, 18_000, List.of())));
        when(consumerOrderQueryService.getOrder(any(), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/client/consumer/orders/ORDER-1").session(activeSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderId").value("ORDER-1"))
                .andExpect(jsonPath("$.data.requestNote").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].menuName").value("메뉴"))
                .andExpect(jsonPath("$.data.items[0].lineAmount").value(18_000));
    }

    @Test
    void hidesOrderOutsideCurrentVisitAsNotFound() throws Exception {
        when(consumerOrderQueryService.getOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderNotFoundException("주문을 찾을 수 없습니다."));

        mockMvc.perform(get("/api/client/consumer/orders/ORDER-OTHER").session(activeSession()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("주문을 찾을 수 없습니다."));
    }

    @Test
    void mapsClosedVisitOrderListToGone() throws Exception {
        when(consumerOrderQueryService.getOrders(any(), any()))
                .thenThrow(new ConsumerOrderSessionGoneException("종료되었거나 만료된 방문입니다."));

        mockMvc.perform(get("/api/client/consumer/orders").session(activeSession()))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("종료되었거나 만료된 방문입니다."));
    }

    @Test
    void hidesUnhandledExceptionDetails() throws Exception {
        when(consumerOrderQueryService.getOrders(any(), any()))
                .thenThrow(new IllegalStateException("SQL relation order_master does not exist"));

        mockMvc.perform(get("/api/client/consumer/orders").session(activeSession()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message")
                        .value("오류가 발생했습니다. 관리자에게 문의 바랍니다."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    private org.springframework.test.web.servlet.ResultActions performWithActiveSession()
            throws Exception {
        return mockMvc.perform(post("/api/client/consumer/orders")
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
