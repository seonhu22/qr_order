package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
            String path = resolvePath(file);
            try {
                Files.deleteIfExists(Paths.get(path));
            }
            catch (IOException e) {
                log.error("파일 삭제 실패: {}, {}", path, e.getMessage());
            }
        });
    }

    Resource IOReadFile(FileInfo file) {
        String resolvedPath = resolvePath(file);
        try {
            Path filePath = Paths.get(resolvedPath);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.error("파일을 찾을 수 없습니다: {}", resolvedPath);
                throw new RuntimeException("파일을 찾을 수 없습니다.");
            }

            return resource;
        }
        catch (MalformedURLException e) {
            log.error("잘못된 파일 경로: {}", resolvedPath);
            throw new RuntimeException("잘못된 파일 경로입니다.");
        }
    }

    ByteArrayResource IOZipFiles(List<FileInfo> files) {

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            for (FileInfo file : files) {
                Path filePath = Paths.get(resolvePath(file));

                if (!Files.exists(filePath)) {
                    log.warn("ZIP 추가 스킵 (파일 없음): {}", filePath);
                    continue;
                }

                String entryName = file.getOriginalFileNm() + file.getFileExt();
                zos.putNextEntry(new ZipEntry(entryName));
                Files.copy(filePath, zos);
                zos.closeEntry();
            }

            zos.finish();
            return new ByteArrayResource(baos.toByteArray());

        }
        catch (IOException e) {
            log.error("ZIP 생성 실패: {}", e.getMessage());
            throw new RuntimeException("ZIP 생성 실패");
        }
    }

    private String resolvePath(FileInfo file) {
        String ext = "Y".equals(file.getPdfYn()) ? ".pdf" : file.getFileExt();
        return file.getFilePath() + "/" + file.getConvertFileNm() + ext;
    }
}
