package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class QRCodeRequest {
    private List<QRCodeItem> newItems = new ArrayList<>();
    private List<QRCodeItem> updateItems = new ArrayList<>();
    private List<QRCodeItem> delItems = new ArrayList<>();
}
