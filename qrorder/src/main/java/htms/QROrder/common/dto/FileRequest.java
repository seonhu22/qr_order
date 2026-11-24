package htms.QROrder.common.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FileRequest {
    private String linkSysId;
    private List<FileIO> newItems = new ArrayList<>();
    private List<FileInfo> updateItems = new ArrayList<>();
    private List<FileInfo> delItems = new ArrayList<>();

    public boolean hasItems() {
        return !newItems.isEmpty() || !updateItems.isEmpty() || !delItems.isEmpty();
    }

    public String requestedLinkSysId() {
        if (linkSysId != null) {
            return linkSysId;
        }
        return newItems.stream().map(FileIO::getLinkSysId)
                .filter(id -> id != null && !id.isBlank())
                .findFirst().orElse(null);
    }
}
