package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
public class FileIOService {

    @Value("${file.upload.path}")
    private String uploadPath;

    Path prepareUploadDirectory(String menuCd) {
        Path root = Path.of(uploadPath).toAbsolutePath().normalize();
        try {
            Path directory = root.resolve(String.valueOf(menuCd)).normalize();
            if (!root.equals(directory.getParent())) {
                throw new ValidationException("첨부파일 저장 경로가 올바르지 않습니다.");
            }
            Files.createDirectories(directory);
            if (!root.toRealPath().equals(directory.toRealPath().getParent())) {
                throw new ValidationException("첨부파일 저장 경로가 올바르지 않습니다.");
            }
            return directory;
        } catch (InvalidPathException e) {
            throw new ValidationException("첨부파일 저장 경로가 올바르지 않습니다.");
        } catch (IOException e) {
            throw new IllegalStateException("첨부파일 저장 디렉터리를 준비할 수 없습니다.", e);
        }
    }

    void IOInsertFile(List<FileIO> files) {

        List<Path> saved = new ArrayList<>();

        try {
            for (FileIO ioReq : files) {

                Path dirPath = Path.of(ioReq.getFilePath());

                String originalName = ioReq.getFile().getOriginalFilename();
                String ext = (originalName != null && originalName.contains("."))
                        ? originalName.substring(originalName.lastIndexOf("."))
                        : "";
                Path savePath = dirPath.resolve(ioReq.getConvertFileNm() + ext);

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

    void scheduleDelete(List<FileInfo> files) {
        var targets = files.stream().flatMap(file -> {
            var original = Map.entry(file.getSysId(), resolvePath(file, file.getFileExt()));
            if ("Y".equals(file.getPdfYn()) && !".pdf".equals(file.getFileExt())) {
                return Stream.of(original, Map.entry(file.getSysId(), resolvePath(file, ".pdf")));
            }
            return Stream.of(original);
        }).toList();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                targets.forEach(target -> deleteStoredFile(target.getKey(), target.getValue()));
            }
        });
    }

    private void deleteStoredFile(String sysId, String storedPath) {
        try {
            Path root = Path.of(uploadPath).toAbsolutePath().normalize();
            Path path = Path.of(storedPath).toAbsolutePath().normalize();
            if (!path.startsWith(root) || path.equals(root)) {
                log.warn("업로드 경로 밖 첨부파일 삭제 건너뜀: {}", sysId);
                return;
            }

            Path parent = path.getParent().toRealPath();
            if (!parent.startsWith(root.toRealPath())) {
                log.warn("업로드 경로 밖 첨부파일 삭제 건너뜀: {}", sysId);
                return;
            }
            Path target = parent.resolve(path.getFileName());
            if (!Files.isDirectory(target, LinkOption.NOFOLLOW_LINKS)) {
                Files.deleteIfExists(target);
            }
        } catch (NoSuchFileException ignored) {
            // A missing directory means the attachment is already absent.
        } catch (IOException | InvalidPathException | SecurityException e) {
            log.error("첨부파일 삭제 실패: {}, {}", sysId, e.getMessage());
        }
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
        return resolvePath(file, ext);
    }

    private String resolvePath(FileInfo file, String ext) {
        return file.getFilePath() + "/" + file.getConvertFileNm() + ext;
    }
}
