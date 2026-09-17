package htms.QROrder.client;

import htms.QROrder.client.dto.StaffCallSettingItem;
import htms.QROrder.client.dto.StaffCallSettingRequest;
import htms.QROrder.client.repository.StaffCallSettingMapper;
import htms.QROrder.client.service.StaffCallSettingService;
import htms.QROrder.common.exception.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffCallSettingServiceTest {
    @Mock StaffCallSettingMapper mapper;
    @InjectMocks StaffCallSettingService service;

    @Test
    void savesValidCommonCodeForLoggedInPlant() {
        StaffCallSettingItem item = item(null, "WATER");
        StaffCallSettingRequest request = new StaffCallSettingRequest();
        request.setNewItems(List.of(item));
        when(mapper.existsCommonCode("WATER")).thenReturn(true);

        service.save(request, "STORE_A");

        verify(mapper).insert(item, "STORE_A");
    }

    @Test
    void rejectsCodeOutsideStaffCallCommonCode() {
        StaffCallSettingItem item = item(null, "UNKNOWN");
        StaffCallSettingRequest request = new StaffCallSettingRequest();
        request.setNewItems(List.of(item));

        assertThrows(ValidationException.class, () -> service.save(request, "STORE_A"));
        verify(mapper, never()).insert(item, "STORE_A");
    }

    @Test
    void rejectsUpdateOwnedByAnotherPlant() {
        StaffCallSettingItem item = item("setting-1", "WATER");
        StaffCallSettingRequest request = new StaffCallSettingRequest();
        request.setUpdateItems(List.of(item));
        when(mapper.belongsToPlant("STORE_A", "setting-1")).thenReturn(false);

        assertThrows(ValidationException.class, () -> service.save(request, "STORE_A"));
        verify(mapper, never()).update(item, "STORE_A");
    }

    @Test
    void rejectsDuplicateCodeInPlant() {
        StaffCallSettingItem item = item(null, "WATER");
        StaffCallSettingRequest request = new StaffCallSettingRequest();
        request.setNewItems(List.of(item));
        when(mapper.existsByCallCd("STORE_A", "WATER", null)).thenReturn(true);

        assertThrows(ValidationException.class, () -> service.save(request, "STORE_A"));
        verify(mapper, never()).insert(item, "STORE_A");
    }

    private StaffCallSettingItem item(String sysId, String callCd) {
        StaffCallSettingItem item = new StaffCallSettingItem();
        item.setSysId(sysId);
        item.setCallCd(callCd);
        item.setCallNm("물");
        item.setSingleYn("N");
        return item;
    }
}
