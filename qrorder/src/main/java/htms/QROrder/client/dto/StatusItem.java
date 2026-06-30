package htms.QROrder.client.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class StatusItem {
    private Integer orderNum;
    private Header header;
    private List<Body> body;
    private Footer footer;

    @Data
    public static class Header {
        private String sysId;
        private Integer orderNum;
        private Integer tableNum;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime orderDatetime;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime orderTime;
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