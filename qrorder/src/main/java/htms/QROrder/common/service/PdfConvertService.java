package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jodconverter.core.DocumentConverter;
import org.jodconverter.core.document.DefaultDocumentFormatRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfConvertService {

    @Value("${file.upload.path}")
    private String uploadPath;

    private final DocumentConverter documentConverter;

    List<FileIO> pdfConvert(List<FileIO> files) {
        List<FileIO> converted = new ArrayList<>();

        for (FileIO file : files) {
            Path tempInput = null;

            try {
                // MultipartFile → 임시 파일로 저장
                tempInput = Files.createTempFile("convert_", "_" + file.getFile().getOriginalFilename());
                file.getFile().transferTo(tempInput);

                // 출력 경로: uploadPath + filePath + / + convertFileNm + .pdf
                Path outputPath = Paths.get(uploadPath + file.getFilePath() + "/" + file.getConvertFileNm() + ".pdf");
                Files.createDirectories(outputPath.getParent());

                // PDF 변환
                documentConverter.convert(tempInput.toFile())
                        .to(outputPath.toFile())
                        .as(DefaultDocumentFormatRegistry.PDF)
                        .execute();

                log.info("PDF 변환 성공: {}", outputPath);
                converted.add(file);

            }
            catch (Exception e) {
                log.error("PDF 변환 실패: {}", e.getMessage());

            }
            finally {
                // 임시 입력 파일 정리
                if (tempInput != null) {
                    try {
                        Files.deleteIfExists(tempInput);
                    }
                    catch (Exception e) {
                        log.error("임시 파일 삭제 실패: {}", e.getMessage());
                    }
                }
            }
        }

        return converted;
    }
}
