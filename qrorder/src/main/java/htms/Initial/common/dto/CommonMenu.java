package htms.Initial.common.dto;

import lombok.Data;

@Data
public class CommonMenu {
    private Long sysId;
    private Long linkSysId;
    private String menuCd;
    private String menuNm;
    private String parentMenuCd;
    private Integer ordNo;
    private Integer menuLevel;
    private String menuUrl;
    private String useYn;
    private String resetYn;
    private String newYn;
    private String delYn;
    private String saveYn;
    private String printYn;
    private String searchYn;
}
