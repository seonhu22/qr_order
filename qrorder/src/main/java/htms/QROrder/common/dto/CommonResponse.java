package htms.QROrder.common.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommonResponse {
    private boolean success;
    private String message;
    private String error;
    private Object data;
}
