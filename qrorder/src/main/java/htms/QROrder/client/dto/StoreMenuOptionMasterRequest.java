package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StoreMenuOptionMasterRequest {
    private List<StoreMenuOptionMasterItem> newItems = new ArrayList<>();
    private List<StoreMenuOptionMasterItem> updateItems = new ArrayList<>();
    private List<StoreMenuOptionMasterItem> delItems = new ArrayList<>();
}
