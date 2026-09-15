package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SettlementItem {
    private Integer totalPrice;
    private Integer cancelPrice;
    private Integer discountPice;
    private Integer netPrice;
    private Integer orderCount;
    private List<dailySale> dailySales;

    @Data
    public static class dailySale {
        @DateTimeFormat(pattern = "yyyy-MM-dd")
        private LocalDate groupDate;
        private Integer dayTotalPrice;
        private Integer dayCancelPrice;
        private Integer dayNetPrice;
        private Integer dayOrderCount;
        private Integer dayCancelCount;
    }
}