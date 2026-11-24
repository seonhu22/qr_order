package htms.QROrder.common.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.AttachReadScope;
import htms.QROrder.common.dto.AttachScope;
import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.dto.FileResponse;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.common.repository.FileMapper;
import com.github.f4b6a3.ulid.UlidCreator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.core.io.ByteArrayResource;

import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FileService {

    // 저장 파일명 본체: 글자(한글 포함), 숫자, 공백, - _ . ( ) 만 허용한다.
    private static final Pattern SAFE_FILE_NAME = Pattern.compile("[\\p{L}\\p{Nd} ._()-]+");

    private final FileMapper fileMapper;
    private final FileIOService fileIOService;
    private final AuditService auditService;
    private final PdfConvertService pdfConvertService;
    private final FileValidationService fileValidationService;

    /** 읽을 수 없는 부모의 첨부는 없는 첨부와 같이 빈 목록이다. */
    public List<FileResponse> getAttachFile(String sysId, AttachReadScope read) {

        return fileMapper.getAttachFile(sysId, read);
    }

    public FileInfo getFileInfo(String sysId) {

        return fileMapper.getFileInfo(sysId);
    }

    /** 읽을 수 없는 첨부와 없는 첨부를 같은 404로 돌려준다. */
    public FileInfo getReadableFileInfo(String sysId, AttachReadScope read) {

        FileInfo fileInfo = fileMapper.getReadableFileInfo(sysId, read);
        if (fileInfo == null) {
            throw attachmentNotFound();
        }
        return fileInfo;
    }

    public Resource readFile(FileInfo fileInfo) {

        return fileIOService.IOReadFile(fileInfo);
    }

    /** 읽을 수 있는 첨부가 하나도 없으면 부모가 없는 경우와 같은 404다. */
    public ByteArrayResource downloadAll(String linkSysId, AttachReadScope read) {

        List<FileInfo> files = fileMapper.getFileInfoList(linkSysId, read);
        if (files.isEmpty()) {
            throw attachmentNotFound();
        }
        return fileIOService.IOZipFiles(files);
    }

    public List<FileInfo> saveFile(FileRequest fileRequest, String userId, AttachScope scope, String menuCd) {
        List<FileIO> newItems = fileRequest.getNewItems().stream()
                .filter(item -> item.getFile() != null && !item.getFile().isEmpty())
                .toList();
        var updatesById = new LinkedHashMap<String, FileInfo>();
        fileRequest.getUpdateItems().forEach(item -> updatesById.put(item.getSysId(), item));
        var deleteIds = new HashSet<String>();
        fileRequest.getDelItems().forEach(item -> deleteIds.add(item.getSysId()));
        var ids = new HashSet<>(updatesById.keySet());
        ids.addAll(deleteIds);
        if (newItems.isEmpty() && ids.isEmpty()) {
            return List.of();
        }

        if (scope == null || scope.sysPlantCd() == null || scope.sysPlantCd().isBlank()
                || scope.linkSysId() == null || scope.linkSysId().isBlank()
                || ids.stream().anyMatch(id -> id == null || id.isBlank())
                || newItems.stream().anyMatch(item -> item.getLinkSysId() != null
                        && !item.getLinkSysId().isBlank() && !scope.linkSysId().equals(item.getLinkSysId()))) {
            throw attachmentNotFound();
        }
        List<FileInfo> owned = ids.isEmpty() ? List.of() : fileMapper.lockOwned(List.copyOf(ids), scope);
        if (owned.size() != ids.size()) {
            throw attachmentNotFound();
        }
        if (!newItems.isEmpty()) {
            fileValidationService.validateExtensions(newItems);
            fileValidationService.validateNoDuplicateFilenames(newItems);
        }
        if (!updatesById.isEmpty()
                && fileMapper.updateFile(List.copyOf(updatesById.values()), userId, scope) != updatesById.size()) {
            throw attachmentNotFound();
        }
        if (!deleteIds.isEmpty() && fileMapper.delFile(List.copyOf(deleteIds), userId, scope) != deleteIds.size()) {
            throw attachmentNotFound();
        }
        if (!newItems.isEmpty()) {
            newFile(newItems, userId, scope, menuCd);
        }

        List<FileInfo> deleted = owned.stream().filter(file -> deleteIds.contains(file.getSysId())).toList();
        if (!deleted.isEmpty()) {
            fileIOService.scheduleDelete(deleted);
        }
        return deleted;
    }

    private void newFile(List<FileIO> newItems,
                            String userId,
                            AttachScope scope,
                            String menuCd) {

        for (FileIO item : newItems) {
            String name = item.getConvertFileNm();
            if (name == null || name.isBlank() || !SAFE_FILE_NAME.matcher(name).matches()
                    || name.chars().allMatch(c -> c == '.')) {
                throw new ValidationException("첨부파일 이름이 올바르지 않습니다.");
            }
        }
        String uploadDirectory = fileIOService.prepareUploadDirectory(menuCd).toString();
        newItems.forEach(item -> {
            item.setLinkSysId(scope.linkSysId());
            item.setFilePath(uploadDirectory);
        });

        Set<FileIO> converted = Collections.emptySet();
        if (fileValidationService.isConvertibleToPdf(newItems)) {
            List<FileIO> convertibleItems = fileValidationService.filterConvertibleToPdf(newItems);
            fileValidationService.validateNotEncrypted(convertibleItems);
            converted = Set.copyOf(pdfConvertService.pdfConvert(convertibleItems));
        }

        final Set<FileIO> convertedFiles = converted;
        List<FileInfo> fileInfos = newItems.stream()
                .map(ioReq -> buildFileInfo(ioReq, convertedFiles))
                .collect(Collectors.toList());

        //auditService.insertNewAuditTrailData(fileInfos, menuCd, "attach_file", userId, scope.sysPlantCd());
        fileMapper.newFile(fileInfos, userId, scope.sysPlantCd());
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

        String sizeMB = String.format("%.2f", file.getSize() / (1024.0 * 1024.0));

        FileInfo req = new FileInfo();
        req.setSysId(UlidCreator.getMonotonicUlid().toString());
        req.setLinkSysId(ioReq.getLinkSysId());
        req.setOriginalFileNm(originalNameWithoutExt);
        req.setConvertFileNm(ioReq.getConvertFileNm());
        req.setFileExt(ext);
        req.setMimeType(file.getContentType());
        req.setFileSize(sizeMB);
        req.setFilePath(ioReq.getFilePath());
        req.setOrdNo(ioReq.getOrdNo());
        req.setPdfYn(convertedFiles.contains(ioReq) ? "Y" : "N");

        return req;
    }

    private ResponseStatusException attachmentNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다.");
    }
}
