package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatusItem {
    private String orderNum;
    private StatusHeaderItem header;
    private List<StatusBodyItem> body;
    private StatusFooterItem footer;
}
