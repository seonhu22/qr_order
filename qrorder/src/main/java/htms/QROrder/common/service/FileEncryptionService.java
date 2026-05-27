package htms.QROrder.common.service;

import htms.QROrder.common.dto.FileIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.poifs.crypt.EncryptionInfo;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Slf4j
@Service
public class FileEncryptionService {

    boolean isEncrypted(List<FileIO> files) {

        for (FileIO fileIO : files) {
            String originalNm = fileIO.getFile().getOriginalFilename();
            if (originalNm == null || !originalNm.contains(".")) continue;

            String ext = originalNm.substring(originalNm.lastIndexOf(".") + 1).toLowerCase();

            // OOXML 형식(docx, xlsx, pptx): 암호화 시 ZIP → OLE2 구조로 변경됨
            // OLE2 magic: D0 CF 11 E0 / ZIP magic: 50 4B (PK)
            if (List.of("docx", "xlsx", "pptx").contains(ext)) {
                try (InputStream is = fileIO.getFile().getInputStream()) {
                    byte[] header = new byte[4];
                    if (is.read(header) == 4
                            && (header[0] & 0xFF) == 0xD0
                            && (header[1] & 0xFF) == 0xCF
                            && (header[2] & 0xFF) == 0x11
                            && (header[3] & 0xFF) == 0xE0) {
                        return true;
                    }
                }
                catch (IOException e) {
                    // 암호화 확인 실패 시 무시하고 계속 진행
                }
            }

            // 구 형식(doc, xls, ppt): POI로 OLE2 내부 EncryptionInfo 엔트리 존재 여부 확인
            if (List.of("doc", "xls", "ppt").contains(ext)) {
                try (InputStream is = fileIO.getFile().getInputStream();
                        POIFSFileSystem fs = new POIFSFileSystem(is)) {
                    new EncryptionInfo(fs);
                    return true;
                }
                catch (EncryptedDocumentException e) {
                    return true;
                }
                catch (Exception e) {
                    // EncryptionInfo 생성 실패 = 암호화 안 됨
                }
            }
        }

        return false;
    }
}
