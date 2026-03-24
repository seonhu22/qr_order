package htms.QROrder.common.dto;

import lombok.Data;

import java.util.List;

@Data
public class FileRequest {
    private List<FileIO> newItems;
    private List<FileInfo> updateItems;
    private List<FileInfo> delItems;
}
