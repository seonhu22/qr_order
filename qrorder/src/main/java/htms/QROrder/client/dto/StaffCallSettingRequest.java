package htms.QROrder.client.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StaffCallSettingRequest {
    private List<StaffCallSettingItem> newItems = new ArrayList<>();
    private List<StaffCallSettingItem> updateItems = new ArrayList<>();
    private List<StaffCallSettingItem> delItems = new ArrayList<>();
}
