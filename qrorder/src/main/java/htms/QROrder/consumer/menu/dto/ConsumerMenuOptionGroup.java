package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerMenuOptionGroup {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String optionGroupSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String groupName;
    @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
    private String requiredYn;
    @Schema(
            description = "01: 단일 선택, 02: 복수 선택, 03: 수량 선택",
            allowableValues = {"01", "02", "03"},
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String selectionType;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerMenuOptionItem> optionList;
}
