package htms.QROrder.consumer.session;

import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.repository.ConsumerVisitMapper;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsumerVisitServiceTest {

    @Mock
    private ConsumerVisitMapper consumerVisitMapper;

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysId("TABLE-1");
        qrTableInfo.setSysPlantCd("PLANT-1");
        return qrTableInfo;
    }

    private ConsumerVisitRecord visit(String consumerSessionId,
                                      boolean hasOrders,
                                      boolean expired) {
        ConsumerVisitRecord visit = new ConsumerVisitRecord();
        visit.setConsumerSessionId(consumerSessionId);
        visit.setTableSysId("TABLE-1");
        visit.setSysPlantCd("PLANT-1");
        visit.setOrderStatus("01");
        visit.setHasOrders(hasOrders);
        visit.setExpired(expired);
        return visit;
    }

    @Test
    void reusesAndTouchesCurrentActiveVisit() {
        ConsumerVisitRecord active = visit("VISIT-1", false, false);
        ConsumerVisitRecord touched = visit("VISIT-1", false, false);
        when(consumerVisitMapper.lockAvailableTable("TABLE-1", "PLANT-1"))
                .thenReturn("TABLE-1");
        when(consumerVisitMapper.findActiveConsumerVisit("TABLE-1", "PLANT-1"))
                .thenReturn(active);
        when(consumerVisitMapper.findConsumerVisit("VISIT-1", "TABLE-1", "PLANT-1"))
                .thenReturn(touched);

        ConsumerVisitRecord result = service().resolveActiveVisit(qrTableInfo());

        assertEquals("VISIT-1", result.getConsumerSessionId());
        verify(consumerVisitMapper).touchActiveConsumerVisit("VISIT-1", "TABLE-1", "PLANT-1");
        verify(consumerVisitMapper, never()).insertConsumerVisit(anyString(), anyString(), anyString());
    }

    @Test
    void keepsVisitWithOrdersEvenWhenIdleTimePassed() {
        ConsumerVisitRecord ordered = visit("VISIT-1", true, true);
        when(consumerVisitMapper.lockAvailableTable("TABLE-1", "PLANT-1"))
                .thenReturn("TABLE-1");
        when(consumerVisitMapper.findActiveConsumerVisit("TABLE-1", "PLANT-1"))
                .thenReturn(ordered);
        when(consumerVisitMapper.findConsumerVisit("VISIT-1", "TABLE-1", "PLANT-1"))
                .thenReturn(ordered);

        ConsumerVisitRecord result = service().resolveActiveVisit(qrTableInfo());

        assertEquals("VISIT-1", result.getConsumerSessionId());
        verify(consumerVisitMapper, never())
                .deleteExpiredEmptyConsumerVisit(anyString(), anyString(), anyString());
    }

    @Test
    void deletesExpiredEmptyVisitAndCreatesNewVisit() {
        ConsumerVisitRecord expired = visit("VISIT-OLD", false, true);
        ConsumerVisitRecord created = visit("VISIT-NEW", false, false);
        when(consumerVisitMapper.lockAvailableTable("TABLE-1", "PLANT-1"))
                .thenReturn("TABLE-1");
        when(consumerVisitMapper.findActiveConsumerVisit("TABLE-1", "PLANT-1"))
                .thenReturn(expired);
        when(consumerVisitMapper.deleteExpiredEmptyConsumerVisit(
                "VISIT-OLD", "TABLE-1", "PLANT-1"))
                .thenReturn(1);
        when(consumerVisitMapper.findConsumerVisit(anyString(),
                org.mockito.ArgumentMatchers.eq("TABLE-1"),
                org.mockito.ArgumentMatchers.eq("PLANT-1")))
                .thenReturn(created);

        ConsumerVisitRecord result = service().resolveActiveVisit(qrTableInfo());

        ArgumentCaptor<String> id = ArgumentCaptor.forClass(String.class);
        verify(consumerVisitMapper).insertConsumerVisit(
                id.capture(),
                org.mockito.ArgumentMatchers.eq("TABLE-1"),
                org.mockito.ArgumentMatchers.eq("PLANT-1"));
        assertNotNull(id.getValue());
        assertEquals(26, id.getValue().length());
        assertEquals("VISIT-NEW", result.getConsumerSessionId());
    }

    @Test
    void createsVisitWhenTableHasNoConsumerVisit() {
        ConsumerVisitRecord created = visit("VISIT-NEW", false, false);
        when(consumerVisitMapper.lockAvailableTable("TABLE-1", "PLANT-1"))
                .thenReturn("TABLE-1");
        when(consumerVisitMapper.findActiveConsumerVisit("TABLE-1", "PLANT-1"))
                .thenReturn(null);
        when(consumerVisitMapper.findConsumerVisit(anyString(),
                org.mockito.ArgumentMatchers.eq("TABLE-1"),
                org.mockito.ArgumentMatchers.eq("PLANT-1")))
                .thenReturn(created);

        ConsumerVisitRecord result = service().resolveActiveVisit(qrTableInfo());

        assertEquals("VISIT-NEW", result.getConsumerSessionId());
        verify(consumerVisitMapper).insertConsumerVisit(anyString(),
                org.mockito.ArgumentMatchers.eq("TABLE-1"),
                org.mockito.ArgumentMatchers.eq("PLANT-1"));
    }

    @Test
    void rejectsUnavailableTableBeforeLookingUpVisit() {
        when(consumerVisitMapper.lockAvailableTable("TABLE-1", "PLANT-1"))
                .thenReturn(null);

        assertThrows(IllegalStateException.class,
                () -> service().resolveActiveVisit(qrTableInfo()));
        verify(consumerVisitMapper, never()).findActiveConsumerVisit(anyString(), anyString());
    }

    private ConsumerVisitService service() {
        return new ConsumerVisitService(consumerVisitMapper);
    }
}
