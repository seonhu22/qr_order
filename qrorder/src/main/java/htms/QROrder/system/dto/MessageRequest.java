package htms.QROrder.system.dto;

import htms.QROrder.system.domain.Message;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MessageRequest {
    private List<Message> newItems = new ArrayList<>();
    private List<Message> updateItems = new ArrayList<>();
    private List<Message> delItems = new ArrayList<>();
}
