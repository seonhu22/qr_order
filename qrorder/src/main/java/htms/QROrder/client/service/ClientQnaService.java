package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.dto.ClientQnaResponse;
import htms.QROrder.client.repository.ClientQnaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClientQnaService {

    private final AuditService auditService;
    private final ClientQnaMapper qnaMapper;

    public List<ClientQnaResponse> getQna(String searchKeyword,
                                          String sysPlantCd) {

        return qnaMapper.getQna(searchKeyword, sysPlantCd);
    }

    public void newQna(ClientQnaRequest qnaRequest,
                       String userId,
                       String sysPlantCd,
                       String menuCd) {

        String ULID = UlidCreator.getMonotonicUlid().toString();
        String FileULID = UlidCreator.getMonotonicUlid().toString();
        qnaRequest.setSysId(ULID);
        qnaRequest.setFileUlid(FileULID);

        // auditService.insertNewAuditTrailData(qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.newQna(qnaRequest, userId, sysPlantCd);
    }

    public void updateQna(ClientQnaRequest qnaRequest,
                          String userId,
                          String sysPlantCd,
                          String menuCd) {

        ClientQnaResponse oldData = qnaMapper.getOldData(qnaRequest.getSysId());

        // auditService.insertUpdateAuditTrailData(oldData, qnaRequest, qnaRequest.getSysId(),  menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.updateQna(qnaRequest, userId, sysPlantCd);
    }

    public void delQna(ClientQnaRequest qnaRequest,
                       String userId,
                       String sysPlantCd,
                       String menuCd) {

        // auditService.insertDeleteAuditTrailData(qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.delQna(qnaRequest, userId, sysPlantCd);
    }
}
