package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StoreInfoItem {
    private String sysId;
    private String storeName;
    private String address;
    private String phoneNumber;
    private LocalDateTime openDatetime;
    private LocalDateTime closeDatetime;
}
