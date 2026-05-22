package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StoreMenuMasterRequest {
    private List<StoreMenuMasterItem> newItems;
    private List<StoreMenuMasterItem> updateItems;
    private List<StoreMenuMasterItem> delItems;
}
