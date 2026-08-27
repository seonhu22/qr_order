package htms.QROrder.consumer.session.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ConsumerSessionResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String consumerSessionId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {"ACTIVE", "CLOSED", "EXPIRED"})
    private String status;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String sysPlantCd;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String storeName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String tableSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String tableName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer tableNum;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer tableQty;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string", example = "2026-08-27 10:20:30")
    private LocalDateTime startedAt;

    public ConsumerSessionBinding toBinding() {
        return new ConsumerSessionBinding(consumerSessionId, sysPlantCd, tableSysId, startedAt);
    }
}
