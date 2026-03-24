package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileValidationService {

    private final FileEncryptionService fileEncryptionService;

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf",
            "png", "txt", "zip"
    );

    private static final List<String> PDF_ALLOWED_EXTENSIONS = List.of(
            "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"
    );

    void validateExtensions(List<FileIO> files) {

        boolean allAllowed = files.stream().allMatch(item -> {
            String originalNm = item.getFile().getOriginalFilename();
            if (originalNm == null || !originalNm.contains(".")) return false;
            String ext = originalNm.substring(originalNm.lastIndexOf(".") + 1).toLowerCase();
            return ALLOWED_EXTENSIONS.contains(ext);
        });

        if (!allAllowed) {
            String allowed = String.join(", ", ALLOWED_EXTENSIONS);
            throw new ValidationException("허용되지 않은 확장자입니다. 허용 확장자: " + allowed);
        }
    }

    boolean isConvertibleToPdf(List<FileIO> files) {

        return files.stream().allMatch(item -> {
            String originalNm = item.getFile().getOriginalFilename();
            if (originalNm == null || !originalNm.contains(".")) return false;
            String ext = originalNm.substring(originalNm.lastIndexOf(".") + 1).toLowerCase();
            return PDF_ALLOWED_EXTENSIONS.contains(ext);
        });
    }

    void validateNotEncrypted(List<FileIO> files) {

        if (fileEncryptionService.isEncrypted(files)) {
            throw new ValidationException("첨부한 파일중 암호화된 파일이 존재합니다.");
        }
    }
}
