package htms.QROrder.system.dto;

import htms.QROrder.system.domain.Message;
import lombok.Data;

import java.util.List;

@Data
public class MessageRequest {
    private List<Message> newItems;
    private List<Message> updateItems;
    private List<Message> delItems;
}
