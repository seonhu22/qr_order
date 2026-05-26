package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StoreMenuDetailRequest {
    private List<StoreMenuDetailItem> newItems = new ArrayList<>();
    private List<StoreMenuDetailItem> updateItems = new ArrayList<>();
    private List<StoreMenuDetailItem> delItems = new ArrayList<>();
}
