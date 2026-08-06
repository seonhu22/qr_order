package htms.QROrder.client.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
@JsonPropertyOrder({"orderNum", "header", "body", "footer"})
public class StatusItem {
    private Integer orderNum;
    private Header header;
    private List<Body> body;
    private Footer footer;

    @Data
    @Schema(name = "StatusHeader")
    public static class Header {
        private String sysId;
        private Integer orderNum;
        private Integer tableNum;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime orderDatetime;
        @JsonFormat(pattern = "HH:mm")
        private LocalTime orderTime;
        private String orderStatus;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime cancelDatetime;
    }

    @Data
    public static class Body {
        private String linkSysId;
        private String rowType;
        private String detailSysId;
        private String parentDetailSysId;
        private String itemName;
        private Integer qty;
        private Integer price;
        private String paymentYn;
    }

    @Data
    public static class Footer {
        private String sysId;
        private Integer totalPrice;
    }
}
