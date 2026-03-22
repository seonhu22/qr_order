package htms.QROrder.system.dto;

import htms.QROrder.system.domain.RuleDetail;
import lombok.Data;

import java.util.List;

@Data
public class RuleDetailRequest {
    List<RuleDetail> newItems;
    List<RuleDetail> updateItems;
    List<RuleDetail> delItems;
}
