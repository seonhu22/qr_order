package htms.Initial.common.dto;

import lombok.Data;

@Data
public class CommonAuth {
    private String resetYn;
    private String newYn;
    private String delYn;
    private String saveYn;
    private String printYn;
    private String searchYn;
}
