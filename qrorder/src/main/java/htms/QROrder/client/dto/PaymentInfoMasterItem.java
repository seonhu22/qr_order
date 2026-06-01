package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.cglib.core.Local;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaymentInfoMasterItem {
    private String sysId;
    private String tableInfo;
    private String paymentType;
    private String orderStatus;
    private LocalDateTime orderDatetime;
    private Integer totalPrice;
}