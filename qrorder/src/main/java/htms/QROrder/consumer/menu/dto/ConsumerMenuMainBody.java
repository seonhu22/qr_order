package htms.QROrder.consumer.menu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerMenuMainBody {
    private List<ConsumerMenuItem> menuList;
}
