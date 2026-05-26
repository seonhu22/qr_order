package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StoreMenuMasterRequest {
    private List<StoreMenuMasterItem> newItems = new ArrayList<>();
    private List<StoreMenuMasterItem> updateItems = new ArrayList<>();
    private List<StoreMenuMasterItem> delItems = new ArrayList<>();
}
