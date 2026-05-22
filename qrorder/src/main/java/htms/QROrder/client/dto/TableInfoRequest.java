package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class TableInfoRequest {
    private List<TableInfoItem> newItems;
    private List<TableInfoItem> updateItems;
    private List<TableInfoItem> delItems;
}
