package htms.QROrder.client;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.MenuDetailItem;
import htms.QROrder.client.dto.MenuDetailRequest;
import htms.QROrder.client.repository.MenuDetailMapper;
import htms.QROrder.client.service.MenuDetailService;
import htms.QROrder.common.service.FileService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MenuDetailContractTest {

    @Test
    void mapperPersistsAndReadsRequiredSoldOutValue() throws Exception {
        String xml = new String(getClass().getResourceAsStream(
                "/mapper/client/MenuDetailMapper.xml").readAllBytes());

        assertTrue(xml.contains("sold_out_yn"));
        assertTrue(xml.contains("#{item.soldOutYn}"));
    }

    @Test
    void newMenuDefaultsToNotSoldOutBeforePersistence() {
        MenuDetailMapper mapper = mock(MenuDetailMapper.class);
        MenuDetailService service = service(mapper);
        MenuDetailItem item = item(null);
        MenuDetailRequest request = new MenuDetailRequest();
        request.setNewItems(List.of(item));

        service.saveMenuDetail(request, null, "ADMIN", "PC003", "MENU");

        ArgumentCaptor<List<MenuDetailItem>> items = ArgumentCaptor.forClass(List.class);
        verify(mapper).newMenuDetail(items.capture(), eq("ADMIN"), eq("PC003"), eq("MENU"));
        assertEquals("N", items.getValue().get(0).getSoldOutYn());
    }

    @Test
    void updatePreservesStoredSoldOutValueWhenRequestOmitsIt() {
        MenuDetailMapper mapper = mock(MenuDetailMapper.class);
        MenuDetailService service = service(mapper);
        MenuDetailItem incoming = item(null);
        incoming.setSysId("MENU-1");
        MenuDetailItem stored = item("Y");
        stored.setSysId("MENU-1");
        when(mapper.getOldData(anyList())).thenReturn(List.of(stored));
        MenuDetailRequest request = new MenuDetailRequest();
        request.setUpdateItems(List.of(incoming));

        service.saveMenuDetail(request, null, "ADMIN", "PC003", "MENU");

        ArgumentCaptor<List<MenuDetailItem>> items = ArgumentCaptor.forClass(List.class);
        verify(mapper).updateMenuDetail(items.capture(), eq("ADMIN"), eq("PC003"), eq("MENU"));
        assertEquals("Y", items.getValue().get(0).getSoldOutYn());
    }

    private MenuDetailService service(MenuDetailMapper mapper) {
        return new MenuDetailService(mock(AuditService.class), mapper, mock(FileService.class));
    }

    private MenuDetailItem item(String soldOutYn) {
        MenuDetailItem item = new MenuDetailItem();
        item.setMenuName("메뉴");
        item.setSoldOutYn(soldOutYn);
        return item;
    }
}
