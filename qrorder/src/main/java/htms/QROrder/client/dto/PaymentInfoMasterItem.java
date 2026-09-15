package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaymentInfoMasterItem {
    private String sysId;
    private String tableInfo;
    private String paymentType;
    private String orderStatus;
    private String orderNum;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderDatetime;
    private Integer totalPrice;
}