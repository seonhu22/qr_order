package htms.QROrder.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaymentCompleteResponse {
    private Header header;
    private List<Body> body;
    private Footer footer;

    @Data
    @Schema(name = "PaymentCompleteHeader")
    public static class Header {
        private String sysId;
        private String tableInfo;
        private LocalDateTime orderDatetime;
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