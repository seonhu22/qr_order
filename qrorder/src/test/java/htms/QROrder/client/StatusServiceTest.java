package htms.QROrder.client;

import htms.QROrder.client.dto.PaymentCompleteRequest;
import htms.QROrder.client.dto.PaymentCompleteResponse;
import htms.QROrder.client.dto.PaymentNotCompleteRequest;
import htms.QROrder.client.repository.StatusMapper;
import htms.QROrder.client.service.StatusService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatusServiceTest {

    @Mock
    private StatusMapper statusMapper;

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
    void completesPaymentWithinLoginPlant() {
        PaymentCompleteRequest request = paidRequest("카드", "MASTER-1");
        when(statusMapper.paymentCompleteOrderMaster("카드", "MASTER-1", "USER-1", "PLANT-1"))
                .thenReturn(1);

        statusService.paymentComplete(request, "USER-1", "PLANT-1");

        verify(statusMapper).paymentCompleteOrderGroup("MASTER-1", "USER-1", "PLANT-1");
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
        when(statusMapper.paymentNotCompleteOrderMaster(
                "CUSTOMER_ABSENT", null, "MASTER-OTHER", "USER-1", "PLANT-1"))
                .thenReturn(0);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> statusService.paymentNotComplete(request, "USER-1", "PLANT-1"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(statusMapper, never()).paymentNotCompleteOrderGroup(any(), any(), any());
    }

    private PaymentCompleteRequest paidRequest(String paymentType, String masterId) {
        PaymentCompleteRequest request = new PaymentCompleteRequest();
        PaymentCompleteResponse.Header header = new PaymentCompleteResponse.Header();
        header.setSysId(masterId);
        request.setPaymentType(paymentType);
        request.setHeader(header);
        return request;
    }
}
