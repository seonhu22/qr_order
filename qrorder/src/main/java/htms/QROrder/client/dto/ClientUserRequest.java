package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class ClientUserRequest {
    private List<ClientUserItem> newItems;
    private List<ClientUserItem> updateItems;
    private List<ClientUserItem> delItems;
}
