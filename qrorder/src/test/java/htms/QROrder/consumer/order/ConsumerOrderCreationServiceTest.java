package htms.QROrder.consumer.order;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.idempotency.ConsumerOrderIdempotencyKey;
import htms.QROrder.consumer.order.idempotency.ConsumerOrderIdempotencyStore;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.order.service.ConsumerOrderTransactionService;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumerOrderCreationServiceTest {

    private final ConsumerOrderValidator validator = mock(ConsumerOrderValidator.class);
    private final ConsumerOrderIdempotencyStore store = mock(ConsumerOrderIdempotencyStore.class);
    private final ConsumerOrderTransactionService transactionService = mock(ConsumerOrderTransactionService.class);
    private final ConsumerOrderCreationService service = new ConsumerOrderCreationService(
            validator, new ConsumerOrderSessionGuard(), store, transactionService);

    @Test
    @SuppressWarnings("unchecked")
    void scopesIdempotencyByPlantVisitAndClientRequestIdBeforeStartingTransaction() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerSessionBinding binding = binding();
        ConsumerOrderCreateRequest request = request("04675a1e-4f03-4415-9230-626c94539238");
        ConsumerOrderCreateResponse expected = mock(ConsumerOrderCreateResponse.class);
        when(transactionService.createOrder(qr, binding, request)).thenReturn(expected);
        when(store.execute(any(), anyString(), any())).thenAnswer(invocation ->
                ((Supplier<ConsumerOrderCreateResponse>) invocation.getArgument(2)).get());

        ConsumerOrderCreateResponse actual = service.createOrder(qr, binding, request);

        assertEquals(expected, actual);
        ArgumentCaptor<ConsumerOrderIdempotencyKey> key =
                ArgumentCaptor.forClass(ConsumerOrderIdempotencyKey.class);
        verify(store).execute(key.capture(), anyString(), any());
        assertEquals("PLANT-1", key.getValue().sysPlantCd());
        assertEquals("VISIT-1", key.getValue().consumerSessionId());
        assertEquals("04675a1e-4f03-4415-9230-626c94539238", key.getValue().clientRequestId());
        verify(transactionService).createOrder(qr, binding, request);
    }

    @Test
    void rejectsMismatchedBindingBeforeValidationAndIdempotencyLookup() {
        ConsumerSessionBinding otherTable = new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-OTHER", LocalDateTime.now());

        assertThrows(ConsumerOrderSessionRequiredException.class,
                () -> service.createOrder(qrTableInfo(), otherTable, request("request")));

        verifyNoInteractions(validator, store, transactionService);
    }

    @Test
    void rejectsInvalidRequestBeforeCreatingAnIdempotencyReservation() {
        ConsumerOrderCreateRequest request = request("invalid");
        org.mockito.Mockito.doThrow(new ValidationException("invalid request"))
                .when(validator).validateRequest(request);

        assertThrows(ValidationException.class,
                () -> service.createOrder(qrTableInfo(), binding(), request));

        verify(store, never()).execute(any(), anyString(), any());
        verifyNoInteractions(transactionService);
    }

    private ConsumerOrderCreateRequest request(String clientRequestId) {
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        request.setClientRequestId(clientRequestId);
        return request;
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        return qr;
    }

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now());
    }
}
