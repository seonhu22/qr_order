package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerMenuOptionItem {
    private String menuOptionSysId;
    private String menuOptionName;
    private Integer menuOptionPrice;
    @Schema(nullable = true)
    private String menuOptionDescription;
    @Schema(
            description = "수량 선택(03)은 1 이상의 최대 수량, 단일·복수 선택(01/02)은 0",
            nullable = false
    )
    private Integer maximumNum;
    @Schema(allowableValues = {"Y", "N"})
    private String defaultYn;
}
