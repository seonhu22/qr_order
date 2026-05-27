package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TableInfoRequest {
    private List<TableInfoItem> newItems = new ArrayList<>();
    private List<TableInfoItem> updateItems = new ArrayList<>();
    private List<TableInfoItem> delItems = new ArrayList<>();
}
