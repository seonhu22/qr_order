package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class QRCodeRequest {
    private List<QRCodeItem> newItems;
    private List<QRCodeItem> updateItems;
    private List<QRCodeItem> delItems;
}
