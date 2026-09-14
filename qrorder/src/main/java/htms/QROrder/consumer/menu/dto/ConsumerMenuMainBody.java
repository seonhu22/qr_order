package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerMenuMainBody {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerMenuItem> menuList;
}
