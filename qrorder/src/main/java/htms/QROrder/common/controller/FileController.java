package htms.QROrder.common.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.service.MenuOptionDetailService;
import htms.QROrder.common.dto.*;
import htms.QROrder.common.service.FileService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@RestController
@RestControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/api/attach_file")
public class FileController {

    private final FileService fileService;
    private final MenuOptionDetailService menuOptionDetailService;

    @GetMapping
    public List<FileResponse> getAttachFile(@RequestParam String linkSysId, HttpSession session) {

        return fileService.getAttachFile(linkSysId, readScope(session));
    }

    @PostMapping("/save")
    public ResponseEntity<CommonResponse> saveFile(@ModelAttribute FileRequest fileRequest,
                                                    @RequestParam("linkSysId") String linkSysId,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionDetailService.saveOptionDetailAttachments(
                fileRequest, linkSysId, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("첨부파일 저장 완료.")
                        .build()
        );
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String sysId, HttpSession session) {

        FileInfo fileInfo = fileService.getReadableFileInfo(sysId, readScope(session));
        Resource resource = fileService.readFile(fileInfo);

        String downloadName = fileInfo.getOriginalFileNm() + fileInfo.getFileExt();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(downloadName, StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .contentType(MediaType.parseMediaType(fileInfo.getMimeType()))
                .body(resource);
    }

    @GetMapping("/download_all")
    public ResponseEntity<ByteArrayResource> downloadAllFile(@RequestParam String linkSysId, HttpSession session) {

        ByteArrayResource resource = fileService.downloadAll(linkSysId, readScope(session));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("attachments.zip", StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .contentType(MediaType.parseMediaType("application/zip"))
                .contentLength(resource.contentLength())
                .body(resource);
    }

    @GetMapping("/view")
    public ResponseEntity<Resource> viewFile(@RequestParam String sysId, HttpSession session) {

        FileInfo fileInfo = fileService.getReadableFileInfo(sysId, readScope(session));
        Resource resource = fileService.readFile(fileInfo);

        String contentType = "Y".equals(fileInfo.getPdfYn()) ? "application/pdf" : fileInfo.getMimeType();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().build().toString())
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private static AttachReadScope readScope(HttpSession session) {
        return AttachReadScope.of((Login) session.getAttribute("loginUser"));
    }
}
