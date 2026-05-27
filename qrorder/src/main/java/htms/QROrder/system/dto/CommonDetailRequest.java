package htms.QROrder.system.dto;

import htms.QROrder.system.domain.CommonDetail;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CommonDetailRequest {
    private String linkSysId;
    private List<CommonDetail> newItems = new ArrayList<>();
    private List<CommonDetail> updateItems = new ArrayList<>();
    private List<CommonDetail> deleteItems = new ArrayList<>();
}
