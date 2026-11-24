package htms.QROrder.common.repository;

import htms.QROrder.common.dto.AttachScope;
import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.dto.FileResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface FileMapper {
    List<FileResponse> getAttachFile(String sysId);
    List<FileInfo> getFileInfoList(String linkSysId);
    void newFile(List<FileInfo> newItems, String userId, String sysPlantCd);
    List<FileInfo> lockOwned(List<String> ids, AttachScope scope);
    int updateFile(List<FileInfo> updateItems, String userId, AttachScope scope);
    int delFile(List<String> ids, String userId, AttachScope scope);
    FileInfo getFileInfo(String sysId);
}
