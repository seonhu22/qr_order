package htms.QROrder.common.dto;

import lombok.Data;

@Data
public class FileResponse {
    private String sysId;
    private String originalFileNm;
    private String fileSize;
    private String filePath;
    private Integer ordNo;
    private String fileExt;
    private String pdfYn;
}
