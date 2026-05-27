package htms.QROrder.system.dto;

import htms.QROrder.system.domain.Menu;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuRequest {
    private List<Menu> newItems = new ArrayList<>();
    private List<Menu> updateItems = new ArrayList<>();
    private List<Menu> delItems = new ArrayList<>();
}
