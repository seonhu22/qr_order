package htms.QROrder.consumer.menu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerMenuMainResponse {
    private String storeName;
    private Integer tableNum;
    private ConsumerMenuMainHeader header;
    private ConsumerMenuMainBody body;
}
