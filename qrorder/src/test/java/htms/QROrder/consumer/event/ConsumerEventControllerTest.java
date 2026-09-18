package htms.QROrder.consumer.event;

import htms.QROrder.auth.Interceptor.ConsumerAuthInterceptor;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.consumer.event.controller.ConsumerEventController;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConsumerEventControllerTest {

    private ConsumerEventService eventService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        eventService = mock(ConsumerEventService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ConsumerEventController(eventService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addInterceptors(new ConsumerAuthInterceptor())
                .build();
    }

    @Test
    void subscribesWithoutAcceptingAnExternalChannelId() throws Exception {
        when(eventService.subscribe(any(), any(), any())).thenReturn(new SseEmitter());

        mockMvc.perform(get("/api/client/consumer/events").session(activeSession()))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());
    }

    @Test
    void rejectsMissingQrSession() throws Exception {
        mockMvc.perform(get("/api/client/consumer/events"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(eventService);
    }

    @Test
    void mapsClosedVisitToGone() throws Exception {
        when(eventService.subscribe(any(), any(), any()))
                .thenThrow(new ConsumerOrderSessionGoneException("종료되었거나 만료된 방문입니다."));

        mockMvc.perform(get("/api/client/consumer/events").session(activeSession()))
                .andExpect(status().isGone());
    }

    private MockHttpSession activeSession() {
        MockHttpSession session = new MockHttpSession();
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysPlantCd("PLANT-1");
        qr.setSysId("TABLE-1");
        qr.setTableNum(1);
        session.setAttribute("qrTableInfo", qr);
        session.setAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE,
                new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now()));
        return session;
    }
}
