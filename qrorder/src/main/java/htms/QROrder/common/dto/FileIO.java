package htms.QROrder.common.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FileIO {
    private String sysId;
    private String linkSysId;
    private MultipartFile file;
    private String convertFileNm;
    private String filePath;
    private Integer ordNo;
}
