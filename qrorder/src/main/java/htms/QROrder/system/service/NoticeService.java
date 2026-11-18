package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import htms.QROrder.system.repository.NoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;
    private final AuditService auditService;
    private final FileService fileService;

    public List<NoticeResponse> getNotice(String searchKeyword,
                                            String sysPlantCd) {

        return noticeMapper.getNotice(searchKeyword, sysPlantCd);
    }

    public void newNotice(NoticeRequest noticeRequest,
                            FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        validateTarget(noticeRequest.getTarget());
        if (noticeRequest.getTarget() == null) noticeRequest.setTarget("all");
        String ULID = UlidCreator.getMonotonicUlid().toString();
        String fileUlid = UlidCreator.getMonotonicUlid().toString();
        noticeRequest.setSysId(ULID);
        noticeRequest.setFileUuid(fileUlid);

        setNewFileUlid(fileRequest, fileUlid);

        auditService.insertNewAuditTrailData(noticeRequest, noticeRequest.getSysId(), menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.newNotice(noticeRequest, userId, sysPlantCd);
        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    public void updateNotice(NoticeRequest noticeRequest,
                                FileRequest fileRequest,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        validateTarget(noticeRequest.getTarget());
        // getOldData locks this row until the transaction (including audit/files) finishes.
        NoticeResponse oldData = noticeMapper.getOldData(noticeRequest.getSysId());
        if (oldData == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
        if (noticeRequest.getTarget() == null) noticeRequest.setTarget(oldData.getTarget());
        String fileUlid = noticeRequest.getFileUuid();

        setNewFileUlid(fileRequest, fileUlid);

        auditService.insertUpdateAuditTrailData(oldData, noticeRequest, noticeRequest.getSysId(), menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.updateNotice(noticeRequest, userId, sysPlantCd);
        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    public void delNotice(List<NoticeRequest> noticeRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        noticeRequest.forEach(noticeRequest1 -> {
            log.info("sysId:{}", noticeRequest1.getSysId());
        });

        auditService.insertDeleteAuditTrailData(noticeRequest, menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.delNotice(noticeRequest, userId, sysPlantCd);
    }

    private void setNewFileUlid(FileRequest fileRequest, String fileUlid) {

        fileRequest.getNewItems().forEach(item -> {
            item.setLinkSysId(fileUlid);
        });
    }

    private void validateTarget(String target) {
        if (target != null && !List.of("all", "manager", "staff").contains(target)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 공지 수신 대상을 선택해주세요.");
        }
    }
}
