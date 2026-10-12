package htms.QROrder.client.dto;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
public class OrderRevisionRequest {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 36)
    private String clientRequestId;
    @Schema(description = "같은 방문에서 수정할 원본 주문 그룹 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> orderGroupIds;
    @Schema(description = "제거할 기존 메뉴 상세 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> removeDetailIds;
    @Schema(description = "신규 RECEIVED 주문으로 추가할 메뉴", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerOrderCreateItemRequest> addedItems;
}
