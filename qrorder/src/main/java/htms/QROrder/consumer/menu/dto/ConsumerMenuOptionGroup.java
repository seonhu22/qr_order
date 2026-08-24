package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerMenuOptionGroup {
    private String optionGroupSysId;
    private String groupName;
    @Schema(allowableValues = {"Y", "N"})
    private String requiredYn;
    @Schema(
            description = "01: 단일 선택, 02: 복수 선택, 03: 수량 선택",
            allowableValues = {"01", "02", "03"}
    )
    private String selectionType;
    private List<ConsumerMenuOptionItem> optionList;
}
