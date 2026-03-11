package htms.QROrder.system.dto;

import htms.QROrder.system.domain.CommonDetail;
import lombok.Data;

import java.util.List;

@Data
public class CommonDetailRequest {
    private String linkSysId;
    private List<CommonDetail> newItems;
    private List<CommonDetail> updateItems;
    private List<CommonDetail> deleteItems;
}
