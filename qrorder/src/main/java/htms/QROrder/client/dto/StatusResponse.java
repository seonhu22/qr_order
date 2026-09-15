package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatusResponse {
    private String statusFlag;
    private List<StatusItem> statusList;
}
