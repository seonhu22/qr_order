package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatusItem {
    String orderNum;
    StatusHeaderItem header;
    List<StatusBodyItem> body;
    StatusFooterItem footer;
}
