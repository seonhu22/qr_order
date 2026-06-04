package htms.QROrder.client.dto;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;

@Data
public class StoreInfoItem {
    private String sysId;
    private String storeName;
    private String address;
    private String phoneNumber;
    private String emergencyPhoneNumber;
    private String email;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime openTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime closeTime;
}
