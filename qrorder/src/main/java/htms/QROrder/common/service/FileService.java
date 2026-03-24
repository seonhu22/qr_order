package htms.QROrder.common.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.dto.FileResponse;
import htms.QROrder.common.repository.FileMapper;
import com.github.f4b6a3.ulid.UlidCreator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FileService {

    @Value("${file.upload.path}")
    private String uploadPath;

    private final FileMapper fileMapper;
    private final FileIOService fileIOService;
    private final AuditService auditService;

    public List<FileResponse> getAttachFile(String sysId) {

        return fileMapper.getAttachFile(sysId);
    }

    public void saveFile(FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<FileIO> newItems = fileRequest.getNewItems();
        List<FileInfo> updateItems = fileRequest.getUpdateItems();
        List<FileInfo> delItems = fileRequest.getDelItems();

        if(!newItems.isEmpty()){
            newFile(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()){
            updateFile(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()){
            delFile(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private void newFile(List<FileIO> newItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<FileInfo> fileInfos = newItems.stream().map(ioReq -> {

            MultipartFile file = ioReq.getFile();
            String originalName = file.getOriginalFilename();

            String ext = (originalName != null && originalName.contains("."))
                            ? originalName.substring(originalName.lastIndexOf("."))
                            : "";
            // Unit: MB
            String sizeMB = String.format("%.2f", file.getSize() / (1024.0 * 1024.0));

            FileInfo req = new FileInfo();

            req.setSysId(UlidCreator.getMonotonicUlid().toString());
            req.setOriginalFileNm(originalName);
            req.setConvertFileNm(ioReq.getConvertFileNm());
            req.setFileExt(ext);
            req.setMimeType(file.getContentType());
            req.setFileSize(sizeMB);
            req.setFilePath(uploadPath + ioReq.getFilePath());
            req.setFullPath(uploadPath + ioReq.getFilePath() + "/" + ioReq.getConvertFileNm());
            req.setOrdNo(ioReq.getOrdNo());

            return req;
        }).collect(Collectors.toList());

        auditService.insertNewAuditTrailData(fileInfos, menuCd, "attach_file", userId, sysPlantCd);
        fileMapper.newFile(fileInfos, userId, sysPlantCd);
        fileIOService.IOInsertFile(newItems);
    }

    private void updateFile(List<FileInfo> updateItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<FileInfo> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "attach_file", userId, sysPlantCd);
        fileMapper.updateFile(updateItems, userId);
    }

    private void delFile(List<FileInfo> delItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<String> ids = delItems.stream().map(FileInfo::getSysId).collect(Collectors.toList());

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "attach_file", userId, sysPlantCd);
        fileMapper.delFile(ids, userId);
        fileIOService.IODelFile(delItems);
    }

    private List<FileInfo> getOldData(List<FileInfo> updateItems) {

        return fileMapper.getOldData(updateItems);
    }
}
