package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class OrderHistoryResponse {
    private List<OrderMasterHistoryItem> orderMasterHistory;
    private List<OrderDetailHistoryItem> orderDetailHistory;
}
