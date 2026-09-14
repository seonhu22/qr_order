package htms.QROrder.common.exception;

import htms.QROrder.audit.controller.AuditController;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.audit.service.ErrorService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.OrderManageController;
import htms.QROrder.client.service.OrderHistoryService;
import htms.QROrder.client.service.StatusService;
import htms.QROrder.consumer.order.controller.ConsumerOrderController;
import htms.QROrder.consumer.order.exception.ConsumerOrderIdempotencyException;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.order.service.ConsumerOrderQueryService;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiExceptionHandlerPrecedenceTest {

    @Test
    void preservesCodedIdempotencyConflictWithAuditAdvicePresent() throws Exception {
        ConsumerOrderCreationService creationService = mock(ConsumerOrderCreationService.class);
        ConsumerOrderController controller = new ConsumerOrderController(
                creationService, mock(ConsumerOrderQueryService.class));
        when(creationService.createOrder(any(), any(), any()))
                .thenThrow(new ConsumerOrderIdempotencyException(
                        ConsumerOrderIdempotencyException.PAYLOAD_MISMATCH,
                        "같은 요청 식별자로 다른 주문 내용을 전송할 수 없습니다."));

        MockHttpSession session = consumerSession();
        apiMockMvc(controller).perform(post("/api/client/consumer/orders")
                        .session(session)
                        .contentType("application/json")
                        .content("{\"clientRequestId\":\"request-1\",\"items\":[]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("IDEMPOTENCY_PAYLOAD_MISMATCH"));
    }

    @Test
    void preservesPaymentConflictWithAuditAdvicePresent() throws Exception {
        StatusService statusService = mock(StatusService.class);
        OrderManageController controller = new OrderManageController(
                statusService, mock(OrderHistoryService.class));
        org.mockito.Mockito.doThrow(new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "모든 주문의 서빙이 완료된 후 결제할 수 있습니다."))
                .when(statusService).paymentComplete(any(), any(), any());

        MockHttpSession session = new MockHttpSession();
        Login login = new Login();
        login.setUserId("USER-1");
        login.setSysPlantCd("PLANT-1");
        session.setAttribute("loginUser", login);

        apiMockMvc(controller).perform(post("/api/client/order_manage/status/payment_complete")
                        .session(session)
                        .contentType("application/json")
                        .content("{\"paymentType\":\"카드\",\"header\":{\"sysId\":\"MASTER-1\"}}"))
                .andExpect(status().isConflict());
    }

    private MockMvc apiMockMvc(Object controller) {
        AuditController auditController = new AuditController(
                mock(AuditService.class), mock(ErrorService.class));
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(
                        auditController,
                        new GlobalExceptionHandler(),
                        new GlobalFallbackExceptionHandler())
                .build();
    }

    private MockHttpSession consumerSession() {
        MockHttpSession session = new MockHttpSession();
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        qr.setTableNum(1);
        session.setAttribute("qrTableInfo", qr);
        session.setAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE,
                new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now()));
        return session;
    }
}
