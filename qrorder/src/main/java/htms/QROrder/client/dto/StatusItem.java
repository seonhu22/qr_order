package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StatusItem {
    private String orderNum;
    private Header header;
    private List<Body> body;
    private Footer footer;

    @Data
    public static class Header {
        private String sysId;
        private Integer orderNum;
        private Integer tableNum;
        private LocalDateTime orderDatetime;
        private String orderStatus;
    }

    @Data
    public static class Body {
        private String linkSysId;
        private String rowType;
        private String detailSysId;
        private String parentDetailSysId;
        private String itemName;
        private Integer qty;
        private String paymentYn;
    }

    @Data
    public static class Footer {
        private String sysId;
        private Integer totalPrice;
    }
}