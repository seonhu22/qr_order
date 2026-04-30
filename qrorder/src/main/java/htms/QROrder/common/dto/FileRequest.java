package htms.QROrder.common.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FileRequest {
    private List<FileIO> newItems = new ArrayList<>();
    private List<FileInfo> updateItems = new ArrayList<>();
    private List<FileInfo> delItems = new ArrayList<>();
}
