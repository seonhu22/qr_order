package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuDetailRequest {
    private List<MenuDetailItem> newItems = new ArrayList<>();
    private List<MenuDetailItem> updateItems = new ArrayList<>();
    private List<MenuDetailItem> delItems = new ArrayList<>();
}
