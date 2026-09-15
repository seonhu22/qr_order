package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuOptionDetailRequest {
    private List<MenuOptionDetailItem> newItems = new ArrayList<>();
    private List<MenuOptionDetailItem> updateItems = new ArrayList<>();
    private List<MenuOptionDetailItem> delItems = new ArrayList<>();
}
