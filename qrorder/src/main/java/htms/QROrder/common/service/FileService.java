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
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.ByteArrayResource;

import java.util.Collections;
import java.util.List;
import java.util.Set;
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
    private final PdfConvertService pdfConvertService;
    private final FileValidationService fileValidationService;

    public List<FileResponse> getAttachFile(String sysId) {

        return fileMapper.getAttachFile(sysId);
    }

    public FileInfo getFileInfo(String sysId) {

        return fileMapper.getFileInfo(sysId);
    }

    public Resource readFile(FileInfo fileInfo) {

        return fileIOService.IOReadFile(fileInfo);
    }

    public ByteArrayResource downloadAll(String linkSysId) {

        List<FileInfo> files = fileMapper.getFileInfoList(linkSysId);
        return fileIOService.IOZipFiles(files);
    }

    public void saveFile(FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<FileIO> newItems = fileRequest.getNewItems();
        List<FileInfo> updateItems = fileRequest.getUpdateItems();
        List<FileInfo> delItems = fileRequest.getDelItems();

        if (!newItems.isEmpty()) {
            fileValidationService.validateExtensions(newItems);
            newFile(newItems, userId, sysPlantCd, menuCd);
        }
        if (!updateItems.isEmpty()) {
            updateFile(updateItems, userId, sysPlantCd, menuCd);
        }
        if (!delItems.isEmpty()) {
            delFile(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private void newFile(List<FileIO> newItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        Set<FileIO> converted = Collections.emptySet();
        if (fileValidationService.isConvertibleToPdf(newItems)) {
            fileValidationService.validateNotEncrypted(newItems);
            converted = Set.copyOf(pdfConvertService.pdfConvert(newItems));
        }

        final Set<FileIO> convertedFiles = converted;
        List<FileInfo> fileInfos = newItems.stream()
                .map(ioReq -> buildFileInfo(ioReq, convertedFiles))
                .collect(Collectors.toList());

        auditService.insertNewAuditTrailData(fileInfos, menuCd, "attach_file", userId, sysPlantCd);
        fileMapper.newFile(fileInfos, userId, sysPlantCd);
        fileIOService.IOInsertFile(newItems);
    }

    private FileInfo buildFileInfo(FileIO ioReq,
                                    Set<FileIO> convertedFiles) {

        MultipartFile file = ioReq.getFile();
        String originalName = file.getOriginalFilename();

        String ext = (originalName != null && originalName.contains("."))
                        ? originalName.substring(originalName.lastIndexOf("."))
                        : "";

        String originalNameWithoutExt = (originalName != null && originalName.contains("."))
                        ? originalName.substring(0, originalName.lastIndexOf("."))
                        : originalName;

        String convertNmWithoutExt = ioReq.getConvertFileNm().contains(".")
                        ? ioReq.getConvertFileNm().substring(0, ioReq.getConvertFileNm().lastIndexOf("."))
                        : ioReq.getConvertFileNm();

        String sizeMB = String.format("%.2f", file.getSize() / (1024.0 * 1024.0));

        FileInfo req = new FileInfo();
        req.setSysId(UlidCreator.getMonotonicUlid().toString());
        req.setOriginalFileNm(originalNameWithoutExt);
        req.setConvertFileNm(convertNmWithoutExt);
        req.setFileExt(ext);
        req.setMimeType(file.getContentType());
        req.setFileSize(sizeMB);
        req.setFilePath(uploadPath + ioReq.getFilePath());
        req.setOrdNo(ioReq.getOrdNo());
        req.setPdfYn(convertedFiles.contains(ioReq) ? "Y" : "N");

        return req;
    }

    private void updateFile(List<FileInfo> updateItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<FileInfo> oldData = fileMapper.getOldData(updateItems);

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
}
