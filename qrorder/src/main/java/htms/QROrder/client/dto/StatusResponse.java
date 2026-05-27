package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatusResponse {
    String statusFlag;
    List<StatusItem> statusList;
}
