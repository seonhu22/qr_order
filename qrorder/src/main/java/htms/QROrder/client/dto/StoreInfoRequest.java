package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StoreInfoRequest {
    private List<StoreInfoItem> newItems;
    private List<StoreInfoItem> updateItems;
    private List<StoreInfoItem> delItems;
}
