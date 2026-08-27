package htms.QROrder.consumer.session.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ConsumerSessionBinding implements Serializable {
    public static final String SESSION_ATTRIBUTE = "consumerSessionBinding";

    private String consumerSessionId;
    private String sysPlantCd;
    private String tableSysId;
    private LocalDateTime startedAt;

    public boolean belongsTo(String sysPlantCd, String tableSysId) {
        return this.sysPlantCd.equals(sysPlantCd) && this.tableSysId.equals(tableSysId);
    }
}
