package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class FileIOService {

    @Value("${file.upload.path}")
    private String uploadPath;

    void IOInsertFile(List<FileIO> files) {

        List<Path> saved = new ArrayList<>();

        try {
            for (FileIO ioReq : files) {

                Path dirPath = Paths.get(uploadPath + ioReq.getFilePath());
                Files.createDirectories(dirPath);

                Path savePath = dirPath.resolve(ioReq.getConvertFileNm());

                ioReq.getFile().transferTo(savePath);
                saved.add(savePath);
            }
        }
        catch (IOException e) {

            log.error("파일 저장 실패: {}", e.getMessage());

            saved.forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                }
                catch (IOException e2) {
                    log.error("파일 롤백 실패: {}", e2.getMessage());
                }
            });

            throw new RuntimeException("파일 저장 실패");
        }
    }

    void IODelFile(List<FileInfo> files) {

        files.forEach(file -> {
            try {
                Files.deleteIfExists(Paths.get(file.getFullPath()));
            }
            catch (IOException e) {
                log.error("파일 삭제 실패: {}, {}", file.getFullPath(), e.getMessage());
            }
        });
    }
}
