package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.dto.ClientQnaResponse;
import htms.QROrder.client.repository.ClientQnaMapper;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClientQnaService {

    private static final DateTimeFormatter ATTACHMENT_MONTH = DateTimeFormatter.ofPattern("/uuuu/MM");

    private final AuditService auditService;
    private final ClientQnaMapper qnaMapper;
    private final FileService fileService;

    public List<ClientQnaResponse> getQna(String searchKeyword,
                                          String sysPlantCd) {

        return qnaMapper.getQna(searchKeyword, sysPlantCd);
    }

    public void newQna(ClientQnaRequest qnaRequest,
                       FileRequest fileRequest,
                       String userId,
                       String sysPlantCd) {

        qnaRequest.setSysId(UlidCreator.getMonotonicUlid().toString());
        String fileUlid = UlidCreator.getMonotonicUlid().toString();
        qnaRequest.setFileUlid(fileUlid);

        qnaMapper.newQna(qnaRequest, userId, sysPlantCd);

        var newItems = fileRequest.getNewItems();
        if (!newItems.isEmpty()) {
            String filePath = YearMonth.now().format(ATTACHMENT_MONTH);
            for (int i = 0; i < newItems.size(); i++) {
                var item = newItems.get(i);
                item.setLinkSysId(fileUlid);
                item.setConvertFileNm(UlidCreator.getMonotonicUlid().toString());
                item.setFilePath(filePath);
                item.setOrdNo(i + 1);
            }
            fileService.saveFile(fileRequest, userId, sysPlantCd, "QNA");
        }
    }

    public void updateQna(ClientQnaRequest qnaRequest,
                          String userId,
                          String sysPlantCd) {

        if (qnaMapper.updateQna(qnaRequest, userId, sysPlantCd) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의사항을 찾을 수 없습니다.");
        }
    }

    public void delQna(ClientQnaRequest qnaRequest,
                       String userId,
                       String sysPlantCd,
                       String menuCd) {

        // auditService.insertDeleteAuditTrailData(qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        if (qnaMapper.delQna(qnaRequest, userId, sysPlantCd) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의사항을 찾을 수 없습니다.");
        }
    }
}
