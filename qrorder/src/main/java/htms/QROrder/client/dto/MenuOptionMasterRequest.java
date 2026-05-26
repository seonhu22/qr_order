package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuOptionMasterRequest {
    private List<MenuOptionMasterItem> newItems = new ArrayList<>();
    private List<MenuOptionMasterItem> updateItems = new ArrayList<>();
    private List<MenuOptionMasterItem> delItems = new ArrayList<>();
}
