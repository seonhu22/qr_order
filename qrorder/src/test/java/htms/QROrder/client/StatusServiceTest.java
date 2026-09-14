package htms.QROrder.client;

import htms.QROrder.client.dto.PaymentCompleteRequest;
import htms.QROrder.client.dto.PaymentCompleteResponse;
import htms.QROrder.client.dto.PaymentNotCompleteRequest;
import htms.QROrder.client.dto.StatusItem;
import htms.QROrder.client.dto.StatusRequest;
import htms.QROrder.client.repository.StatusMapper;
import htms.QROrder.client.service.StatusService;
import htms.QROrder.consumer.event.service.ConsumerEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatusServiceTest {

    @Mock
    private StatusMapper statusMapper;

    @Mock
    private ConsumerEventPublisher eventPublisher;

    @InjectMocks
    private StatusService statusService;

    @Test
    void loadsPaymentTargetWithinLoginPlant() {
        PaymentCompleteResponse.Header paymentHeader = new PaymentCompleteResponse.Header();
        paymentHeader.setSysId("MASTER-1");
        when(statusMapper.getPaymentCompleteHeaders(any(), eq("PLANT-1"))).thenReturn(paymentHeader);

        PaymentCompleteResponse response = statusService.getPaymentComplete("ORDER-1", "PLANT-1");

        assertEquals("MASTER-1", response.getHeader().getSysId());
        verify(statusMapper).getPaymentCompleteBodyItems(any(), eq("PLANT-1"));
        verify(statusMapper).getPaymentCompleteFooterItems(any(), eq("PLANT-1"));
    }

    @Test
    void loadsVisitWideReceiptUsingResolvedMasterId() {
        PaymentCompleteResponse.Header paymentHeader = new PaymentCompleteResponse.Header();
        paymentHeader.setSysId("MASTER-1");
        when(statusMapper.getPaymentCompleteHeaders(any(), eq("PLANT-1"))).thenReturn(paymentHeader);

        statusService.getPaymentComplete("GROUP-1", "PLANT-1");

        verify(statusMapper).getPaymentCompleteBodyItems(
                org.mockito.ArgumentMatchers.argThat(header -> "MASTER-1".equals(header.getSysId())),
                eq("PLANT-1"));
        verify(statusMapper).getPaymentCompleteFooterItems(
                org.mockito.ArgumentMatchers.argThat(header -> "MASTER-1".equals(header.getSysId())),
                eq("PLANT-1"));
    }

    @Test
    void changesOrderStatusOnlyFromExpectedStateWithinLoginPlant() {
        StatusRequest request = statusRequest("GROUP-1");
        when(statusMapper.lockOrderGroupStatus("GROUP-1", "PLANT-1")).thenReturn("01");
        when(statusMapper.goToCooking(any(), eq("USER-1"), eq("PLANT-1"), eq("01")))
                .thenReturn(1);
        when(statusMapper.findConsumerSessionIdByOrderGroup("GROUP-1", "PLANT-1"))
                .thenReturn("VISIT-1");

        statusService.goToCooking(request, "USER-1", "PLANT-1");

        verify(statusMapper).goToCooking(request.getHeader(), "USER-1", "PLANT-1", "01");
        verify(eventPublisher).publishAfterCommit(
                "PLANT-1", "VISIT-1", ConsumerEventService.STATUS_CHANGED);
    }

    @Test
    void rejectsOrderStatusChangeOutsideLoginPlant() {
        StatusRequest request = statusRequest("GROUP-OTHER");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.goToCooking(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(statusMapper, never()).goToCooking(any(), any(), any(), any());
    }

    @Test
    void rejectsOrderStatusChangeFromUnexpectedState() {
        StatusRequest request = statusRequest("GROUP-1");
        when(statusMapper.lockOrderGroupStatus("GROUP-1", "PLANT-1")).thenReturn("03");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.goToCooking(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(statusMapper, never()).goToCooking(any(), any(), any(), any());
    }

    @Test
    void rejectsMixedPlantOrderDetailChangesWithoutPartialUpdate() {
        when(statusMapper.lockChangeableOrderDetailIds(anyList(), eq("PLANT-1")))
                .thenReturn(java.util.List.of("DETAIL-1"));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.changeOrder(
                        java.util.List.of("DETAIL-1", "DETAIL-OTHER"), "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(statusMapper, never()).changeOrder(anyList(), any(), any());
    }

    @Test
    void completesPaymentWithinLoginPlant() {
        PaymentCompleteRequest request = paidRequest("카드", "MASTER-1");
        when(statusMapper.lockPaymentMasterStatus("MASTER-1", "PLANT-1")).thenReturn("01");
        when(statusMapper.lockPaymentOrderStatuses("MASTER-1", "PLANT-1")).thenReturn(java.util.List.of("03"));
        when(statusMapper.paymentCompleteOrderMaster("카드", "MASTER-1", "USER-1", "PLANT-1"))
                .thenReturn(1);

        statusService.paymentComplete(request, "USER-1", "PLANT-1");

        verify(statusMapper).paymentCompleteOrderGroup("MASTER-1", "USER-1", "PLANT-1");
        verify(eventPublisher).publishAfterCommit(
                "PLANT-1", "MASTER-1", ConsumerEventService.VISIT_CLOSED);
    }

    @Test
    void rejectsUnsupportedPaymentType() {
        PaymentCompleteRequest request = paidRequest("포인트", "MASTER-1");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.paymentComplete(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(statusMapper, never()).paymentCompleteOrderMaster(any(), any(), any(), any());
    }

    @Test
    void doesNotUpdateGroupsWhenPaymentMasterIsOutsideLoginPlant() {
        PaymentNotCompleteRequest request = new PaymentNotCompleteRequest();
        PaymentCompleteResponse.Header orderInfo = new PaymentCompleteResponse.Header();
        orderInfo.setSysId("MASTER-OTHER");
        request.setOrderInfo(orderInfo);
        request.setUnpaidReason("CUSTOMER_ABSENT");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.paymentNotComplete(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(statusMapper, never()).paymentNotCompleteOrderGroup(any(), any(), any());
    }

    @Test
    void publishesVisitClosedAfterUnpaidClosure() {
        PaymentNotCompleteRequest request = new PaymentNotCompleteRequest();
        PaymentCompleteResponse.Header orderInfo = new PaymentCompleteResponse.Header();
        orderInfo.setSysId("MASTER-1");
        request.setOrderInfo(orderInfo);
        request.setUnpaidReason("CUSTOMER_ABSENT");
        when(statusMapper.lockPaymentMasterStatus("MASTER-1", "PLANT-1")).thenReturn("01");
        when(statusMapper.lockPaymentOrderStatuses("MASTER-1", "PLANT-1"))
                .thenReturn(java.util.List.of("03"));
        when(statusMapper.paymentNotCompleteOrderMaster(
                "CUSTOMER_ABSENT", null, "MASTER-1", "USER-1", "PLANT-1"))
                .thenReturn(1);

        statusService.paymentNotComplete(request, "USER-1", "PLANT-1");

        verify(statusMapper).paymentNotCompleteOrderGroup("MASTER-1", "USER-1", "PLANT-1");
        verify(eventPublisher).publishAfterCommit(
                "PLANT-1", "MASTER-1", ConsumerEventService.VISIT_CLOSED);
    }

    @Test
    void rejectsUnpaidClosureWhenAnyOrderIsNotServed() {
        PaymentNotCompleteRequest request = new PaymentNotCompleteRequest();
        PaymentCompleteResponse.Header orderInfo = new PaymentCompleteResponse.Header();
        orderInfo.setSysId("MASTER-1");
        request.setOrderInfo(orderInfo);
        request.setUnpaidReason("CUSTOMER_ABSENT");
        when(statusMapper.lockPaymentMasterStatus("MASTER-1", "PLANT-1")).thenReturn("01");
        when(statusMapper.lockPaymentOrderStatuses("MASTER-1", "PLANT-1"))
                .thenReturn(java.util.List.of("03", "02"));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.paymentNotComplete(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(statusMapper, never()).paymentNotCompleteOrderMaster(any(), any(), any(), any(), any());
        verify(statusMapper, never()).paymentNotCompleteOrderGroup(any(), any(), any());
    }

    @Test
    void rejectsPaymentWhenAnyOrderIsNotServed() {
        PaymentCompleteRequest request = paidRequest("현금", "MASTER-1");
        when(statusMapper.lockPaymentMasterStatus("MASTER-1", "PLANT-1")).thenReturn("01");
        when(statusMapper.lockPaymentOrderStatuses("MASTER-1", "PLANT-1"))
                .thenReturn(java.util.List.of("03", "02"));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.paymentComplete(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(statusMapper, never()).paymentCompleteOrderMaster(any(), any(), any(), any());
    }

    private PaymentCompleteRequest paidRequest(String paymentType, String masterId) {
        PaymentCompleteRequest request = new PaymentCompleteRequest();
        PaymentCompleteResponse.Header header = new PaymentCompleteResponse.Header();
        header.setSysId(masterId);
        request.setPaymentType(paymentType);
        request.setHeader(header);
        return request;
    }

    private StatusRequest statusRequest(String groupId) {
        StatusRequest request = new StatusRequest();
        StatusItem.Header header = new StatusItem.Header();
        header.setSysId(groupId);
        request.setHeader(header);
        return request;
    }
}
