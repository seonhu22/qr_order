package htms.QROrder.consumer.session;

import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerSessionResponse;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerSessionService;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ConsumerSessionServiceTest {

    private static final LocalDateTime STARTED_AT =
            LocalDateTime.of(2026, 8, 27, 10, 20, 30);

    private final ConsumerVisitService consumerVisitService = mock(ConsumerVisitService.class);
    private final ConsumerSessionService consumerSessionService =
            new ConsumerSessionService(consumerVisitService);

    @Test
    void createsOrReusesVisitWhenBrowserHasNoBinding() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord active = visit("VISIT-1", "01", false);
        when(consumerVisitService.resolveActiveVisit(qr)).thenReturn(active);

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, null);

        assertEquals("ACTIVE", response.getStatus());
        assertEquals("VISIT-1", response.getConsumerSessionId());
        assertEquals("테스트 매장", response.getStoreName());
        verify(consumerVisitService, never()).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void refreshesBoundActiveVisit() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerSessionBinding binding = binding();
        ConsumerVisitRecord active = visit("VISIT-1", "01", false);
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(active);
        when(consumerVisitService.touchBoundVisit(qr, "VISIT-1")).thenReturn(active);

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, binding);

        assertEquals("ACTIVE", response.getStatus());
        verify(consumerVisitService).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void returnsExpiredWithoutRefreshingIdleEmptyVisit() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord expired = visit("VISIT-1", "01", true);
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(expired);

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, binding());

        assertEquals("EXPIRED", response.getStatus());
        verify(consumerVisitService, never()).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void returnsClosedForPaymentCompletedVisit() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord closed = visit("VISIT-1", "02", false);
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(closed);

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, binding());

        assertEquals("CLOSED", response.getStatus());
        verify(consumerVisitService, never()).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void keepsExpiredResultWhenEmptyMasterWasAlreadyDeleted() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(null);
        when(consumerVisitService.findStoreName("PLANT-1")).thenReturn("테스트 매장");

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, binding());

        assertEquals("EXPIRED", response.getStatus());
        assertEquals(STARTED_AT, response.getStartedAt());
    }

    @Test
    void returnsClosedForPaymentNotCompletedVisit() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1"))
                .thenReturn(visit("VISIT-1", "03", false));

        ConsumerSessionResponse response = consumerSessionService.getSession(qr, binding());

        assertEquals("CLOSED", response.getStatus());
        verify(consumerVisitService, never()).touchBoundVisit(qr, "VISIT-1");
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

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", STARTED_AT);
    }

    private ConsumerVisitRecord visit(String id, String orderStatus, boolean expired) {
        ConsumerVisitRecord visit = new ConsumerVisitRecord();
        visit.setConsumerSessionId(id);
        visit.setSysPlantCd("PLANT-1");
        visit.setTableSysId("TABLE-1");
        visit.setStoreName("테스트 매장");
        visit.setOrderStatus(orderStatus);
        visit.setStartedAt(STARTED_AT);
        visit.setExpired(expired);
        return visit;
    }
}
