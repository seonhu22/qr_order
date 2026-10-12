package htms.QROrder.client;

import htms.QROrder.client.dto.StaffCallNotificationGroup;
import htms.QROrder.client.dto.StaffCallNotificationItem;
import htms.QROrder.client.repository.StaffCallNotificationMapper;
import htms.QROrder.client.service.StaffCallNotificationService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StaffCallNotificationServiceTest {

    private final StaffCallNotificationMapper mapper = mock(StaffCallNotificationMapper.class);
    private final StaffCallNotificationService service = new StaffCallNotificationService(mapper);

    @Test
    void returnsOneNotificationGroupForMultipleItemsInOneCall() {
        StaffCallNotificationGroup group = new StaffCallNotificationGroup();
        group.setMasterSysId("MASTER-1");
        group.setTableSysId("TABLE-1");
        group.setTableNum(3);
        group.setItems(List.of(item("ITEM-1", "WATER", 2), item("ITEM-2", "NAPKIN", 1)));
        when(mapper.findUnread("PLANT-1")).thenReturn(List.of(group));

        List<StaffCallNotificationGroup> result = service.findUnread("PLANT-1");

        assertEquals(1, result.size());
        assertEquals("TABLE-1", result.get(0).getTableSysId());
        assertEquals(3, result.get(0).getTableNum());
        assertEquals(2, result.get(0).getItems().size());
    }

    @Test
    void marksOneNotificationReadForCurrentStore() {
        service.markRead("MASTER-1", "PLANT-1");

        verify(mapper).markRead("MASTER-1", "PLANT-1");
    }

    @Test
    void treatsAlreadyReadMissingOrOtherStoreNotificationAsSuccess() {
        when(mapper.markRead("MASTER-1", "PLANT-1")).thenReturn(0);

        assertDoesNotThrow(() -> service.markRead("MASTER-1", "PLANT-1"));
    }

    @Test
    void keepsStoreWideReadAllBehavior() {
        service.markAllRead("PLANT-1");

        verify(mapper).markAllRead("PLANT-1");
    }

    private StaffCallNotificationItem item(String sysId, String callCd, int quantity) {
        StaffCallNotificationItem item = new StaffCallNotificationItem();
        item.setSysId(sysId);
        item.setCallCd(callCd);
        item.setQuantity(quantity);
        return item;
    }
}
