package htms.QROrder.consumer.event;

import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import htms.QROrder.consumer.event.service.ConsumerParticipantRegistry;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

class ConsumerEventServiceTest {

    private final SSEEmitterService emitterService = mock(SSEEmitterService.class);
    private final ConsumerVisitService visitService = mock(ConsumerVisitService.class);
    private final ConsumerEventService service = new ConsumerEventService(
            emitterService, visitService, new ConsumerOrderSessionGuard(),
            new ConsumerParticipantRegistry());

    @Test
    void subscribesToServerDerivedCurrentVisitChannel() {
        QrConnectResponse qr = qr();
        ConsumerSessionBinding binding = binding();
        ConsumerVisitRecord visit = activeVisit();
        SseEmitter emitter = new SseEmitter();
        when(visitService.findBoundVisit(qr, "VISIT-1")).thenReturn(visit);
        when(emitterService.subscribe(eq("consumer:PLANT-1:VISIT-1"), any(Runnable.class)))
                .thenReturn(emitter);

        assertEquals(emitter, service.subscribe(qr, binding, "BROWSER-1"));

        verify(emitterService).subscribe(eq("consumer:PLANT-1:VISIT-1"), any(Runnable.class));
        verify(emitterService).send("consumer:PLANT-1:VISIT-1",
                ConsumerEventService.PARTICIPANTS_CHANGED, 1);
    }

    @Test
    void rejectsBindingFromAnotherTableBeforeVisitLookup() {
        ConsumerSessionBinding otherTable = new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-OTHER", LocalDateTime.now());

        assertThrows(ConsumerOrderSessionRequiredException.class,
                () -> service.subscribe(qr(), otherTable, "BROWSER-1"));

        verifyNoInteractions(visitService, emitterService);
    }

    @Test
    void rejectsClosedVisitWithoutCreatingEmitter() {
        ConsumerVisitRecord closed = activeVisit();
        closed.setOrderStatus("02");
        when(visitService.findBoundVisit(qr(), "VISIT-1")).thenReturn(closed);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.subscribe(qr(), binding(), "BROWSER-1"));

        verifyNoInteractions(emitterService);
    }

    private QrConnectResponse qr() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysPlantCd("PLANT-1");
        qr.setSysId("TABLE-1");
        qr.setTableNum(1);
        return qr;
    }

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now());
    }

    private ConsumerVisitRecord activeVisit() {
        ConsumerVisitRecord visit = new ConsumerVisitRecord();
        visit.setConsumerSessionId("VISIT-1");
        visit.setSysPlantCd("PLANT-1");
        visit.setTableSysId("TABLE-1");
        visit.setOrderStatus("01");
        return visit;
    }
}
