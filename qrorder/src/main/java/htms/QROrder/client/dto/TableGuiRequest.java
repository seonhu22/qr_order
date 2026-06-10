package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TableGuiRequest {
    private List<TableGuiItem> newItems = new ArrayList<>();
    private List<TableGuiItem> updateItems = new ArrayList<>();
    private List<TableGuiItem> delItems = new ArrayList<>();
}
