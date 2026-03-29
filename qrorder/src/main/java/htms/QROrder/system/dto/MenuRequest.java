package htms.QROrder.system.dto;

import htms.QROrder.system.domain.Menu;
import lombok.Data;

import java.util.List;

@Data
public class MenuRequest {
    private List<Menu> newItems;
    private List<Menu> updateItems;
    private List<Menu> delItems;
}
