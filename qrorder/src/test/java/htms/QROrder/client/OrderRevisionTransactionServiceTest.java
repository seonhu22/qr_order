package htms.QROrder.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import htms.QROrder.client.dto.OrderRevisionRequest;
import htms.QROrder.client.dto.OrderRevisionResponse;
import htms.QROrder.client.exception.OrderRevisionException;
import htms.QROrder.client.repository.OrderRevisionMapper;
import htms.QROrder.client.repository.OrderRevisionRows;
import htms.QROrder.client.service.OrderRevisionTransactionService;
import htms.QROrder.client.service.ClientEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OrderRevisionTransactionServiceTest {
    private OrderRevisionMapper mapper;
    private ConsumerOrderValidator validator;
    private OrderRevisionTransactionService service;
    private ConsumerEventPublisher consumerEventPublisher;
    private ClientEventPublisher clientEventPublisher;

    @BeforeEach
    void setUp() {
        mapper = mock(OrderRevisionMapper.class);
        validator = mock(ConsumerOrderValidator.class);
        consumerEventPublisher = mock(ConsumerEventPublisher.class);
        clientEventPublisher = mock(ClientEventPublisher.class);
        service = new OrderRevisionTransactionService(
                mapper, validator, new ObjectMapper(), consumerEventPublisher, clientEventPublisher);
    }

    @Test
    void removeOnlyDoesNotRequireActiveTableAndKeepsPaymentUntouchedByContract() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.reserveRevision(anyString(), eq("P1"), anyString(), eq("OM1"), eq("T1"), eq("FP"), eq("U1"))).thenReturn(1);
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.insertRemovedDetails(anyString(), eq(List.of("D1")), any())).thenReturn(1);
        when(mapper.findEmptyOrderGroups("P1", List.of("G1"))).thenReturn(List.of());
        when(mapper.completeRevision(anyString(), anyString(), any())).thenReturn(1);

        OrderRevisionResponse response = service.revise("P1", "U1", request, "FP");

        assertEquals(List.of("D1"), response.getRemovedDetailIds());
        assertNull(response.getCreatedOrderId());
        verify(mapper, never()).lockTable(anyString(), anyString());
        verifyNoInteractions(validator);
    }

    @Test
    void inactiveTableRejectsAddBeforeAnyOrderWrites() {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId("M1"); item.setQuantity(1); item.setOptions(List.of());
        OrderRevisionRequest request = request(List.of("D1"), List.of(item));
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.reserveRevision(anyString(), eq("P1"), anyString(), eq("OM1"), eq("T1"), eq("FP"), eq("U1"))).thenReturn(1);
        when(mapper.lockTable("P1", "T1")).thenReturn("N");
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));
        assertEquals("TABLE_INACTIVE", error.getErrorCode());
        verify(mapper, never()).reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        verify(mapper, never()).insertRemovedDetails(anyString(), anyList(), any());
        verify(mapper, never()).cancelEmptyOrderGroups(anyString(), anyList(), anyString(), any());
        verify(mapper, never()).insertOrderGroup(any());
        verify(mapper, never()).insertOrderDetail(any());
        verify(mapper, never()).insertOrderDetailOption(any());
        verify(mapper, never()).completeRevision(anyString(), anyString(), any());
        verifyNoInteractions(validator);
    }

    @Test
    void rejectsGroupsFromDifferentOrderMastersAsScopeConflict() {
        OrderRevisionRows.Target first = target("G1", "OM1", "T1", "01");
        OrderRevisionRows.Target second = target("G2", "OM2", "T1", "01");
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        request.setOrderGroupIds(List.of("G1", "G2"));
        when(mapper.findTargets("P1", List.of("G1", "G2"))).thenReturn(List.of(first, second));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));

        assertEquals("ORDER_REVISION_SCOPE_CONFLICT", error.getErrorCode());
        verify(mapper, never()).lockOrderMaster(anyString(), anyString(), anyString());
    }

    @Test
    void rejectsGroupsFromDifferentTablesAsScopeConflict() {
        OrderRevisionRows.Target first = target("G1", "OM1", "T1", "01");
        OrderRevisionRows.Target second = target("G2", "OM1", "T2", "01");
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        request.setOrderGroupIds(List.of("G1", "G2"));
        when(mapper.findTargets("P1", List.of("G1", "G2"))).thenReturn(List.of(first, second));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));

        assertEquals("ORDER_REVISION_SCOPE_CONFLICT", error.getErrorCode());
    }

    @Test
    void groupFromAnotherPlantIsNotVisibleAndReturnsNotFound() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of());

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));

        assertEquals("ORDER_REVISION_TARGET_NOT_FOUND", error.getErrorCode());
        assertEquals(404, error.getStatus().value());
    }

    @Test
    void oneOfRequestedGroupsMissingReturnsNotFound() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        request.setOrderGroupIds(List.of("G1", "G2"));
        when(mapper.findTargets("P1", List.of("G1", "G2"))).thenReturn(List.of(target("01")));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));

        assertEquals("ORDER_REVISION_TARGET_NOT_FOUND", error.getErrorCode());
        assertEquals(404, error.getStatus().value());
    }

    @Test
    void closedOrderMasterRejectsRevisionBeforeReservationOrWrites() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("02");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));

        assertEquals("ORDER_REVISION_VISIT_CLOSED", error.getErrorCode());
        verify(mapper, never()).reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        verify(mapper, never()).completeRevision(anyString(), anyString(), any());
    }

    @Test
    void cookingGroupStatus02CanBeRevised() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        stubSuccessfulRemoval("02");

        OrderRevisionResponse response = service.revise("P1", "U1", request, "FP");

        assertEquals(List.of("D1"), response.getRemovedDetailIds());
        verify(mapper).completeRevision(anyString(), anyString(), any());
        verify(consumerEventPublisher).publishAfterCommit(
                "P1", "OM1", ConsumerEventService.STATUS_CHANGED);
        verify(clientEventPublisher).publishAfterCommit(
                "P1", ClientEventPublisher.ORDER_STATUS_CHANGED);
    }

    @Test
    void completedSamePayloadReplaysStoredResponse() throws Exception {
        OrderRevisionRows.Revision revision = new OrderRevisionRows.Revision();
        revision.setRequestFingerprint("FP"); revision.setProcessingStatus("COMPLETED");
        revision.setResponseJson(new ObjectMapper().writeValueAsString(
                new OrderRevisionResponse("R1", List.of("D1"), List.of(), null, null, 0)));
        when(mapper.findRevision("P1", "123e4567-e89b-12d3-a456-426614174000")).thenReturn(revision);

        OrderRevisionResponse response = service.revise("P1", "U1", request(List.of("D1"), List.of()), "FP");
        assertEquals("R1", response.getRevisionId());
        verify(mapper, never()).reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        verifyNoInteractions(consumerEventPublisher, clientEventPublisher);
    }

    @Test
    void sameKeyWithDifferentPayloadIsStableConflict() {
        OrderRevisionRows.Revision revision = new OrderRevisionRows.Revision();
        revision.setRequestFingerprint("OTHER"); revision.setProcessingStatus("COMPLETED");
        revision.setResponseJson("{}");
        when(mapper.findRevision("P1", "123e4567-e89b-12d3-a456-426614174000")).thenReturn(revision);
        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request(List.of("D1"), List.of()), "FP"));
        assertEquals("ORDER_REVISION_PAYLOAD_MISMATCH", error.getErrorCode());
    }

    @Test
    void rejectsMoreThanNinetyNineIdsAsBadRequest() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        request.setOrderGroupIds(IntStream.range(0, 100).mapToObj(i -> "G" + i).toList());
        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));
        assertEquals("ORDER_REVISION_INVALID_REQUEST", error.getErrorCode());
        verifyNoInteractions(mapper);
    }

    @Test
    void alreadyRemovedDetailIsConflictBeforeReservation() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of());
        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));
        assertEquals("ORDER_REVISION_DETAIL_CONFLICT", error.getErrorCode());
        verify(mapper, never()).reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void partialRemovedHistoryInsertFailsTransaction() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        when(mapper.insertRemovedDetails(anyString(), anyList(), any())).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> service.revise("P1", "U1", request, "FP"));
        verify(mapper, never()).completeRevision(anyString(), anyString(), any());
        verifyNoInteractions(consumerEventPublisher, clientEventPublisher);
    }

    @Test
    void reserveConflictReplaysCompletedWinnerAfterLocks() throws Exception {
        OrderRevisionRows.Revision winner = new OrderRevisionRows.Revision();
        winner.setRequestFingerprint("FP"); winner.setProcessingStatus("COMPLETED");
        winner.setResponseJson(new ObjectMapper().writeValueAsString(
                new OrderRevisionResponse("WIN", List.of("D1"), List.of(), null, null, 0)));
        when(mapper.findRevision("P1", "123e4567-e89b-12d3-a456-426614174000"))
                .thenReturn(null, null, winner);
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("02")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(0);
        assertEquals("WIN", service.revise("P1", "U1", request(List.of("D1"), List.of()), "FP").getRevisionId());
        verify(mapper, never()).insertRemovedDetails(anyString(), anyList(), any());
    }

    @Test
    void completionWriteFailureDoesNotReturnSuccess() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        when(mapper.insertRemovedDetails(anyString(), anyList(), any())).thenReturn(1);
        when(mapper.findEmptyOrderGroups("P1", List.of("G1"))).thenReturn(List.of());
        when(mapper.completeRevision(anyString(), anyString(), any())).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> service.revise("P1", "U1", request, "FP"));
        verifyNoInteractions(consumerEventPublisher, clientEventPublisher);
    }

    @Test
    void rejectsServingCompleteGroup() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("03")));
        when(mapper.reserveRevision(anyString(), eq("P1"), anyString(), eq("OM1"), eq("T1"), eq("FP"), eq("U1"))).thenReturn(1);
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("03")));

        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));
        assertEquals("ORDER_REVISION_STATUS_CONFLICT", error.getErrorCode());
    }

    @Test
    void recordsRemovalAutoCancelsEmptyGroupAndCreatesOneReceivedGroupForAllAdds() {
        ConsumerOrderCreateItemRequest first = new ConsumerOrderCreateItemRequest();
        first.setMenuSysId("M1"); first.setQuantity(2); first.setOptions(List.of());
        ConsumerOrderCreateItemRequest second = new ConsumerOrderCreateItemRequest();
        second.setMenuSysId("M2"); second.setQuantity(1); second.setOptions(List.of());
        OrderRevisionRequest request = request(List.of("D1"), List.of(first, second));
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.reserveRevision(anyString(), eq("P1"), anyString(), eq("OM1"), eq("T1"), eq("FP"), eq("U1"))).thenReturn(1);
        when(mapper.lockTable("P1", "T1")).thenReturn("Y");
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.insertRemovedDetails(anyString(), eq(List.of("D1")), any())).thenReturn(1);
        when(mapper.findEmptyOrderGroups("P1", List.of("G1"))).thenReturn(List.of("G1"));
        when(mapper.cancelEmptyOrderGroups(eq("P1"), eq(List.of("G1")), eq("U1"), any())).thenReturn(1);
        when(mapper.findNextOrderNumber("P1")).thenReturn(17);
        when(mapper.insertOrderGroup(any())).thenReturn(1);
        when(mapper.insertOrderDetail(any())).thenReturn(1);
        when(mapper.completeRevision(anyString(), anyString(), any())).thenReturn(1);
        when(validator.validate(eq("P1"), any())).thenReturn(new ValidatedConsumerOrder(
                request.getClientRequestId(),
                List.of(
                        new ValidatedConsumerOrder.Item("M1", 2, 1000, 1000, 2000, List.of()),
                        new ValidatedConsumerOrder.Item("M2", 1, 500, 500, 500, List.of())
                ), 2500));

        OrderRevisionResponse response = service.revise("P1", "U1", request, "FP");

        assertEquals(List.of("G1"), response.getCancelledOrderGroupIds());
        assertEquals("17", response.getCreatedOrderNo());
        assertEquals(2500, response.getAddedTotalAmount());
        verify(mapper, times(1)).insertOrderGroup(any());
        verify(mapper, times(2)).insertOrderDetail(any());
        verify(mapper).cancelEmptyOrderGroups(eq("P1"), eq(List.of("G1")), eq("U1"), any());
    }

    @Test
    void storesOptionQuantityMultipliedByMenuQuantityAndAuditScope() {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId("M1"); item.setQuantity(3); item.setOptions(List.of());
        OrderRevisionRequest request = request(List.of(), List.of(item));
        ValidatedConsumerOrder validated = new ValidatedConsumerOrder(request.getClientRequestId(), List.of(
                new ValidatedConsumerOrder.Item("M1", 3, 1000, 1200, 3600,
                        List.of(new ValidatedConsumerOrder.Option("O1", 2, 6, 100, 600)))
        ), 3600);
        stubSuccessfulAddition(validated);

        service.revise("P1", "U1", request, "FP");

        var groupCaptor = org.mockito.ArgumentCaptor.forClass(OrderRevisionRows.Group.class);
        var detailCaptor = org.mockito.ArgumentCaptor.forClass(OrderRevisionRows.Item.class);
        var optionCaptor = org.mockito.ArgumentCaptor.forClass(OrderRevisionRows.Option.class);
        verify(mapper).insertOrderGroup(groupCaptor.capture());
        verify(mapper).insertOrderDetail(detailCaptor.capture());
        verify(mapper).insertOrderDetailOption(optionCaptor.capture());
        assertAll(
                () -> assertEquals("OM1", groupCaptor.getValue().getOrderMasterId()),
                () -> assertEquals("P1", groupCaptor.getValue().getSysPlantCd()),
                () -> assertEquals("U1", groupCaptor.getValue().getUserId()),
                () -> assertEquals("OM1", detailCaptor.getValue().getOrderMasterId()),
                () -> assertEquals("P1", detailCaptor.getValue().getSysPlantCd()),
                () -> assertEquals("U1", detailCaptor.getValue().getUserId()),
                () -> assertEquals(6, optionCaptor.getValue().getQuantity()),
                () -> assertEquals("P1", optionCaptor.getValue().getSysPlantCd()),
                () -> assertEquals("U1", optionCaptor.getValue().getUserId())
        );
    }

    @Test
    void zeroGroupInsertStopsAllFollowingWritesAndCompletion() {
        assertAddInsertFailure(InsertPoint.GROUP, false);
    }

    @Test
    void groupInsertExceptionStopsAllFollowingWritesAndCompletion() {
        assertAddInsertFailure(InsertPoint.GROUP, true);
    }

    @Test
    void zeroDetailInsertStopsOptionWriteAndCompletion() {
        assertAddInsertFailure(InsertPoint.DETAIL, false);
    }

    @Test
    void detailInsertExceptionStopsOptionWriteAndCompletion() {
        assertAddInsertFailure(InsertPoint.DETAIL, true);
    }

    @Test
    void zeroOptionInsertStopsCompletion() {
        assertAddInsertFailure(InsertPoint.OPTION, false);
    }

    @Test
    void optionInsertExceptionStopsCompletion() {
        assertAddInsertFailure(InsertPoint.OPTION, true);
    }

    @Test
    void emptyChangeIsBadRequestWithoutMapperCalls() {
        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request(List.of(), List.of()), "FP"));
        assertEquals("ORDER_REVISION_INVALID_REQUEST", error.getErrorCode());
        assertEquals(400, error.getStatus().value());
        verifyNoInteractions(mapper, validator);
    }

    @Test
    void duplicateGroupIdsAreBadRequest() {
        OrderRevisionRequest request = request(List.of("D1"), List.of());
        request.setOrderGroupIds(List.of("G1", "G1"));
        assertBadRequestWithoutMapperCalls(request);
    }

    @Test
    void duplicateDetailIdsAreBadRequest() {
        assertBadRequestWithoutMapperCalls(request(List.of("D1", "D1"), List.of()));
    }

    private void assertBadRequestWithoutMapperCalls(OrderRevisionRequest request) {
        OrderRevisionException error = assertThrows(OrderRevisionException.class,
                () -> service.revise("P1", "U1", request, "FP"));
        assertEquals("ORDER_REVISION_INVALID_REQUEST", error.getErrorCode());
        assertEquals(400, error.getStatus().value());
        verifyNoInteractions(mapper, validator);
    }

    private void assertAddInsertFailure(InsertPoint point, boolean throwsException) {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId("M1"); item.setQuantity(1); item.setOptions(List.of());
        OrderRevisionRequest request = request(List.of(), List.of(item));
        ValidatedConsumerOrder validated = new ValidatedConsumerOrder(request.getClientRequestId(), List.of(
                new ValidatedConsumerOrder.Item("M1", 1, 1000, 1100, 1100,
                        List.of(new ValidatedConsumerOrder.Option("O1", 1, 1, 100, 100)))
        ), 1100);
        stubSuccessfulAddition(validated);
        RuntimeException failure = new RuntimeException("db write failed");
        switch (point) {
            case GROUP -> {
                if (throwsException) when(mapper.insertOrderGroup(any())).thenThrow(failure);
                else when(mapper.insertOrderGroup(any())).thenReturn(0);
            }
            case DETAIL -> {
                if (throwsException) when(mapper.insertOrderDetail(any())).thenThrow(failure);
                else when(mapper.insertOrderDetail(any())).thenReturn(0);
            }
            case OPTION -> {
                if (throwsException) when(mapper.insertOrderDetailOption(any())).thenThrow(failure);
                else when(mapper.insertOrderDetailOption(any())).thenReturn(0);
            }
        }

        assertThrows(RuntimeException.class, () -> service.revise("P1", "U1", request, "FP"));
        if (point == InsertPoint.GROUP) {
            verify(mapper, never()).insertOrderDetail(any());
            verify(mapper, never()).insertOrderDetailOption(any());
        } else if (point == InsertPoint.DETAIL) {
            verify(mapper, never()).insertOrderDetailOption(any());
        }
        verify(mapper, never()).completeRevision(anyString(), anyString(), any());
    }

    private void stubSuccessfulRemoval(String groupStatus) {
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target(groupStatus)));
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target(groupStatus)));
        when(mapper.lockOrderDetails("P1", "OM1", List.of("G1"), List.of("D1"))).thenReturn(List.of("D1"));
        when(mapper.reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        when(mapper.insertRemovedDetails(anyString(), anyList(), any())).thenReturn(1);
        when(mapper.findEmptyOrderGroups("P1", List.of("G1"))).thenReturn(List.of());
        when(mapper.completeRevision(anyString(), anyString(), any())).thenReturn(1);
    }

    private void stubSuccessfulAddition(ValidatedConsumerOrder validated) {
        when(mapper.findTargets("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.lockTable("P1", "T1")).thenReturn("Y");
        when(mapper.lockOrderMaster("P1", "OM1", "T1")).thenReturn("01");
        when(mapper.lockOrderGroups("P1", List.of("G1"))).thenReturn(List.of(target("01")));
        when(mapper.reserveRevision(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        when(validator.validate(eq("P1"), any())).thenReturn(validated);
        when(mapper.findNextOrderNumber("P1")).thenReturn(17);
        when(mapper.insertOrderGroup(any())).thenReturn(1);
        when(mapper.insertOrderDetail(any())).thenReturn(1);
        when(mapper.insertOrderDetailOption(any())).thenReturn(1);
        when(mapper.completeRevision(anyString(), anyString(), any())).thenReturn(1);
    }

    private OrderRevisionRequest request(List<String> details, List<ConsumerOrderCreateItemRequest> items) {
        OrderRevisionRequest request = new OrderRevisionRequest();
        request.setClientRequestId("123e4567-e89b-12d3-a456-426614174000");
        request.setOrderGroupIds(List.of("G1")); request.setRemoveDetailIds(details); request.setAddedItems(items);
        return request;
    }

    private OrderRevisionRows.Target target(String status) {
        return target("G1", "OM1", "T1", status);
    }

    private OrderRevisionRows.Target target(String groupId, String masterId, String tableId, String status) {
        OrderRevisionRows.Target target = new OrderRevisionRows.Target();
        target.setOrderGroupId(groupId); target.setOrderMasterId(masterId); target.setTableSysId(tableId);
        target.setOrderStatus(status); target.setMasterStatus("01"); return target;
    }

    private enum InsertPoint { GROUP, DETAIL, OPTION }
}
