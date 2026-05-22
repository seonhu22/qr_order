package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StoreMenuDetailRequest {
    private List<StoreMenuDetailItem> newItems;
    private List<StoreMenuDetailItem> updateItems;
    private List<StoreMenuDetailItem> delItems;
}
