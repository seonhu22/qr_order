package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StoreMenuOptionMasterRequest {
    private List<StoreMenuOptionMasterItem> newItems;
    private List<StoreMenuOptionMasterItem> updateItems;
    private List<StoreMenuOptionMasterItem> delItems;
}
