package htms.QROrder.common.repository;

import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.dto.FileResponse;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.core.io.Resource;

import java.util.List;

@Mapper
public interface FileMapper {
    List<FileResponse> getAttachFile(String sysId);
    List<FileInfo> getFileInfoList(String linkSysId);
    void newFile(List<FileInfo> newItems, String userId, String sysPlantCd);
    void updateFile(List<FileInfo> updateItems, String userId);
    void delFile(List<String> ids, String userId);
    List<FileInfo> getOldData(List<FileInfo> updateItems);
    FileInfo getFileInfo(String sysId);
}
