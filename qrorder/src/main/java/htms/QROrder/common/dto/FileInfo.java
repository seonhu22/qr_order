package htms.QROrder.common.dto;

import lombok.Data;

@Data
public class FileInfo {
    private String sysId;
    private String linkSysId;
    private String originalFileNm;
    private String convertFileNm;
    private String fileExt;
    private String mimeType;
    private String fileSize;
    private String filePath;
    private Integer ordNo;
    private String pdfYn;
}
