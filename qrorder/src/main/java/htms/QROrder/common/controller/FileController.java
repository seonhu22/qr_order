package htms.QROrder.common.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.*;
import htms.QROrder.common.service.FileService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RestControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/api/attach_file")
public class FileController {

    private final FileService fileService;

    @GetMapping
    public List<FileResponse> getAttachFile(@RequestParam String sysId) {

        return fileService.getAttachFile(sysId);
    }

    @PostMapping
    public ResponseEntity<CommonResponse> saveFile(@ModelAttribute FileRequest fileRequest,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        fileService.saveFile(fileRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("첨부파일 저장 완료.")
                        .build()
        );
    }
}
