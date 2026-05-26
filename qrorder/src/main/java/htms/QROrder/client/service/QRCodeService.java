package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.QRCodeMapper;
import htms.QROrder.common.exception.DuplicateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class QRCodeService {

    private final AuditService auditService;
    private final QRCodeMapper qrCodeMapper;

    public List<QRCodeResponse> getQRCode(String sysPlantCd) {

        return qrCodeMapper.getQRCode(sysPlantCd);
    }

    public void saveQRCode(QRCodeRequest qrCodeRequest,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        List<QRCodeItem> newItems = qrCodeRequest.getNewItems();
        List<QRCodeItem> updateItems = qrCodeRequest.getUpdateItems();
        List<QRCodeItem> delItems = qrCodeRequest.getDelItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<QRCodeItem> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                        .map(QRCodeItem::getDescription)
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newQRCode(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateQRCode(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delQRCode(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private void newQRCode(List<QRCodeItem> newItems,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        newItems.forEach(item -> {
            String ULID = UlidCreator.getMonotonicUlid().toString();
            item.setSysId(ULID);
        });

        auditService.insertNewAuditTrailData(newItems, menuCd, "qr_code", userId, sysPlantCd);
        qrCodeMapper.newQRCode(newItems, userId, sysPlantCd, menuCd);
    }

    private void updateQRCode(List<QRCodeItem> updateItems,
                                 String userId,
                                 String sysPlantCd,
                                 String menuCd) {

        List<QRCodeItem> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "qr_code", userId, sysPlantCd);
        qrCodeMapper.updateQRCode(updateItems, userId, sysPlantCd, menuCd);
    }

    private void delQRCode(List<QRCodeItem> delItems,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "qr_code", userId, sysPlantCd);
        qrCodeMapper.delQRCode(delItems, userId, sysPlantCd, menuCd);
    }

    private List<QRCodeItem> getDuplicateData(List<QRCodeItem> qrCodeItem) {

        return qrCodeMapper.getDuplicateData(qrCodeItem);
    }

    private boolean duplicateChk(List<QRCodeItem> newItems) {

        return qrCodeMapper.duplicateChk(newItems);
    }

    private List<QRCodeItem> getOldData(List<QRCodeItem> qrCodeItem) {

        return qrCodeMapper.getOldData(qrCodeItem);
    }
}
