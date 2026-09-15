package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class SettlementRequest {
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate searchStartDate;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate searchEndDate;
}